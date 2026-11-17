import bcrypt from 'bcryptjs'
import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { criarPainelService } from '../src/alunos/painelService.js'
import { criarApp } from '../src/app.js'
import { criarAuthService } from '../src/auth/authService.js'
import { criarTokens } from '../src/auth/token.js'
import type { Cargo } from '../src/tipos.js'
import { ana, criarRepoFake } from './fakes.js'
import { criarBancoFake } from './fakesFuncionario.js'

const tokens = criarTokens('segredo-de-teste', '1h')
const token = (cargo: Cargo) => `Bearer ${tokens.gerar({ ...ana, idUsuario: 3, perfil: 'FUNCIONARIO', idAluno: null, cargo })}`
const SECRETARIA = token('SECRETARIA')
const PROFESSOR = token('PROFESSOR')
const ALUNA = `Bearer ${tokens.gerar(ana)}`

let banco: ReturnType<typeof criarBancoFake>
let app: ReturnType<typeof criarApp>

beforeEach(() => {
  banco = criarBancoFake()
  app = criarApp({
    auth: criarAuthService(criarRepoFake().repo, tokens),
    painel: criarPainelService({ buscarPainel: async () => null }),
    tokens,
    alunos: banco.repoAlunos,
    cursos: banco.repoCursos,
    notas: banco.repoNotas,
  })
})

const novoAluno = { nome: 'Gabriel Nunes', cpf: '111.222.333-96', email: 'gabriel@aluno.edu.br', senhaInicial: 'Inicial@2026', idCurso: 1 }

describe('Alunos', () => {
  it('lista e busca por nome', async () => {
    const res = await request(app).get('/api/alunos?busca=Ana').set('Authorization', PROFESSOR)
    expect(res.status).toBe(200)
    expect(res.body.map((a: { nome: string }) => a.nome)).toEqual(['Ana Souza'])
  })

  it('aluno não acessa a área do funcionário', async () => {
    expect((await request(app).get('/api/alunos').set('Authorization', ALUNA)).status).toBe(403)
  })

  it('secretaria cadastra aluno: gera RA e guarda só o hash da senha', async () => {
    const res = await request(app).post('/api/alunos').set('Authorization', SECRETARIA).send(novoAluno)
    expect(res.status).toBe(201)
    expect(res.body).toEqual({ idAluno: 2, ra: '2026000002' })
    expect(banco.hashes[0]).not.toBe(novoAluno.senhaInicial)
    expect(await bcrypt.compare(novoAluno.senhaInicial, banco.hashes[0])).toBe(true)
    expect(banco.alunos[1].cpf).toBe('11122233396')
  })

  it('professor não pode cadastrar aluno', async () => {
    const res = await request(app).post('/api/alunos').set('Authorization', PROFESSOR).send(novoAluno)
    expect(res.status).toBe(403)
  })

  it('recusa cadastro com dados inválidos', async () => {
    const res = await request(app).post('/api/alunos').set('Authorization', SECRETARIA).send({ ...novoAluno, cpf: '12' })
    expect(res.status).toBe(400)
    expect(res.body.erro).toBe('O CPF deve ter 11 dígitos.')
  })

  it('recusa matrícula em curso inativo', async () => {
    const res = await request(app).post('/api/alunos').set('Authorization', SECRETARIA).send({ ...novoAluno, idCurso: 2 })
    expect(res.status).toBe(422)
    expect(res.body.erro).toMatch(/inativo/)
  })

  it('mostra detalhe e 404 para aluno inexistente', async () => {
    expect((await request(app).get('/api/alunos/1').set('Authorization', PROFESSOR)).body.ra).toBe('2026000001')
    expect((await request(app).get('/api/alunos/99').set('Authorization', PROFESSOR)).status).toBe(404)
  })

  it('atualiza dados do aluno', async () => {
    const res = await request(app).put('/api/alunos/1').set('Authorization', SECRETARIA).send({ nome: 'Ana Souza Lima', cpf: '12345678901', email: 'ana@aluno.edu.br', cidade: 'Palhoça' })
    expect(res.status).toBe(204)
    expect(banco.alunos[0]).toMatchObject({ nome: 'Ana Souza Lima', cidade: 'Palhoça', telefone: null })
    expect((await request(app).put('/api/alunos/99').set('Authorization', SECRETARIA).send({ nome: 'Fulano', cpf: '12345678901', email: 'a@b.com' })).status).toBe(404)
  })

  it('exclui aluno', async () => {
    expect((await request(app).delete('/api/alunos/1').set('Authorization', SECRETARIA)).status).toBe(204)
    expect(banco.alunos).toHaveLength(0)
    expect((await request(app).delete('/api/alunos/1').set('Authorization', SECRETARIA)).status).toBe(404)
  })

  it('tranca matrícula e recusa status inválido', async () => {
    expect((await request(app).patch('/api/alunos/1/matriculas/1').set('Authorization', SECRETARIA).send({ status: 'TRANCADA' })).status).toBe(204)
    expect(banco.alunos[0].matriculas[0].status).toBe('TRANCADA')
    expect((await request(app).patch('/api/alunos/1/matriculas/1').set('Authorization', SECRETARIA).send({ status: 'PAUSADA' })).status).toBe(400)
    expect((await request(app).patch('/api/alunos/1/matriculas/7').set('Authorization', SECRETARIA).send({ status: 'ATIVA' })).status).toBe(404)
  })

  it('matricula em outro curso, mas não duas vezes no mesmo', async () => {
    banco.cursos.push({ idCurso: 3, nome: 'ADS', categoria: 'TECNOLOGO', duracaoSemestres: 5, status: 'ATIVO', qtdDisciplinas: 0, qtdMatriculas: 0 })
    expect((await request(app).post('/api/alunos/1/matriculas').set('Authorization', SECRETARIA).send({ idCurso: 3 })).status).toBe(201)
    const dup = await request(app).post('/api/alunos/1/matriculas').set('Authorization', SECRETARIA).send({ idCurso: 1 })
    expect(dup.status).toBe(409)
    expect(dup.body.erro).toBe('O aluno já está matriculado neste curso.')
    expect((await request(app).post('/api/alunos/99/matriculas').set('Authorization', SECRETARIA).send({ idCurso: 1 })).status).toBe(404)
  })

  it('desativa e reativa o acesso ao portal', async () => {
    expect((await request(app).patch('/api/alunos/1/acesso').set('Authorization', SECRETARIA).send({ ativo: false })).status).toBe(204)
    expect(banco.alunos[0].acesso?.ativo).toBe(false)
    expect((await request(app).patch('/api/alunos/1/acesso').set('Authorization', SECRETARIA).send({ ativo: 'sim' })).status).toBe(400)
    expect((await request(app).patch('/api/alunos/99/acesso').set('Authorization', SECRETARIA).send({ ativo: true })).status).toBe(404)
  })

  it('recusa JSON malformado', async () => {
    const res = await request(app).post('/api/alunos').set('Authorization', SECRETARIA).set('Content-Type', 'application/json').send('{"nome":')
    expect(res.status).toBe(400)
  })
})

describe('Cursos e disciplinas', () => {
  const curso = { nome: 'Engenharia de Software', categoria: 'BACHARELADO', duracaoSemestres: 8 }

  it('lista cursos para qualquer funcionário', async () => {
    const res = await request(app).get('/api/cursos').set('Authorization', PROFESSOR)
    expect(res.body).toHaveLength(2)
  })

  it('cria, edita e exclui curso sem matrículas', async () => {
    const criado = await request(app).post('/api/cursos').set('Authorization', SECRETARIA).send(curso)
    expect(criado.status).toBe(201)
    const id = criado.body.idCurso
    expect((await request(app).put(`/api/cursos/${id}`).set('Authorization', SECRETARIA).send({ ...curso, status: 'INATIVO' })).status).toBe(204)
    expect(banco.cursos.find((c) => c.idCurso === id)?.status).toBe('INATIVO')
    expect((await request(app).delete(`/api/cursos/${id}`).set('Authorization', SECRETARIA)).status).toBe(204)
  })

  it('não exclui curso com matrículas', async () => {
    const res = await request(app).delete('/api/cursos/1').set('Authorization', SECRETARIA)
    expect(res.status).toBe(409)
    expect(res.body.erro).toMatch(/inativo/)
  })

  it('404 ao editar ou excluir curso inexistente', async () => {
    expect((await request(app).put('/api/cursos/99').set('Authorization', SECRETARIA).send(curso)).status).toBe(404)
    expect((await request(app).delete('/api/cursos/99').set('Authorization', SECRETARIA)).status).toBe(404)
  })

  it('não reduz a duração abaixo do semestre da última disciplina', async () => {
    const res = await request(app).put('/api/cursos/1').set('Authorization', SECRETARIA).send({ ...curso, duracaoSemestres: 4 })
    expect(res.status).toBe(422)
  })

  it('lista, cria e edita disciplinas respeitando a duração do curso', async () => {
    expect((await request(app).get('/api/cursos/1/disciplinas').set('Authorization', PROFESSOR)).body).toHaveLength(2)
    expect((await request(app).get('/api/cursos/99/disciplinas').set('Authorization', PROFESSOR)).status).toBe(404)

    const nova = { nome: 'Compiladores', cargaHoraria: 80, semestre: 7 }
    const criada = await request(app).post('/api/cursos/1/disciplinas').set('Authorization', SECRETARIA).send(nova)
    expect(criada.status).toBe(201)
    expect((await request(app).post('/api/cursos/1/disciplinas').set('Authorization', SECRETARIA).send({ ...nova, semestre: 9 })).status).toBe(422)
    expect((await request(app).post('/api/cursos/99/disciplinas').set('Authorization', SECRETARIA).send(nova)).status).toBe(404)

    const id = criada.body.idDisciplina
    expect((await request(app).put(`/api/disciplinas/${id}`).set('Authorization', SECRETARIA).send({ ...nova, cargaHoraria: 60 })).status).toBe(204)
    expect((await request(app).put(`/api/disciplinas/${id}`).set('Authorization', SECRETARIA).send({ ...nova, semestre: 12 })).status).toBe(422)
    expect((await request(app).put('/api/disciplinas/99').set('Authorization', SECRETARIA).send(nova)).status).toBe(404)
  })

  it('exclui disciplina sem notas e bloqueia a que tem notas', async () => {
    expect((await request(app).delete('/api/disciplinas/1').set('Authorization', SECRETARIA)).status).toBe(204)
    expect((await request(app).delete('/api/disciplinas/2').set('Authorization', SECRETARIA)).status).toBe(409)
    expect((await request(app).delete('/api/disciplinas/99').set('Authorization', SECRETARIA)).status).toBe(404)
  })
})

describe('Notas', () => {
  it('professor vê a planilha da disciplina', async () => {
    const res = await request(app).get('/api/disciplinas/2/notas').set('Authorization', PROFESSOR)
    expect(res.status).toBe(200)
    expect(res.body.alunos[0]).toMatchObject({ nome: 'Ana Souza', a1: 8.5, a2: null })
    expect((await request(app).get('/api/disciplinas/99/notas').set('Authorization', PROFESSOR)).status).toBe(404)
  })

  it('secretaria não lança notas', async () => {
    const res = await request(app).put('/api/disciplinas/2/notas').set('Authorization', SECRETARIA).send({ idAluno: 1, avaliacao: 'A2', nota: 7 })
    expect(res.status).toBe(403)
  })

  it('lança, corrige e apaga uma nota', async () => {
    const lancar = (nota: number | null) => request(app).put('/api/disciplinas/2/notas').set('Authorization', PROFESSOR).send({ idAluno: 1, avaliacao: 'A2', nota })
    expect((await lancar(7)).status).toBe(204)
    expect((await lancar(7.5)).status).toBe(204)
    expect(banco.notas.filter((n) => n.avaliacao === 'A2')).toEqual([{ idDisciplina: 2, idAluno: 1, avaliacao: 'A2', nota: 7.5, idUsuario: 3 }])
    expect((await lancar(null)).status).toBe(204)
    expect(banco.notas.filter((n) => n.avaliacao === 'A2')).toEqual([])
  })

  it('recusa nota fora de 0 a 10', async () => {
    const res = await request(app).put('/api/disciplinas/2/notas').set('Authorization', PROFESSOR).send({ idAluno: 1, avaliacao: 'A2', nota: 11 })
    expect(res.status).toBe(400)
  })

  it('o trigger do banco barra nota em matrícula trancada (422)', async () => {
    banco.alunos[0].matriculas[0].status = 'TRANCADA'
    const res = await request(app).put('/api/disciplinas/2/notas').set('Authorization', PROFESSOR).send({ idAluno: 1, avaliacao: 'A2', nota: 8 })
    expect(res.status).toBe(422)
    expect(res.body.erro).toMatch(/ATIVA/)
  })
})
