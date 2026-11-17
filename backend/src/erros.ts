/** Erro com status HTTP e mensagem que pode ser mostrada ao usuário. */
export class ErroHttp extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

export const naoEncontrado = (o_que: string) => new ErroHttp(404, `${o_que} não encontrado.`)

/** Mensagens para cada chave única do banco (01_schema.sql) */
const DUPLICADOS: Record<string, string> = {
  uq_aluno_cpf: 'Já existe um aluno com este CPF.',
  uq_aluno_email: 'Já existe um aluno com este e-mail.',
  uq_aluno_ra: 'Este RA já está em uso.',
  uq_curso_nome: 'Já existe um curso com este nome.',
  uq_disciplina_nome: 'Este curso já tem uma disciplina com este nome.',
  uq_matricula: 'O aluno já está matriculado neste curso.',
  uq_usuario_login: 'Este login já está em uso.',
}

interface ErroMysql {
  errno?: number
  sqlMessage?: string
}

/**
 * Converte erros do MySQL (restrições, triggers) em respostas claras.
 * Devolve null se não for um erro conhecido.
 */
export function traduzirErroMysql(erro: unknown): ErroHttp | null {
  const e = erro as ErroMysql
  if (typeof e?.errno !== 'number') return null

  switch (e.errno) {
    case 1062: {
      // "Duplicate entry 'x' for key 'aluno.uq_aluno_cpf'"
      const chave = Object.keys(DUPLICADOS).find((k) => e.sqlMessage?.includes(k))
      return new ErroHttp(409, chave ? DUPLICADOS[chave] : 'Registro duplicado.')
    }
    case 1644: // SIGNAL dos triggers (ex.: nota em matrícula não ativa)
      return new ErroHttp(422, e.sqlMessage ?? 'Operação não permitida pelas regras do banco.')
    case 3819: // CHECK constraint
      return new ErroHttp(400, 'Algum valor está fora do permitido.')
    case 1452: // FK inexistente
      return new ErroHttp(422, 'Algum registro relacionado não existe.')
    default:
      return null
  }
}
