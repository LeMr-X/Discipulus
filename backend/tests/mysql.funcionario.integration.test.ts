// Integração com o MySQL real: área do funcionário.
// Só roda com DB_TESTE=1 (veja mysql.integration.test.ts).

import { afterAll, describe, expect, it } from 'vitest'
import { criarAlunosRepository } from '../src/alunos/alunosRepository.js'
import { criarPainelRepository } from '../src/alunos/painelRepository.js'
import { criarAuthRepository } from '../src/auth/authRepository.js'
import { criarAuthService } from '../src/auth/authService.js'
import { criarTokens } from '../src/auth/token.js'
import { criarCursosRepository } from '../src/cursos/cursosRepository.js'
import { criarPool } from '../src/db.js'
import { traduzirErroMysql } from '../src/erros.js'
import { criarNotasRepository } from '../src/notas/notasRepository.js'

const ativo = process.env.DB_TESTE === '1'
const HASH_SENHA_TESTE = '$2a$10$GHxXN0w.wxONTX32KCFh2eSUGQWnwRwbFnWvafdmyMFF.wU2ChzwC' // "Senha@123", igual ao 03_dados.sql

describe.skipIf(!ativo)('Integração com MySQL: área do funcionário', () => {
  const pool = criarPool({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME ?? 'sistema_alunos',
  })
  const auth = criarAuthService(criarAuthRepository(pool), criarTokens('segredo-de-teste', '1h'))
  const painel = criarPainelRepository(pool)
  const alunos = criarAlunosRepository(pool)
  const cursos = criarCursosRepository(pool)
  const notas = criarNotasRepository(pool)
  afterAll(() => pool.end())

  const dados = {
    nome: 'Teste Integração',
    cpf: '00011122233',
    email: `integ-${Date.now()}@aluno.edu.br`,
    telefone: null,
    dataNascimento: '2003-04-05',
    logradouro: null,
    numero: null,
    bairro: null,
    cidade: 'Florianópolis',
    uf: 'SC',
    cep: null,
  }

  it('cadastra aluno com RA, matrícula e login; depois exclui em cascata', async () => {
    const { idAluno, ra } = await alunos.criar({ ...dados, idCurso: 1, senhaInicial: 'x', senhaHash: HASH_SENHA_TESTE })
    expect(ra).toMatch(new RegExp(`^${new Date().getFullYear()}\\d{6}$`))

    const detalhe = await alunos.buscar(idAluno)
    expect(detalhe).toMatchObject({ nome: 'Teste Integração', dataNascimento: '2003-04-05', acesso: { login: ra, ativo: true } })
    expect(detalhe?.matriculas[0]).toMatchObject({ curso: 'Ciência da Computação', status: 'ATIVA' })
    expect((await auth.login(ra, 'Senha@123', null)).ok).toBe(true)

    expect(await alunos.excluir(idAluno)).toBe(true)
    const [resto] = await pool.query<any[]>(
      'SELECT (SELECT COUNT(*) FROM usuario WHERE login = ?) AS u, (SELECT COUNT(*) FROM matricula WHERE id_aluno = ?) AS m',
      [ra, idAluno],
    )
    expect(resto[0]).toEqual({ u: 0, m: 0 })
  })

  it('desfaz tudo se uma parte do cadastro falhar (transação)', async () => {
    const antes = (await alunos.listar(null)).length
    const erro = await alunos.criar({ ...dados, cpf: '12345678901', idCurso: 1, senhaInicial: 'x', senhaHash: HASH_SENHA_TESTE }).catch((e) => e)
    expect(traduzirErroMysql(erro)?.message).toBe('Já existe um aluno com este CPF.')
    expect((await alunos.listar(null)).length).toBe(antes)
  })

  it('lista com busca e atualiza dados', async () => {
    expect((await alunos.listar('Camila')).map((a) => a.ra)).toEqual(['2026000003'])
    const camila = (await alunos.buscar(3))!
    expect(await alunos.atualizar(3, { ...camila, telefone: '48911112222' })).toBe(true)
    expect((await alunos.buscar(3))?.telefone).toBe('48911112222')
    expect(await alunos.atualizar(9999, camila)).toBe(false)
  })

  it('trancar matrícula grava histórico e bloqueia lançamento de nota', async () => {
    const m = (await alunos.buscar(4))!.matriculas[0]
    expect(await alunos.alterarStatusMatricula(4, m.idMatricula, 'TRANCADA')).toBe(true)
    expect(traduzirErroMysql(await notas.lancar(5, 4, 'A3', 8, 3).catch((e) => e))?.status).toBe(422)

    await alunos.alterarStatusMatricula(4, m.idMatricula, 'ATIVA')
    const hist = (await painel.buscarPainel(4))!.historico.map((h) => h.status)
    expect(hist.slice(-2)).toEqual(['TRANCADA', 'ATIVA'])
  })

  it('lança, corrige e apaga nota; a view vw_boletim acompanha', async () => {
    await notas.lancar(5, 4, 'A3', 8, 3)
    await notas.lancar(5, 4, 'A3', 9, 3)
    expect((await notas.planilha(5))!.alunos.find((a) => a.idAluno === 4)).toMatchObject({ a1: 7.5, a2: 6, a3: 9 })
    expect((await painel.buscarPainel(4))!.boletim[0]).toMatchObject({ media: 7.5, situacao: 'APROVADO' })

    const [quem] = await pool.query<any[]>("SELECT id_funcionario FROM nota WHERE id_aluno = 4 AND id_disciplina = 5 AND avaliacao = 'A3'")
    expect(quem[0].id_funcionario).toBe(3) // usuário 3 = Juliana, funcionária 3

    await notas.remover(5, 4, 'A3')
    expect((await notas.planilha(5))!.alunos.find((a) => a.idAluno === 4)?.a3).toBeNull()
    expect(await notas.planilha(9999)).toBeNull()
  })

  it('não lança nota para aluno de outro curso nem em disciplina inexistente', async () => {
    // Ana é de Ciência da Computação; a disciplina 5 é de ADS
    expect(traduzirErroMysql(await notas.lancar(5, 1, 'A1', 8, 3).catch((e) => e))?.status).toBe(422)
    expect(traduzirErroMysql(await notas.lancar(9999, 1, 'A1', 8, 3).catch((e) => e))?.status).toBe(422)
  })

  it('CRUD de curso e disciplina', async () => {
    const idCurso = await cursos.criar({ nome: `Curso Teste ${Date.now()}`, categoria: 'TECNOLOGO', duracaoSemestres: 4, status: 'ATIVO' })
    const idDisc = await cursos.criarDisciplina(idCurso, { nome: 'Disciplina Teste', cargaHoraria: 40, semestre: 2 })
    expect(await cursos.buscar(idCurso)).toMatchObject({ qtdDisciplinas: 1, qtdMatriculas: 0 })
    expect(await cursos.atualizarDisciplina(idDisc, { nome: 'Disciplina Teste 2', cargaHoraria: 60, semestre: 3 })).toBe(true)
    expect(await cursos.buscarDisciplina(idDisc)).toMatchObject({ nome: 'Disciplina Teste 2', semestre: 3 })
    expect(await cursos.contarNotas(idDisc)).toBe(0)
    expect(await cursos.atualizar(idCurso, { nome: `Curso Teste B ${Date.now()}`, categoria: 'TECNOLOGO', duracaoSemestres: 5, status: 'INATIVO' })).toBe(true)
    expect(await cursos.excluirDisciplina(idDisc)).toBe(true)
    expect(await cursos.excluir(idCurso)).toBe(true)
    expect(await cursos.buscar(idCurso)).toBeNull()
    expect(await cursos.buscarDisciplina(idDisc)).toBeNull()
  })

  it('conta disciplinas, matrículas e notas do seed', async () => {
    const cc = (await cursos.listar()).find((c) => c.nome === 'Ciência da Computação')
    expect(cc).toMatchObject({ qtdDisciplinas: 3, qtdMatriculas: 3 })
    expect((await cursos.listarDisciplinas(1)).map((d) => d.semestre)).toEqual([1, 3, 5])
    expect(await cursos.contarNotas(2)).toBe(6)
  })

  it('matricula em outro curso e reativa acesso tirando o bloqueio', async () => {
    await alunos.matricular(5, 2)
    expect(traduzirErroMysql(await alunos.matricular(5, 2).catch((e) => e))?.status).toBe(409)
    await pool.query('DELETE FROM matricula WHERE id_aluno = 5 AND id_curso = 2')

    await pool.query('UPDATE usuario SET tentativas_falhas = 2, bloqueado_ate = NOW() + INTERVAL 5 MINUTE WHERE id_aluno = 5')
    expect(await alunos.definirAcesso(5, true)).toBe(true)
    expect((await alunos.buscar(5))?.acesso).toMatchObject({ ativo: true, bloqueadoAte: null })
    expect(await alunos.definirAcesso(9999, true)).toBe(false)
  })
})
