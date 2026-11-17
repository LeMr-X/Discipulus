import type { ResultSetHeader, RowDataPacket } from 'mysql2'
import { paraIso, type Pool } from '../db.js'
import type { AlunoDetalhe, AlunoResumo, DadosAluno, NovoAluno, StatusMatricula } from '../tipos.js'

export interface AlunosRepository {
  listar(busca: string | null): Promise<AlunoResumo[]>
  buscar(idAluno: number): Promise<AlunoDetalhe | null>
  /** Cria aluno, matrícula (opcional) e usuário de login, tudo junto. */
  criar(dados: NovoAluno & { senhaHash: string }): Promise<{ idAluno: number; ra: string }>
  atualizar(idAluno: number, dados: DadosAluno): Promise<boolean>
  excluir(idAluno: number): Promise<boolean>
  matricular(idAluno: number, idCurso: number): Promise<void>
  alterarStatusMatricula(idAluno: number, idMatricula: number, status: StatusMatricula): Promise<boolean>
  /** Ativa/desativa o login. Ao ativar, também tira o bloqueio por senha errada. */
  definirAcesso(idAluno: number, ativo: boolean): Promise<boolean>
}

const COLUNAS_DADOS = 'nome, cpf, email, telefone, data_nascimento, logradouro, numero, bairro, cidade, uf, cep'
const valoresDados = (d: DadosAluno) => [d.nome, d.cpf, d.email, d.telefone, d.dataNascimento, d.logradouro, d.numero, d.bairro, d.cidade, d.uf, d.cep]

/**
 * Próximo RA do ano: ano + sequência de 6 dígitos (2026000007).
 * Recebe o maior RA atual do ano (ou null).
 */
export function proximoRa(ano: number, maiorRaDoAno: string | null) {
  const seq = maiorRaDoAno ? Number(maiorRaDoAno.slice(4)) + 1 : 1
  return `${ano}${String(seq).padStart(6, '0')}`
}

export function criarAlunosRepository(pool: Pool): AlunosRepository {
  return {
    async listar(busca) {
      const filtro = busca ? `%${busca}%` : null
      const [linhas] = await pool.query<RowDataPacket[]>(
        `SELECT a.id_aluno, a.ra, a.nome, a.email, a.cpf, c.nome AS curso, m.status
           FROM aluno a
           LEFT JOIN matricula m ON m.id_matricula =
                (SELECT MAX(m2.id_matricula) FROM matricula m2 WHERE m2.id_aluno = a.id_aluno)
           LEFT JOIN curso c ON c.id_curso = m.id_curso
          WHERE ? IS NULL OR a.nome LIKE ? OR a.ra LIKE ? OR a.cpf LIKE ? OR a.email LIKE ?
          ORDER BY a.nome
          LIMIT 500`,
        [filtro, filtro, filtro, filtro, filtro],
      )
      return linhas.map((l) => ({
        idAluno: l.id_aluno,
        ra: l.ra,
        nome: l.nome,
        email: l.email,
        cpf: l.cpf,
        curso: l.curso,
        statusMatricula: l.status,
      }))
    },

    async buscar(idAluno) {
      const [[alunos], [matriculas], [usuarios]] = await Promise.all([
        pool.query<RowDataPacket[]>(`SELECT id_aluno, ra, ${COLUNAS_DADOS}, data_cadastro FROM aluno WHERE id_aluno = ?`, [idAluno]),
        pool.query<RowDataPacket[]>(
          `SELECT m.id_matricula, m.id_curso, c.nome AS curso, m.status, m.data_matricula
             FROM matricula m JOIN curso c ON c.id_curso = m.id_curso
            WHERE m.id_aluno = ? ORDER BY m.data_matricula DESC, m.id_matricula DESC`,
          [idAluno],
        ),
        pool.query<RowDataPacket[]>('SELECT login, ativo, bloqueado_ate, ultimo_acesso FROM usuario WHERE id_aluno = ?', [idAluno]),
      ])
      const a = alunos[0]
      if (!a) return null
      const u = usuarios[0]
      return {
        idAluno: a.id_aluno,
        ra: a.ra,
        nome: a.nome,
        cpf: a.cpf,
        email: a.email,
        telefone: a.telefone,
        dataNascimento: a.data_nascimento,
        logradouro: a.logradouro,
        numero: a.numero,
        bairro: a.bairro,
        cidade: a.cidade,
        uf: a.uf,
        cep: a.cep,
        dataCadastro: paraIso(a.data_cadastro),
        matriculas: matriculas.map((m) => ({
          idMatricula: m.id_matricula,
          idCurso: m.id_curso,
          curso: m.curso,
          status: m.status,
          dataMatricula: m.data_matricula,
        })),
        acesso: u
          ? {
              login: u.login,
              ativo: !!u.ativo,
              bloqueadoAte: u.bloqueado_ate ? paraIso(u.bloqueado_ate) : null,
              ultimoAcesso: u.ultimo_acesso ? paraIso(u.ultimo_acesso) : null,
            }
          : null,
      }
    },

    async criar(dados) {
      const conn = await pool.getConnection()
      try {
        await conn.beginTransaction()
        const ano = new Date().getFullYear()
        // FOR UPDATE: dois cadastros ao mesmo tempo não pegam o mesmo RA
        const [maior] = await conn.query<RowDataPacket[]>('SELECT MAX(ra) AS ra FROM aluno WHERE ra LIKE ? FOR UPDATE', [`${ano}%`])
        const ra = proximoRa(ano, maior[0].ra)

        const [ins] = await conn.query<ResultSetHeader>(
          `INSERT INTO aluno (ra, ${COLUNAS_DADOS}) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [ra, ...valoresDados(dados)],
        )
        const idAluno = ins.insertId
        if (dados.idCurso) {
          await conn.query('INSERT INTO matricula (id_aluno, id_curso) VALUES (?, ?)', [idAluno, dados.idCurso])
        }
        await conn.query("INSERT INTO usuario (login, senha_hash, perfil, id_aluno) VALUES (?, ?, 'ALUNO', ?)", [ra, dados.senhaHash, idAluno])
        await conn.commit()
        return { idAluno, ra }
      } catch (e) {
        await conn.rollback()
        throw e
      } finally {
        conn.release()
      }
    },

    async atualizar(idAluno, dados) {
      const [r] = await pool.query<ResultSetHeader>(
        `UPDATE aluno SET nome = ?, cpf = ?, email = ?, telefone = ?, data_nascimento = ?, logradouro = ?,
                numero = ?, bairro = ?, cidade = ?, uf = ?, cep = ?
          WHERE id_aluno = ?`,
        [...valoresDados(dados), idAluno],
      )
      return r.affectedRows > 0
    },

    async excluir(idAluno) {
      const [r] = await pool.query<ResultSetHeader>('DELETE FROM aluno WHERE id_aluno = ?', [idAluno])
      return r.affectedRows > 0
    },

    async matricular(idAluno, idCurso) {
      await pool.query('INSERT INTO matricula (id_aluno, id_curso) VALUES (?, ?)', [idAluno, idCurso])
    },

    async alterarStatusMatricula(idAluno, idMatricula, status) {
      const [r] = await pool.query<ResultSetHeader>('UPDATE matricula SET status = ? WHERE id_matricula = ? AND id_aluno = ?', [status, idMatricula, idAluno])
      return r.affectedRows > 0
    },

    async definirAcesso(idAluno, ativo) {
      const [r] = await pool.query<ResultSetHeader>(
        `UPDATE usuario SET ativo = ?,
                tentativas_falhas = IF(?, 0, tentativas_falhas),
                bloqueado_ate     = IF(?, NULL, bloqueado_ate)
          WHERE id_aluno = ?`,
        [ativo, ativo, ativo, idAluno],
      )
      return r.affectedRows > 0
    },
  }
}
