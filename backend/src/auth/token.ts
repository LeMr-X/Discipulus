import jwt, { type SignOptions } from 'jsonwebtoken'
import type { Cargo, Perfil, Usuario } from '../tipos.js'

/** O que vai dentro do token de login */
export interface Sessao {
  idUsuario: number
  perfil: Perfil
  idAluno: number | null
  cargo: Cargo | null
}

export interface Tokens {
  gerar(usuario: Usuario): string
  verificar(token: string): Sessao | null
}

export function criarTokens(segredo: string, expiraEm: string): Tokens {
  return {
    gerar(usuario) {
      const sessao: Sessao = {
        idUsuario: usuario.idUsuario,
        perfil: usuario.perfil,
        idAluno: usuario.idAluno,
        cargo: usuario.cargo,
      }
      return jwt.sign(sessao, segredo, { expiresIn: expiraEm as SignOptions['expiresIn'], algorithm: 'HS256' })
    },
    verificar(token) {
      try {
        const { idUsuario, perfil, idAluno, cargo } = jwt.verify(token, segredo, { algorithms: ['HS256'] }) as Sessao
        return { idUsuario, perfil, idAluno, cargo: cargo ?? null }
      } catch {
        return null
      }
    },
  }
}
