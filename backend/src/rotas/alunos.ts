import bcrypt from 'bcryptjs'
import { Router } from 'express'
import { z } from 'zod'
import type { AlunosRepository } from '../alunos/alunosRepository.js'
import type { CursosRepository } from '../cursos/cursosRepository.js'
import { naoEncontrado } from '../erros.js'
import { exigir, idDaRota, validar } from '../http.js'
import { validarCursoParaMatricula } from '../regras.js'
import { esquemaDadosAluno, esquemaNovoAluno, esquemaStatusMatricula } from '../validacao.js'

export function rotasAlunos(alunos: AlunosRepository, cursos: CursosRepository) {
  const r = Router()

  r.get('/', exigir('consultar'), async (req, res) => {
    const busca = typeof req.query.busca === 'string' ? req.query.busca.trim().slice(0, 100) : ''
    res.json(await alunos.listar(busca || null))
  })

  r.get('/:id', exigir('consultar'), async (req, res) => {
    const aluno = await alunos.buscar(idDaRota(req))
    if (!aluno) throw naoEncontrado('Aluno')
    res.json(aluno)
  })

  r.post('/', exigir('cadastros'), async (req, res) => {
    const dados = validar(esquemaNovoAluno, req.body)
    if (dados.idCurso) validarCursoParaMatricula(await cursos.buscar(dados.idCurso))
    const senhaHash = await bcrypt.hash(dados.senhaInicial, 10)
    res.status(201).json(await alunos.criar({ ...dados, senhaHash }))
  })

  r.put('/:id', exigir('cadastros'), async (req, res) => {
    const id = idDaRota(req)
    if (!(await alunos.atualizar(id, validar(esquemaDadosAluno, req.body)))) throw naoEncontrado('Aluno')
    res.status(204).end()
  })

  r.delete('/:id', exigir('cadastros'), async (req, res) => {
    if (!(await alunos.excluir(idDaRota(req)))) throw naoEncontrado('Aluno')
    res.status(204).end()
  })

  r.post('/:id/matriculas', exigir('cadastros'), async (req, res) => {
    const id = idDaRota(req)
    const { idCurso } = validar(z.object({ idCurso: z.number({ message: 'Escolha um curso.' }).int().positive() }), req.body)
    if (!(await alunos.buscar(id))) throw naoEncontrado('Aluno')
    validarCursoParaMatricula(await cursos.buscar(idCurso))
    await alunos.matricular(id, idCurso)
    res.status(201).end()
  })

  r.patch('/:id/matriculas/:idMatricula', exigir('cadastros'), async (req, res) => {
    const { status } = validar(esquemaStatusMatricula, req.body)
    if (!(await alunos.alterarStatusMatricula(idDaRota(req), idDaRota(req, 'idMatricula'), status))) throw naoEncontrado('Matrícula')
    res.status(204).end()
  })

  r.patch('/:id/acesso', exigir('cadastros'), async (req, res) => {
    const { ativo } = validar(z.object({ ativo: z.boolean() }), req.body)
    if (!(await alunos.definirAcesso(idDaRota(req), ativo))) throw naoEncontrado('Usuário do aluno')
    res.status(204).end()
  })

  return r
}
