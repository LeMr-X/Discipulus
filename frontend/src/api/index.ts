// Todas as chamadas ao back-end (backend/README.md lista as rotas).

import { requisitar } from './cliente'
import type {
  AlunoDetalhe,
  AlunoResumo,
  Avaliacao,
  Curso,
  DadosAluno,
  DadosCurso,
  DadosDisciplina,
  Disciplina,
  NovoAluno,
  PainelAluno,
  PlanilhaNotas,
  ResultadoLogin,
  StatusMatricula,
} from './types'

export const api = {
  async login(login: string, senha: string): Promise<ResultadoLogin> {
    // Recusas de login (401, 403, 423) também vêm com o motivo no corpo
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, senha }),
    })
    const corpo = await res.json().catch(() => null)
    if (corpo && typeof corpo === 'object' && 'ok' in corpo) return corpo as ResultadoLogin
    throw new Error(`Falha no login (HTTP ${res.status})`)
  },

  painelAluno: (idAluno: number) => requisitar<PainelAluno>('GET', `/alunos/${idAluno}/painel`),

  alunos: {
    listar: (busca = '') => requisitar<AlunoResumo[]>('GET', `/alunos?busca=${encodeURIComponent(busca)}`),
    buscar: (id: number) => requisitar<AlunoDetalhe>('GET', `/alunos/${id}`),
    criar: (dados: NovoAluno) => requisitar<{ idAluno: number; ra: string }>('POST', '/alunos', dados),
    atualizar: (id: number, dados: DadosAluno) => requisitar('PUT', `/alunos/${id}`, dados),
    excluir: (id: number) => requisitar('DELETE', `/alunos/${id}`),
    matricular: (id: number, idCurso: number) => requisitar('POST', `/alunos/${id}/matriculas`, { idCurso }),
    alterarMatricula: (id: number, idMatricula: number, status: StatusMatricula) =>
      requisitar('PATCH', `/alunos/${id}/matriculas/${idMatricula}`, { status }),
    definirAcesso: (id: number, ativo: boolean) => requisitar('PATCH', `/alunos/${id}/acesso`, { ativo }),
  },

  cursos: {
    listar: () => requisitar<Curso[]>('GET', '/cursos'),
    criar: (dados: DadosCurso) => requisitar<{ idCurso: number }>('POST', '/cursos', dados),
    atualizar: (id: number, dados: DadosCurso) => requisitar('PUT', `/cursos/${id}`, dados),
    excluir: (id: number) => requisitar('DELETE', `/cursos/${id}`),
    disciplinas: (id: number) => requisitar<Disciplina[]>('GET', `/cursos/${id}/disciplinas`),
    criarDisciplina: (id: number, dados: DadosDisciplina) => requisitar<{ idDisciplina: number }>('POST', `/cursos/${id}/disciplinas`, dados),
  },

  disciplinas: {
    atualizar: (id: number, dados: DadosDisciplina) => requisitar('PUT', `/disciplinas/${id}`, dados),
    excluir: (id: number) => requisitar('DELETE', `/disciplinas/${id}`),
    planilha: (id: number) => requisitar<PlanilhaNotas>('GET', `/disciplinas/${id}/notas`),
    lancarNota: (id: number, idAluno: number, avaliacao: Avaliacao, nota: number | null) =>
      requisitar('PUT', `/disciplinas/${id}/notas`, { idAluno, avaliacao, nota }),
  },
}
