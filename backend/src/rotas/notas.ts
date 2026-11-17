import { Router } from 'express'
import { naoEncontrado } from '../erros.js'
import { exigir, idDaRota, sessaoDe, validar } from '../http.js'
import type { NotasRepository } from '../notas/notasRepository.js'
import { esquemaNota } from '../validacao.js'

/** Rotas montadas em /api/disciplinas/:id/notas */
export function rotasNotas(notas: NotasRepository) {
  const r = Router({ mergeParams: true })

  r.get('/', exigir('notas'), async (req, res) => {
    const planilha = await notas.planilha(idDaRota(req))
    if (!planilha) throw naoEncontrado('Disciplina')
    res.json(planilha)
  })

  // Uma nota por vez: a tela salva cada célula quando o professor sai dela
  r.put('/', exigir('notas'), async (req, res) => {
    const idDisciplina = idDaRota(req)
    const { idAluno, avaliacao, nota } = validar(esquemaNota, req.body)
    if (nota === null) await notas.remover(idDisciplina, idAluno, avaliacao)
    else await notas.lancar(idDisciplina, idAluno, avaliacao, nota, sessaoDe(res).idUsuario)
    res.status(204).end()
  })

  return r
}
