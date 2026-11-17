// Repositórios em memória para testar as rotas da área do funcionário sem MySQL.

import type { AlunosRepository } from '../src/alunos/alunosRepository.js'
import { proximoRa } from '../src/alunos/alunosRepository.js'
import type { CursosRepository } from '../src/cursos/cursosRepository.js'
import type { NotasRepository } from '../src/notas/notasRepository.js'
import type { AlunoDetalhe, Avaliacao, Curso, Disciplina, StatusMatricula } from '../src/tipos.js'

export function criarBancoFake() {
  const cursos: Curso[] = [
    { idCurso: 1, nome: 'Ciência da Computação', categoria: 'BACHARELADO', duracaoSemestres: 8, status: 'ATIVO', qtdDisciplinas: 2, qtdMatriculas: 1 },
    { idCurso: 2, nome: 'Sistemas de Informação', categoria: 'BACHARELADO', duracaoSemestres: 8, status: 'INATIVO', qtdDisciplinas: 0, qtdMatriculas: 0 },
  ]
  const disciplinas: Disciplina[] = [
    { idDisciplina: 1, idCurso: 1, nome: 'Algoritmos', cargaHoraria: 80, semestre: 1 },
    { idDisciplina: 2, idCurso: 1, nome: 'Banco de Dados', cargaHoraria: 80, semestre: 6 },
  ]
  const alunos: AlunoDetalhe[] = [
    {
      idAluno: 1, ra: '2026000001', nome: 'Ana Souza', cpf: '12345678901', email: 'ana@aluno.edu.br',
      telefone: null, dataNascimento: null, logradouro: null, numero: null, bairro: null, cidade: null, uf: null, cep: null,
      dataCadastro: '2026-02-10T09:00:00',
      matriculas: [{ idMatricula: 1, idCurso: 1, curso: 'Ciência da Computação', status: 'ATIVA', dataMatricula: '2026-02-10' }],
      acesso: { login: '2026000001', ativo: true, bloqueadoAte: null, ultimoAcesso: null },
    },
  ]
  const notas: { idDisciplina: number; idAluno: number; avaliacao: Avaliacao; nota: number; idUsuario: number }[] = [
    { idDisciplina: 2, idAluno: 1, avaliacao: 'A1', nota: 8.5, idUsuario: 3 },
  ]
  /** Último hash de senha recebido no cadastro (para conferir que não é texto puro) */
  const hashes: string[] = []

  const repoAlunos: AlunosRepository = {
    async listar(busca) {
      return alunos
        .filter((a) => !busca || [a.nome, a.ra, a.cpf, a.email].some((v) => v.includes(busca)))
        .map((a) => ({ idAluno: a.idAluno, ra: a.ra, nome: a.nome, email: a.email, cpf: a.cpf, curso: a.matriculas[0]?.curso ?? null, statusMatricula: a.matriculas[0]?.status ?? null }))
    },
    async buscar(id) {
      return alunos.find((a) => a.idAluno === id) ?? null
    },
    async criar({ senhaHash, idCurso, senhaInicial: _s, ...dados }) {
      hashes.push(senhaHash)
      const idAluno = Math.max(...alunos.map((a) => a.idAluno)) + 1
      const ra = proximoRa(2026, alunos.map((a) => a.ra).sort().at(-1) ?? null)
      alunos.push({
        ...dados, idAluno, ra, dataCadastro: '2026-11-03T10:00:00',
        matriculas: idCurso ? [{ idMatricula: 99, idCurso, curso: cursos.find((c) => c.idCurso === idCurso)!.nome, status: 'ATIVA', dataMatricula: '2026-11-03' }] : [],
        acesso: { login: ra, ativo: true, bloqueadoAte: null, ultimoAcesso: null },
      })
      return { idAluno, ra }
    },
    async atualizar(id, dados) {
      const a = alunos.find((x) => x.idAluno === id)
      if (a) Object.assign(a, dados)
      return !!a
    },
    async excluir(id) {
      const i = alunos.findIndex((x) => x.idAluno === id)
      if (i >= 0) alunos.splice(i, 1)
      return i >= 0
    },
    async matricular(id, idCurso) {
      const a = alunos.find((x) => x.idAluno === id)!
      if (a.matriculas.some((m) => m.idCurso === idCurso)) throw Object.assign(new Error('dup'), { errno: 1062, sqlMessage: "for key 'matricula.uq_matricula'" })
      a.matriculas.push({ idMatricula: 100, idCurso, curso: '', status: 'ATIVA', dataMatricula: '2026-11-03' })
    },
    async alterarStatusMatricula(id, idMatricula, status: StatusMatricula) {
      const m = alunos.find((x) => x.idAluno === id)?.matriculas.find((x) => x.idMatricula === idMatricula)
      if (m) m.status = status
      return !!m
    },
    async definirAcesso(id, ativo) {
      const a = alunos.find((x) => x.idAluno === id)
      if (a?.acesso) a.acesso.ativo = ativo
      return !!a?.acesso
    },
  }

  const repoCursos: CursosRepository = {
    listar: async () => cursos,
    buscar: async (id) => cursos.find((c) => c.idCurso === id) ?? null,
    async criar(d) {
      const idCurso = cursos.length + 1
      cursos.push({ ...d, idCurso, qtdDisciplinas: 0, qtdMatriculas: 0 })
      return idCurso
    },
    async atualizar(id, d) {
      const c = cursos.find((x) => x.idCurso === id)
      if (c) Object.assign(c, d)
      return !!c
    },
    async excluir(id) {
      const i = cursos.findIndex((x) => x.idCurso === id)
      if (i >= 0) cursos.splice(i, 1)
      return i >= 0
    },
    listarDisciplinas: async (id) => disciplinas.filter((d) => d.idCurso === id),
    buscarDisciplina: async (id) => disciplinas.find((d) => d.idDisciplina === id) ?? null,
    async criarDisciplina(idCurso, d) {
      const idDisciplina = disciplinas.length + 1
      disciplinas.push({ ...d, idCurso, idDisciplina })
      return idDisciplina
    },
    async atualizarDisciplina(id, d) {
      const x = disciplinas.find((y) => y.idDisciplina === id)
      if (x) Object.assign(x, d)
      return !!x
    },
    async excluirDisciplina(id) {
      const i = disciplinas.findIndex((x) => x.idDisciplina === id)
      if (i >= 0) disciplinas.splice(i, 1)
      return i >= 0
    },
    contarNotas: async (id) => notas.filter((n) => n.idDisciplina === id).length,
  }

  const repoNotas: NotasRepository = {
    async planilha(idDisciplina) {
      const d = disciplinas.find((x) => x.idDisciplina === idDisciplina)
      if (!d) return null
      const nota = (idAluno: number, av: Avaliacao) => notas.find((n) => n.idDisciplina === idDisciplina && n.idAluno === idAluno && n.avaliacao === av)?.nota ?? null
      return {
        disciplina: { idDisciplina, nome: d.nome, semestre: d.semestre, idCurso: d.idCurso, curso: 'Ciência da Computação' },
        alunos: alunos
          .filter((a) => a.matriculas.some((m) => m.idCurso === d.idCurso))
          .map((a) => ({ idAluno: a.idAluno, ra: a.ra, nome: a.nome, statusMatricula: 'ATIVA' as const, a1: nota(a.idAluno, 'A1'), a2: nota(a.idAluno, 'A2'), a3: nota(a.idAluno, 'A3') })),
      }
    },
    async lancar(idDisciplina, idAluno, avaliacao, nota, idUsuario) {
      const m = alunos.find((a) => a.idAluno === idAluno)?.matriculas[0]
      if (m && m.status !== 'ATIVA') throw Object.assign(new Error(), { errno: 1644, sqlMessage: 'Nao e possivel lancar nota: matricula nao esta ATIVA' })
      const existente = notas.find((n) => n.idDisciplina === idDisciplina && n.idAluno === idAluno && n.avaliacao === avaliacao)
      if (existente) Object.assign(existente, { nota, idUsuario })
      else notas.push({ idDisciplina, idAluno, avaliacao, nota, idUsuario })
    },
    async remover(idDisciplina, idAluno, avaliacao) {
      const i = notas.findIndex((n) => n.idDisciplina === idDisciplina && n.idAluno === idAluno && n.avaliacao === avaliacao)
      if (i >= 0) notas.splice(i, 1)
    },
  }

  return { cursos, disciplinas, alunos, notas, hashes, repoAlunos, repoCursos, repoNotas }
}
