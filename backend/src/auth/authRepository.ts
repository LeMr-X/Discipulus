import type { RowDataPacket } from 'mysql2'
import type { Pool } from '../db.js'
import type { MotivoLogin, Usuario } from '../tipos.js'

export interface Credencial {
  idUsuario: number
  senhaHash: string
}

export interface EstadoUsuario {
  tentativasFalhas: number
  /** Hora local do banco, "YYYY-MM-DD HH:MM:SS", ou null */
  bloqueadoAte: string | null
}

/** Acesso ao banco usado pelo login. A versão de teste fica em tests/. */
export interface AuthRepository {
  buscarCredencial(login: string): Promise<Credencial | null>
  /** Chama a procedure sp_registrar_login e devolve o motivo. */
  registrarTentativa(login: string, senhaOk: boolean, ip: string | null): Promise<MotivoLogin>
  buscarEstado(idUsuario: number): Promise<EstadoUsuario>
  buscarUsuario(idUsuario: number): Promise<Usuario>
}

export function criarAuthRepository(pool: Pool): AuthRepository {
  return {
    async buscarCredencial(login) {
      const [linhas] = await pool.query<RowDataPacket[]>(
        'SELECT id_usuario, senha_hash FROM usuario WHERE login = ?',
        [login],
      )
      const l = linhas[0]
      return l ? { idUsuario: l.id_usuario, senhaHash: l.senha_hash } : null
    },

    async registrarTentativa(login, senhaOk, ip) {
      // @resultado é variável de sessão: CALL e SELECT precisam da mesma conexão
      const conn = await pool.getConnection()
      try {
        await conn.query('CALL sp_registrar_login(?, ?, ?, @resultado)', [login, senhaOk, ip])
        const [linhas] = await conn.query<RowDataPacket[]>('SELECT @resultado AS resultado')
        return linhas[0].resultado as MotivoLogin
      } finally {
        conn.release()
      }
    },

    async buscarEstado(idUsuario) {
      const [linhas] = await pool.query<RowDataPacket[]>(
        'SELECT tentativas_falhas, bloqueado_ate FROM usuario WHERE id_usuario = ?',
        [idUsuario],
      )
      return { tentativasFalhas: linhas[0].tentativas_falhas, bloqueadoAte: linhas[0].bloqueado_ate }
    },

    async buscarUsuario(idUsuario) {
      const [linhas] = await pool.query<RowDataPacket[]>(
        `SELECT u.id_usuario, u.login, u.perfil, u.id_aluno,
                COALESCE(a.nome, f.nome) AS nome, a.ra, f.cargo
           FROM usuario u
           LEFT JOIN aluno       a ON a.id_aluno       = u.id_aluno
           LEFT JOIN funcionario f ON f.id_funcionario = u.id_funcionario
          WHERE u.id_usuario = ?`,
        [idUsuario],
      )
      const l = linhas[0]
      return {
        idUsuario: l.id_usuario,
        login: l.login,
        perfil: l.perfil,
        nome: l.nome,
        ra: l.ra,
        cargo: l.cargo,
        idAluno: l.id_aluno,
      }
    },
  }
}
