import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { criarPainelService } from '../src/alunos/painelService.js'
import { criarApp } from '../src/app.js'
import { criarAuthService } from '../src/auth/authService.js'
import { criarTokens } from '../src/auth/token.js'
import { ana, criarRepoFake, painelAna, SENHA } from './fakes.js'
import { criarBancoFake } from './fakesFuncionario.js'

const tokens = criarTokens('segredo-de-teste', '1h')

function montarApp(bancoOk?: () => Promise<boolean>) {
  const { repo } = criarRepoFake()
  const banco = criarBancoFake()
  return criarApp({
    auth: criarAuthService(repo, tokens),
    painel: criarPainelService({ buscarPainel: async (id) => (id === 1 ? painelAna : null) }),
    tokens,
    alunos: banco.repoAlunos,
    cursos: banco.repoCursos,
    notas: banco.repoNotas,
    bancoOk,
  })
}

const tokenAna = tokens.gerar(ana)
const tokenBruno = tokens.gerar({ ...ana, idUsuario: 6, idAluno: 2 })
const tokenProfessora = tokens.gerar({ ...ana, idUsuario: 3, perfil: 'FUNCIONARIO', idAluno: null, cargo: 'PROFESSOR' })

describe('POST /api/auth/login', () => {
  it('200 com token quando login e senha estão certos', async () => {
    const res = await request(montarApp()).post('/api/auth/login').send({ login: '2026000001', senha: SENHA })
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.token).toEqual(expect.any(String))
    expect(res.body.usuario).not.toHaveProperty('senhaHash')
  })

  it('401 com senha errada', async () => {
    const res = await request(montarApp()).post('/api/auth/login').send({ login: '2026000001', senha: 'x' })
    expect(res.status).toBe(401)
    expect(res.body).toMatchObject({ ok: false, motivo: 'SENHA_INVALIDA', tentativasRestantes: 2 })
  })

  it('423 quando o usuário fica bloqueado', async () => {
    const app = montarApp()
    for (let i = 0; i < 2; i++) await request(app).post('/api/auth/login').send({ login: '2026000001', senha: 'x' })
    const res = await request(app).post('/api/auth/login').send({ login: '2026000001', senha: 'x' })
    expect(res.status).toBe(423)
    expect(res.body.motivo).toBe('USUARIO_BLOQUEADO')
  })

  it('403 para usuário inativo', async () => {
    const res = await request(montarApp()).post('/api/auth/login').send({ login: '2026000006', senha: SENHA })
    expect(res.status).toBe(403)
  })

  it('401 para login inexistente', async () => {
    const res = await request(montarApp()).post('/api/auth/login').send({ login: 'ninguem', senha: SENHA })
    expect(res.status).toBe(401)
    expect(res.body.motivo).toBe('USUARIO_INEXISTENTE')
  })

  it.each([
    [{}],
    [{ login: '', senha: SENHA }],
    [{ login: '2026000001' }],
    [{ login: 'x'.repeat(101), senha: SENHA }],
  ])('400 quando o corpo é inválido: %j', async (corpo) => {
    const res = await request(montarApp()).post('/api/auth/login').send(corpo)
    expect(res.status).toBe(400)
  })
})

describe('GET /api/alunos/:id/painel', () => {
  it('401 sem token', async () => {
    const res = await request(montarApp()).get('/api/alunos/1/painel')
    expect(res.status).toBe(401)
  })

  it('401 com token inválido', async () => {
    const res = await request(montarApp()).get('/api/alunos/1/painel').set('Authorization', 'Bearer invalido')
    expect(res.status).toBe(401)
  })

  it('200 quando a aluna pede o próprio painel', async () => {
    const res = await request(montarApp()).get('/api/alunos/1/painel').set('Authorization', `Bearer ${tokenAna}`)
    expect(res.status).toBe(200)
    expect(res.body.aluno.nome).toBe('Ana Souza')
  })

  it('403 quando um aluno pede o painel de outro', async () => {
    const res = await request(montarApp()).get('/api/alunos/1/painel').set('Authorization', `Bearer ${tokenBruno}`)
    expect(res.status).toBe(403)
  })

  it('200 para funcionário', async () => {
    const res = await request(montarApp()).get('/api/alunos/1/painel').set('Authorization', `Bearer ${tokenProfessora}`)
    expect(res.status).toBe(200)
  })

  it('404 para aluno que não existe', async () => {
    const res = await request(montarApp()).get('/api/alunos/999/painel').set('Authorization', `Bearer ${tokenProfessora}`)
    expect(res.status).toBe(404)
  })

  it('400 para id inválido', async () => {
    const res = await request(montarApp()).get('/api/alunos/abc/painel').set('Authorization', `Bearer ${tokenProfessora}`)
    expect(res.status).toBe(400)
  })
})

describe('Outras rotas', () => {
  it('GET /api/auth/eu devolve a sessão do token', async () => {
    const res = await request(montarApp()).get('/api/auth/eu').set('Authorization', `Bearer ${tokenAna}`)
    expect(res.body).toEqual({ idUsuario: 5, perfil: 'ALUNO', idAluno: 1, cargo: null })
  })

  it('GET /api/saude responde 200 com banco ok e 503 sem banco', async () => {
    expect((await request(montarApp(async () => true)).get('/api/saude')).status).toBe(200)
    expect((await request(montarApp(async () => false)).get('/api/saude')).status).toBe(503)
  })

  it('404 em JSON para rota desconhecida', async () => {
    const res = await request(montarApp()).get('/api/nada')
    expect(res.status).toBe(404)
    expect(res.body.erro).toBeDefined()
  })

  it('500 sem vazar detalhes quando algo quebra', async () => {
    const banco = criarBancoFake()
    const app = criarApp({
      auth: { login: async () => { throw new Error('conexão recusada pelo MySQL') } },
      painel: criarPainelService({ buscarPainel: async () => null }),
      tokens,
      alunos: banco.repoAlunos,
      cursos: banco.repoCursos,
      notas: banco.repoNotas,
    })
    const original = console.error
    console.error = () => {}
    const res = await request(app).post('/api/auth/login').send({ login: 'a', senha: 'b' })
    console.error = original
    expect(res.status).toBe(500)
    expect(JSON.stringify(res.body)).not.toContain('MySQL')
  })
})
