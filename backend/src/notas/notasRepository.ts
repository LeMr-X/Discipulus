import type { ResultSetHeader, RowDataPacket } from 'mysql2'
import type { Pool } from '../db.js'
import type { Avaliacao, PlanilhaNotas } from '../tipos.js'

export interface NotasRepository {
  /** Alunos matriculados no curso da disciplina, com as notas lançadas. */
  planilha(idDisciplina: number): Promise<PlanilhaNotas | null>
  /** Grava ou atualiza a nota. O trigger do banco barra matrícula que não está ATIVA. */
  lancar(idDisciplina: number, idAluno: number, avaliacao: Avaliacao, nota: number, idUsuario: number): Promise<void>
  remover(idDisciplina: number, idAluno: number, avaliacao: Avaliacao): Promise<void>
}

export function criarNotasRepository(pool: Pool): NotasRepository {
  return {
    async planilha(idDisciplina) {
      const [disciplinas] = await pool.query<RowDataPacket[]>(
        `SELECT d.id_disciplina, d.nome, d.semestre, d.id_curso, c.nome AS curso
           FROM disciplina d JOIN curso c ON c.id_curso = d.id_curso
          WHERE d.id_disciplina = ?`,
        [idDisciplina],
      )
      const d = disciplinas[0]
      if (!d) return null

      const [alunos] = await pool.query<RowDataPacket[]>(
        `SELECT a.id_aluno, a.ra, a.nome, m.status,
                MAX(CASE WHEN n.avaliacao = 'A1' THEN n.nota END) AS a1,
                MAX(CASE WHEN n.avaliacao = 'A2' THEN n.nota END) AS a2,
                MAX(CASE WHEN n.avaliacao = 'A3' THEN n.nota END) AS a3
           FROM matricula m
           JOIN aluno a ON a.id_aluno = m.id_aluno
           LEFT JOIN nota n ON n.id_aluno = m.id_aluno AND n.id_disciplina = ?
          WHERE m.id_curso = ?
          GROUP BY a.id_aluno, a.ra, a.nome, m.status
          ORDER BY a.nome`,
        [idDisciplina, d.id_curso],
      )

      return {
        disciplina: { idDisciplina: d.id_disciplina, nome: d.nome, semestre: d.semestre, idCurso: d.id_curso, curso: d.curso },
        alunos: alunos.map((l) => ({
          idAluno: l.id_aluno,
          ra: l.ra,
          nome: l.nome,
          statusMatricula: l.status,
          a1: l.a1,
          a2: l.a2,
          a3: l.a3,
        })),
      }
    },

    async lancar(idDisciplina, idAluno, avaliacao, nota, idUsuario) {
      const [r] = await pool.query<ResultSetHeader>(
        `INSERT INTO nota (id_aluno, id_curso, id_disciplina, avaliacao, nota, data_lancamento, id_funcionario)
         SELECT ?, d.id_curso, d.id_disciplina, ?, ?, CURRENT_DATE,
                (SELECT u.id_funcionario FROM usuario u WHERE u.id_usuario = ?)
           FROM disciplina d
          WHERE d.id_disciplina = ?
         ON DUPLICATE KEY UPDATE nota = VALUES(nota),
                                 data_lancamento = CURRENT_DATE,
                                 id_funcionario = VALUES(id_funcionario)`,
        [idAluno, avaliacao, nota, idUsuario, idDisciplina],
      )
      if (r.affectedRows === 0) throw Object.assign(new Error('Disciplina inexistente'), { errno: 1452 })
    },

    async remover(idDisciplina, idAluno, avaliacao) {
      await pool.query('DELETE FROM nota WHERE id_disciplina = ? AND id_aluno = ? AND avaliacao = ?', [idDisciplina, idAluno, avaliacao])
    },
  }
}
