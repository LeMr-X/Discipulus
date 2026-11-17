import express, { type NextFunction, type Request, type Response } from 'express'
import { z } from 'zod'
import type { AlunosRepository } from './alunos/alunosRepository.js'
import type { PainelService } from './alunos/painelService.js'
import type { AuthService } from './auth/authService.js'
import type { Tokens } from './auth/token.js'
import type { CursosRepository } from './cursos/cursosRepository.js'
import { ErroHttp, traduzirErroMysql } from './erros.js'
import { autenticar, idDaRota, sessaoDe } from './http.js'
import type { NotasRepository } from './notas/notasRepository.js'
import { rotasAlunos } from './rotas/alunos.js'
import { rotasCursos, rotasDisciplinas } from './rotas/cursos.js'
import { rotasNotas } from './rotas/notas.js'

export interface Dependencias {
  auth: AuthService
  painel: PainelService
  tokens: Tokens
  alunos: AlunosRepository
  cursos: CursosRepository
  notas: NotasRepository
  /** Confere se o banco responde (rota /api/saude). */
  bancoOk?: () => Promise<boolean>
}

const corpoLogin = z.object({
  login: z.string().trim().min(1).max(100),
  senha: z.string().min(1).max(200),
})

/** Status HTTP de cada recusa de login */
const STATUS_RECUSA = {
  USUARIO_INEXISTENTE: 401,
  SENHA_INVALIDA: 401,
  USUARIO_INATIVO: 403,
  USUARIO_BLOQUEADO: 423, // Locked
} as const

export function criarApp(deps: Dependencias) {
  const app = express()
  app.disable('x-powered-by')
  app.set('trust proxy', 'loopback') // IP real atrás do proxy do Vite
  app.use(express.json({ limit: '10kb' }))

  const logado = autenticar(deps.tokens)

  app.get('/api/saude', async (_req, res) => {
    const banco = deps.bancoOk ? await deps.bancoOk() : true
    res.status(banco ? 200 : 503).json({ api: 'ok', banco: banco ? 'ok' : 'indisponivel' })
  })

  app.post('/api/auth/login', async (req, res) => {
    const corpo = corpoLogin.safeParse(req.body)
    if (!corpo.success) {
      res.status(400).json({ erro: 'Informe login e senha.' })
      return
    }
    const resultado = await deps.auth.login(corpo.data.login, corpo.data.senha, req.ip ?? null)
    res.status(resultado.ok ? 200 : STATUS_RECUSA[resultado.motivo]).json(resultado)
  })

  app.get('/api/auth/eu', logado, (_req, res) => {
    res.json(sessaoDe(res))
  })

  // Painel: o aluno vê o próprio; funcionário vê qualquer um
  app.get('/api/alunos/:id/painel', logado, async (req, res) => {
    const r = await deps.painel.buscar(sessaoDe(res), idDaRota(req))
    if (r.tipo === 'proibido') res.status(403).json({ erro: 'Você não tem acesso a este painel.' })
    else if (r.tipo === 'nao-encontrado') res.status(404).json({ erro: 'Aluno não encontrado.' })
    else res.json(r.painel)
  })

  // Área do funcionário
  app.use('/api/alunos', logado, rotasAlunos(deps.alunos, deps.cursos))
  app.use('/api/cursos', logado, rotasCursos(deps.cursos))
  app.use('/api/disciplinas/:id/notas', logado, rotasNotas(deps.notas))
  app.use('/api/disciplinas', logado, rotasDisciplinas(deps.cursos))

  app.use('/api', (_req, res) => {
    res.status(404).json({ erro: 'Rota não encontrada.' })
  })

  app.use((erro: unknown, _req: Request, res: Response, _next: NextFunction) => {
    // JSON malformado no corpo
    if ((erro as { type?: string })?.type === 'entity.parse.failed') {
      res.status(400).json({ erro: 'Corpo da requisição inválido.' })
      return
    }
    const conhecido = erro instanceof ErroHttp ? erro : traduzirErroMysql(erro)
    if (conhecido) {
      res.status(conhecido.status).json({ erro: conhecido.message })
      return
    }
    // Erro inesperado: registra no console e não vaza detalhes para o cliente
    console.error(erro)
    res.status(500).json({ erro: 'Erro interno. Tente novamente.' })
  })

  return app
}
