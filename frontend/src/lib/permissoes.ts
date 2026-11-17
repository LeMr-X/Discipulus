import type { Cargo, Usuario } from '../api/types'

// Mesma regra de backend/src/permissoes.ts. Aqui serve só para esconder
// botões; quem garante a permissão de verdade é o back-end.
const PERMISSOES = {
  consultar: ['SECRETARIA', 'PROFESSOR', 'COORDENADOR', 'ADMINISTRADOR'],
  cadastros: ['SECRETARIA', 'COORDENADOR', 'ADMINISTRADOR'],
  notas: ['PROFESSOR', 'COORDENADOR', 'ADMINISTRADOR'],
} as const satisfies Record<string, readonly Cargo[]>

export type Permissao = keyof typeof PERMISSOES

export function pode(usuario: Usuario | null, permissao: Permissao) {
  return !!usuario?.cargo && (PERMISSOES[permissao] as readonly Cargo[]).includes(usuario.cargo)
}
