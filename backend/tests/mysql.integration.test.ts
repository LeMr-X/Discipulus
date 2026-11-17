// Testes de integração com o MySQL real.
// Só rodam com DB_TESTE=1 e o banco criado pelos scripts de database/.
//   DB_TESTE=1 DB_PASSWORD=suasenha npm test

import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { criarPainelRepository } from '../src/alunos/painelRepository.js'
import { criarAuthRepository } from '../src/auth/authRepository.js'
import { criarAuthService } from '../src/auth/authService.js'
import { criarTokens } from '../src/auth/token.js'
import { criarPool, paraIso } from '../src/db.js'

const ativo = process.env.DB_TESTE === '1'

describe.skipIf(!ativo)('Integração com MySQL', () => {
  const pool = criarPool({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME ?? 'sistema_alunos',
  })
  const authRepo = criarAuthRepository(pool)
  const auth = criarAuthService(authRepo, criarTokens('segredo-de-teste', '1h'))
  const painel = criarPainelRepository(pool)

  // Cada teste começa sem falhas nem bloqueios
  beforeEach(async () => {
    await pool.query("UPDATE usuario SET tentativas_falhas = 0, bloqueado_ate = NULL WHERE login LIKE '2026%'")
  })
  afterAll(async () => {
    await pool.query("UPDATE usuario SET tentativas_falhas = 0, bloqueado_ate = NULL WHERE login LIKE '2026%'")
    await pool.end()
  })

  it('faz login com o hash BCrypt gravado no banco', async () => {
    const r = await auth.login('2026000003', 'Senha@123', '127.0.0.1')
    expect(r).toMatchObject({ ok: true, usuario: { nome: 'Camila Ferreira', perfil: 'ALUNO', idAluno: 3 } })
  })

  it('a procedure conta as falhas e bloqueia na 3ª', async () => {
    expect(await auth.login('2026000003', 'errada', null)).toMatchObject({ tentativasRestantes: 2 })
    expect(await auth.login('2026000003', 'errada', null)).toMatchObject({ tentativasRestantes: 1 })
    expect(await auth.login('2026000003', 'errada', null)).toMatchObject({ motivo: 'USUARIO_BLOQUEADO' })
    expect(await auth.login('2026000003', 'Senha@123', null)).toMatchObject({ motivo: 'USUARIO_BLOQUEADO' })
  })

  it('recusa o usuário inativo do banco', async () => {
    expect(await auth.login('2026000006', 'Senha@123', null)).toEqual({ ok: false, motivo: 'USUARIO_INATIVO' })
  })

  it('grava cada tentativa no log_acesso', async () => {
    const login = `teste-${Date.now()}`
    await auth.login(login, 'x', '10.1.2.3')
    const [linhas] = await pool.query<any[]>('SELECT motivo, ip, sucesso FROM log_acesso WHERE login_informado = ?', [login])
    expect(linhas).toEqual([{ motivo: 'USUARIO_INEXISTENTE', ip: '10.1.2.3', sucesso: 0 }])
  })

  it('monta o painel a partir da view vw_boletim', async () => {
    const p = await painel.buscarPainel(2)
    expect(p?.aluno.nome).toBe('Bruno Costa')
    expect(p?.matricula).toMatchObject({ curso: 'Ciência da Computação', status: 'ATIVA' })
    expect(p?.boletim).toEqual([
      { disciplina: 'Banco de Dados', semestre: 3, a1: 5, a2: 6, a3: 4.5, media: 5.17, situacao: 'REPROVADO' },
    ])
    expect(p?.historico[0]).toMatchObject({ status: 'ATIVA', curso: 'Ciência da Computação' })
    expect(p?.historico[0].data).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/)
  })

  it('mostra matrícula trancada e boletim vazio', async () => {
    const p = await painel.buscarPainel(6)
    expect(p?.matricula?.status).toBe('TRANCADA')
    expect(p?.boletim).toEqual([])
    expect(p?.historico.map((h) => h.status)).toEqual(['ATIVA', 'TRANCADA'])
  })

  it('devolve null para aluno inexistente', async () => {
    expect(await painel.buscarPainel(9999)).toBeNull()
  })

  it('converte data do MySQL para ISO', () => {
    expect(paraIso('2026-02-10 09:12:00')).toBe('2026-02-10T09:12:00')
  })
})
