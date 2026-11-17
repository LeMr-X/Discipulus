import type { Sessao } from '../auth/token.js'
import type { PainelAluno } from '../tipos.js'
import type { PainelRepository } from './painelRepository.js'

export type ResultadoPainel =
  | { tipo: 'ok'; painel: PainelAluno }
  | { tipo: 'proibido' }
  | { tipo: 'nao-encontrado' }

export interface PainelService {
  buscar(sessao: Sessao, idAluno: number): Promise<ResultadoPainel>
}

/**
 * Regra de acesso:
 *  - aluno só vê o próprio painel;
 *  - funcionário vê o painel de qualquer aluno.
 */
export function podeVerPainel(sessao: Sessao, idAluno: number) {
  return sessao.perfil === 'FUNCIONARIO' || sessao.idAluno === idAluno
}

export function criarPainelService(repo: PainelRepository): PainelService {
  return {
    async buscar(sessao, idAluno) {
      if (!podeVerPainel(sessao, idAluno)) return { tipo: 'proibido' }
      const painel = await repo.buscarPainel(idAluno)
      return painel ? { tipo: 'ok', painel } : { tipo: 'nao-encontrado' }
    },
  }
}
