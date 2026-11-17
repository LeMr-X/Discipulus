import bcrypt from 'bcryptjs'
import type { ResultadoLogin } from '../tipos.js'
import type { AuthRepository } from './authRepository.js'
import type { Tokens } from './token.js'

/** Mesmo limite da procedure sp_registrar_login */
export const MAX_FALHAS = 3

// Hash usado quando o login não existe: a conferência leva o mesmo tempo,
// então não dá para descobrir quais logins existem medindo a resposta.
const HASH_FALSO = bcrypt.hashSync('usuario-inexistente', 10)

/** "2026-11-03 14:00:00" (hora local do banco) -> Date */
const paraData = (valor: string) => new Date(valor.replace(' ', 'T'))

export interface AuthService {
  login(login: string, senha: string, ip: string | null): Promise<ResultadoLogin>
}

export function criarAuthService(repo: AuthRepository, tokens: Tokens, agora: () => Date = () => new Date()): AuthService {
  return {
    async login(loginInformado, senha, ip) {
      const login = loginInformado.trim()
      const credencial = await repo.buscarCredencial(login)
      const senhaConfere = await bcrypt.compare(senha, credencial?.senhaHash ?? HASH_FALSO)
      const senhaOk = credencial !== null && senhaConfere

      // O banco decide o resultado (ativo, bloqueio, contagem de falhas) e grava o log
      const motivo = await repo.registrarTentativa(login, senhaOk, ip)

      switch (motivo) {
        case 'OK': {
          const usuario = await repo.buscarUsuario(credencial!.idUsuario)
          return { ok: true, usuario, token: tokens.gerar(usuario) }
        }
        case 'USUARIO_INEXISTENTE':
        case 'USUARIO_INATIVO':
          return { ok: false, motivo }
        case 'USUARIO_BLOQUEADO': {
          const estado = await repo.buscarEstado(credencial!.idUsuario)
          return { ok: false, motivo, bloqueadoAte: estado.bloqueadoAte ? paraData(estado.bloqueadoAte).toISOString() : undefined }
        }
        case 'SENHA_INVALIDA': {
          const estado = await repo.buscarEstado(credencial!.idUsuario)
          // Na 3ª falha a procedure já bloqueia, mas ainda responde SENHA_INVALIDA
          if (estado.bloqueadoAte && paraData(estado.bloqueadoAte) > agora()) {
            return { ok: false, motivo: 'USUARIO_BLOQUEADO', bloqueadoAte: paraData(estado.bloqueadoAte).toISOString() }
          }
          return { ok: false, motivo, tentativasRestantes: MAX_FALHAS - estado.tentativasFalhas }
        }
      }
    },
  }
}
