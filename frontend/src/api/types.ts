// Tipos espelhando o banco sistema_alunos (ver database/01_schema.sql).
// Cópia de backend/src/tipos.ts: se mudar lá, mude aqui também.


export type Perfil = 'ALUNO' | 'FUNCIONARIO'
export type Cargo = 'SECRETARIA' | 'PROFESSOR' | 'COORDENADOR' | 'ADMINISTRADOR'
export type StatusMatricula = 'ATIVA' | 'TRANCADA' | 'CONCLUIDA' | 'CANCELADA'
export type Situacao = 'APROVADO' | 'REPROVADO' | 'EM ANDAMENTO'

/** Mesmos valores do ENUM log_acesso.motivo */
export type MotivoLogin =
  | 'OK'
  | 'SENHA_INVALIDA'
  | 'USUARIO_INEXISTENTE'
  | 'USUARIO_BLOQUEADO'
  | 'USUARIO_INATIVO'

export interface Usuario {
  idUsuario: number
  login: string
  perfil: Perfil
  nome: string
  ra: string | null
  cargo: Cargo | null
  idAluno: number | null
}

export type ResultadoLogin =
  | { ok: true; usuario: Usuario; token: string }
  | { ok: false; motivo: Exclude<MotivoLogin, 'OK'>; tentativasRestantes?: number; bloqueadoAte?: string }

export interface LinhaBoletim {
  disciplina: string
  semestre: number
  a1: number | null
  a2: number | null
  a3: number | null
  media: number
  situacao: Situacao
}

export interface EventoHistorico {
  data: string
  curso: string
  status: StatusMatricula
  observacao: string
}

export interface PainelAluno {
  aluno: {
    ra: string
    nome: string
    email: string
    telefone: string | null
    cidade: string | null
    uf: string | null
  }
  matricula: { curso: string; status: StatusMatricula; dataMatricula: string } | null
  boletim: LinhaBoletim[]
  historico: EventoHistorico[]
}

// ---------------------------------------------------------------------
// Área do funcionário
// ---------------------------------------------------------------------

export type Categoria = 'BACHARELADO' | 'LICENCIATURA' | 'TECNOLOGO' | 'POS_GRADUACAO'
export type Avaliacao = 'A1' | 'A2' | 'A3'

export interface AlunoResumo {
  idAluno: number
  ra: string
  nome: string
  email: string
  cpf: string
  curso: string | null
  statusMatricula: StatusMatricula | null
}

/** Campos que o funcionário preenche no cadastro do aluno */
export interface DadosAluno {
  nome: string
  cpf: string
  email: string
  telefone: string | null
  dataNascimento: string | null
  logradouro: string | null
  numero: string | null
  bairro: string | null
  cidade: string | null
  uf: string | null
  cep: string | null
}

export interface NovoAluno extends DadosAluno {
  idCurso: number | null
  senhaInicial: string
}

export interface Matricula {
  idMatricula: number
  idCurso: number
  curso: string
  status: StatusMatricula
  dataMatricula: string
}

export interface AlunoDetalhe extends DadosAluno {
  idAluno: number
  ra: string
  dataCadastro: string
  matriculas: Matricula[]
  acesso: { login: string; ativo: boolean; bloqueadoAte: string | null; ultimoAcesso: string | null } | null
}

export interface DadosCurso {
  nome: string
  categoria: Categoria
  duracaoSemestres: number
  status: 'ATIVO' | 'INATIVO'
}

export interface Curso extends DadosCurso {
  idCurso: number
  qtdDisciplinas: number
  /** Matrículas em qualquer situação */
  qtdMatriculas: number
}

export interface DadosDisciplina {
  nome: string
  cargaHoraria: number
  semestre: number
}

export interface Disciplina extends DadosDisciplina {
  idDisciplina: number
  idCurso: number
}

export interface LinhaPlanilha {
  idAluno: number
  ra: string
  nome: string
  statusMatricula: StatusMatricula
  a1: number | null
  a2: number | null
  a3: number | null
}

export interface PlanilhaNotas {
  disciplina: { idDisciplina: number; nome: string; semestre: number; idCurso: number; curso: string }
  alunos: LinhaPlanilha[]
}
