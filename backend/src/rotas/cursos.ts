import { Router } from 'express'
import type { CursosRepository } from '../cursos/cursosRepository.js'
import { ErroHttp, naoEncontrado } from '../erros.js'
import { exigir, idDaRota, validar } from '../http.js'
import { validarNovaDuracao, validarSemestreDaDisciplina } from '../regras.js'
import { esquemaCurso, esquemaDisciplina } from '../validacao.js'

export function rotasCursos(cursos: CursosRepository) {
  const r = Router()

  r.get('/', exigir('consultar'), async (_req, res) => {
    res.json(await cursos.listar())
  })

  r.post('/', exigir('cadastros'), async (req, res) => {
    const idCurso = await cursos.criar(validar(esquemaCurso, req.body))
    res.status(201).json({ idCurso })
  })

  r.put('/:id', exigir('cadastros'), async (req, res) => {
    const id = idDaRota(req)
    const dados = validar(esquemaCurso, req.body)
    const disciplinas = await cursos.listarDisciplinas(id)
    validarNovaDuracao(dados.duracaoSemestres, Math.max(0, ...disciplinas.map((d) => d.semestre)))
    if (!(await cursos.atualizar(id, dados))) throw naoEncontrado('Curso')
    res.status(204).end()
  })

  r.delete('/:id', exigir('cadastros'), async (req, res) => {
    const curso = await cursos.buscar(idDaRota(req))
    if (!curso) throw naoEncontrado('Curso')
    // Excluir apagaria matrículas, notas e histórico em cascata
    if (curso.qtdMatriculas > 0) {
      throw new ErroHttp(409, 'Este curso tem alunos matriculados. Marque-o como inativo em vez de excluir.')
    }
    await cursos.excluir(curso.idCurso)
    res.status(204).end()
  })

  r.get('/:id/disciplinas', exigir('consultar'), async (req, res) => {
    const id = idDaRota(req)
    if (!(await cursos.buscar(id))) throw naoEncontrado('Curso')
    res.json(await cursos.listarDisciplinas(id))
  })

  r.post('/:id/disciplinas', exigir('cadastros'), async (req, res) => {
    const curso = await cursos.buscar(idDaRota(req))
    if (!curso) throw naoEncontrado('Curso')
    const dados = validar(esquemaDisciplina, req.body)
    validarSemestreDaDisciplina(dados.semestre, curso)
    res.status(201).json({ idDisciplina: await cursos.criarDisciplina(curso.idCurso, dados) })
  })

  return r
}

export function rotasDisciplinas(cursos: CursosRepository) {
  const r = Router()

  r.put('/:id', exigir('cadastros'), async (req, res) => {
    const disciplina = await cursos.buscarDisciplina(idDaRota(req))
    if (!disciplina) throw naoEncontrado('Disciplina')
    const dados = validar(esquemaDisciplina, req.body)
    validarSemestreDaDisciplina(dados.semestre, (await cursos.buscar(disciplina.idCurso))!)
    await cursos.atualizarDisciplina(disciplina.idDisciplina, dados)
    res.status(204).end()
  })

  r.delete('/:id', exigir('cadastros'), async (req, res) => {
    const id = idDaRota(req)
    if (!(await cursos.buscarDisciplina(id))) throw naoEncontrado('Disciplina')
    if ((await cursos.contarNotas(id)) > 0) {
      throw new ErroHttp(409, 'Esta disciplina já tem notas lançadas e não pode ser excluída.')
    }
    await cursos.excluirDisciplina(id)
    res.status(204).end()
  })

  return r
}
