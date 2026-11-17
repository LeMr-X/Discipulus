import type { ResultSetHeader, RowDataPacket } from 'mysql2'
import type { Pool } from '../db.js'
import type { Curso, DadosCurso, DadosDisciplina, Disciplina } from '../tipos.js'

export interface CursosRepository {
  listar(): Promise<Curso[]>
  buscar(idCurso: number): Promise<Curso | null>
  criar(dados: DadosCurso): Promise<number>
  atualizar(idCurso: number, dados: DadosCurso): Promise<boolean>
  excluir(idCurso: number): Promise<boolean>
  listarDisciplinas(idCurso: number): Promise<Disciplina[]>
  buscarDisciplina(idDisciplina: number): Promise<Disciplina | null>
  criarDisciplina(idCurso: number, dados: DadosDisciplina): Promise<number>
  atualizarDisciplina(idDisciplina: number, dados: DadosDisciplina): Promise<boolean>
  excluirDisciplina(idDisciplina: number): Promise<boolean>
  contarNotas(idDisciplina: number): Promise<number>
}

const SQL_CURSOS = `
  SELECT c.id_curso, c.nome, c.categoria, c.duracao_semestres, c.status,
         (SELECT COUNT(*) FROM disciplina d WHERE d.id_curso = c.id_curso) AS qtd_disciplinas,
         (SELECT COUNT(*) FROM matricula m WHERE m.id_curso = c.id_curso) AS qtd_matriculas
    FROM curso c`

const paraCurso = (l: RowDataPacket): Curso => ({
  idCurso: l.id_curso,
  nome: l.nome,
  categoria: l.categoria,
  duracaoSemestres: l.duracao_semestres,
  status: l.status,
  qtdDisciplinas: Number(l.qtd_disciplinas),
  qtdMatriculas: Number(l.qtd_matriculas),
})

const paraDisciplina = (l: RowDataPacket): Disciplina => ({
  idDisciplina: l.id_disciplina,
  idCurso: l.id_curso,
  nome: l.nome,
  cargaHoraria: l.carga_horaria,
  semestre: l.semestre,
})

export function criarCursosRepository(pool: Pool): CursosRepository {
  return {
    async listar() {
      const [linhas] = await pool.query<RowDataPacket[]>(`${SQL_CURSOS} ORDER BY c.status, c.nome`)
      return linhas.map(paraCurso)
    },

    async buscar(idCurso) {
      const [linhas] = await pool.query<RowDataPacket[]>(`${SQL_CURSOS} WHERE c.id_curso = ?`, [idCurso])
      return linhas[0] ? paraCurso(linhas[0]) : null
    },

    async criar(d) {
      const [r] = await pool.query<ResultSetHeader>(
        'INSERT INTO curso (nome, categoria, duracao_semestres, status) VALUES (?, ?, ?, ?)',
        [d.nome, d.categoria, d.duracaoSemestres, d.status],
      )
      return r.insertId
    },

    async atualizar(idCurso, d) {
      const [r] = await pool.query<ResultSetHeader>(
        'UPDATE curso SET nome = ?, categoria = ?, duracao_semestres = ?, status = ? WHERE id_curso = ?',
        [d.nome, d.categoria, d.duracaoSemestres, d.status, idCurso],
      )
      return r.affectedRows > 0
    },

    async excluir(idCurso) {
      const [r] = await pool.query<ResultSetHeader>('DELETE FROM curso WHERE id_curso = ?', [idCurso])
      return r.affectedRows > 0
    },

    async listarDisciplinas(idCurso) {
      const [linhas] = await pool.query<RowDataPacket[]>(
        'SELECT id_disciplina, id_curso, nome, carga_horaria, semestre FROM disciplina WHERE id_curso = ? ORDER BY semestre, nome',
        [idCurso],
      )
      return linhas.map(paraDisciplina)
    },

    async buscarDisciplina(idDisciplina) {
      const [linhas] = await pool.query<RowDataPacket[]>(
        'SELECT id_disciplina, id_curso, nome, carga_horaria, semestre FROM disciplina WHERE id_disciplina = ?',
        [idDisciplina],
      )
      return linhas[0] ? paraDisciplina(linhas[0]) : null
    },

    async criarDisciplina(idCurso, d) {
      const [r] = await pool.query<ResultSetHeader>(
        'INSERT INTO disciplina (id_curso, nome, carga_horaria, semestre) VALUES (?, ?, ?, ?)',
        [idCurso, d.nome, d.cargaHoraria, d.semestre],
      )
      return r.insertId
    },

    async atualizarDisciplina(idDisciplina, d) {
      const [r] = await pool.query<ResultSetHeader>(
        'UPDATE disciplina SET nome = ?, carga_horaria = ?, semestre = ? WHERE id_disciplina = ?',
        [d.nome, d.cargaHoraria, d.semestre, idDisciplina],
      )
      return r.affectedRows > 0
    },

    async excluirDisciplina(idDisciplina) {
      const [r] = await pool.query<ResultSetHeader>('DELETE FROM disciplina WHERE id_disciplina = ?', [idDisciplina])
      return r.affectedRows > 0
    },

    async contarNotas(idDisciplina) {
      const [linhas] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) AS n FROM nota WHERE id_disciplina = ?', [idDisciplina])
      return Number(linhas[0].n)
    },
  }
}
