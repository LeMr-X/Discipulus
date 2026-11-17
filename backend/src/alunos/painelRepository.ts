import type { RowDataPacket } from 'mysql2'
import { paraIso, type Pool } from '../db.js'
import type { PainelAluno } from '../tipos.js'

export interface PainelRepository {
  buscarPainel(idAluno: number): Promise<PainelAluno | null>
}

export function criarPainelRepository(pool: Pool): PainelRepository {
  return {
    async buscarPainel(idAluno) {
      const [alunos] = await pool.query<RowDataPacket[]>(
        'SELECT ra, nome, email, telefone, cidade, uf FROM aluno WHERE id_aluno = ?',
        [idAluno],
      )
      if (!alunos[0]) return null

      const [[matriculas], [boletim], [historico]] = await Promise.all([
        pool.query<RowDataPacket[]>(
          `SELECT c.nome AS curso, m.status, m.data_matricula
             FROM matricula m JOIN curso c ON c.id_curso = m.id_curso
            WHERE m.id_aluno = ?
            ORDER BY m.data_matricula DESC
            LIMIT 1`,
          [idAluno],
        ),
        pool.query<RowDataPacket[]>(
          `SELECT disciplina, semestre, a1, a2, a3, media, situacao
             FROM vw_boletim
            WHERE id_aluno = ?
            ORDER BY semestre, disciplina`,
          [idAluno],
        ),
        pool.query<RowDataPacket[]>(
          `SELECT h.data, c.nome AS curso, h.status, h.observacao
             FROM historico_academico h JOIN curso c ON c.id_curso = h.id_curso
            WHERE h.id_aluno = ?
            ORDER BY h.data, h.id_historico`,
          [idAluno],
        ),
      ])

      const a = alunos[0]
      const m = matriculas[0]
      return {
        aluno: { ra: a.ra, nome: a.nome, email: a.email, telefone: a.telefone, cidade: a.cidade, uf: a.uf },
        matricula: m ? { curso: m.curso, status: m.status, dataMatricula: m.data_matricula } : null,
        boletim: boletim.map((l) => ({
          disciplina: l.disciplina,
          semestre: l.semestre,
          a1: l.a1,
          a2: l.a2,
          a3: l.a3,
          media: l.media,
          situacao: l.situacao,
        })),
        historico: historico.map((h) => ({
          data: paraIso(h.data),
          curso: h.curso,
          status: h.status,
          observacao: h.observacao ?? '',
        })),
      }
    },
  }
}
