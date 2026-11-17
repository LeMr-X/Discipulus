import type { Sessao } from './auth/token.js'
import type { Cargo } from './tipos.js'

/**
 * Quem pode fazer o quê (regra de negócio):
 *  - cadastros (alunos, cursos, disciplinas): secretaria, coordenação e administração;
 *  - notas: professores, coordenação e administração;
 *  - consultar alunos e cursos: qualquer funcionário.
 */
export const PERMISSOES = {
  consultar: ['SECRETARIA', 'PROFESSOR', 'COORDENADOR', 'ADMINISTRADOR'],
  cadastros: ['SECRETARIA', 'COORDENADOR', 'ADMINISTRADOR'],
  notas: ['PROFESSOR', 'COORDENADOR', 'ADMINISTRADOR'],
} as const satisfies Record<string, readonly Cargo[]>

export type Permissao = keyof typeof PERMISSOES

export function pode(sessao: Sessao, permissao: Permissao) {
  return sessao.perfil === 'FUNCIONARIO' && sessao.cargo !== null && (PERMISSOES[permissao] as readonly Cargo[]).includes(sessao.cargo)
}
