// Regras de negócio que não estão no banco. Funções puras, fáceis de testar.

import { ErroHttp } from './erros.js'
import type { Curso } from './tipos.js'

/** A disciplina não pode estar num semestre depois do fim do curso. */
export function validarSemestreDaDisciplina(semestre: number, curso: Pick<Curso, 'duracaoSemestres' | 'nome'>) {
  if (semestre > curso.duracaoSemestres) {
    throw new ErroHttp(422, `${curso.nome} tem ${curso.duracaoSemestres} semestres; a disciplina não pode ficar no ${semestre}º.`)
  }
}

/** Só é possível matricular em curso ativo. */
export function validarCursoParaMatricula(curso: Pick<Curso, 'status' | 'nome'> | null) {
  if (!curso) throw new ErroHttp(422, 'Curso não encontrado.')
  if (curso.status !== 'ATIVO') throw new ErroHttp(422, `O curso ${curso.nome} está inativo e não aceita matrículas.`)
}

/** Não dá para encurtar o curso se já existem disciplinas nos semestres que sumiriam. */
export function validarNovaDuracao(novaDuracao: number, maiorSemestreComDisciplina: number) {
  if (novaDuracao < maiorSemestreComDisciplina) {
    throw new ErroHttp(422, `Existem disciplinas no ${maiorSemestreComDisciplina}º semestre. Mova-as antes de reduzir a duração.`)
  }
}
