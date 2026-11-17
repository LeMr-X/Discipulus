import type { Cargo, Categoria, Situacao, StatusMatricula } from '../api/types'

type Tom = 'success' | 'danger' | 'warning' | 'brand' | 'neutral'

export const SITUACAO: Record<Situacao, { rotulo: string; tom: Tom }> = {
  APROVADO: { rotulo: 'Aprovado', tom: 'success' },
  REPROVADO: { rotulo: 'Reprovado', tom: 'danger' },
  'EM ANDAMENTO': { rotulo: 'Em andamento', tom: 'warning' },
}

export const MATRICULA: Record<StatusMatricula, { rotulo: string; tom: Tom }> = {
  ATIVA: { rotulo: 'Ativa', tom: 'success' },
  TRANCADA: { rotulo: 'Trancada', tom: 'warning' },
  CONCLUIDA: { rotulo: 'Concluída', tom: 'brand' },
  CANCELADA: { rotulo: 'Cancelada', tom: 'danger' },
}

export const CATEGORIA: Record<Categoria, string> = {
  BACHARELADO: 'Bacharelado',
  LICENCIATURA: 'Licenciatura',
  TECNOLOGO: 'Tecnólogo',
  POS_GRADUACAO: 'Pós-graduação',
}

export const CARGO: Record<Cargo, string> = {
  SECRETARIA: 'Secretaria',
  PROFESSOR: 'Professor(a)',
  COORDENADOR: 'Coordenação',
  ADMINISTRADOR: 'Administração',
}
