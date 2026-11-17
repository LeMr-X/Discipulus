import bcrypt from 'bcryptjs'
import type { AuthRepository, EstadoUsuario } from '../src/auth/authRepository.js'
import type { MotivoLogin, PainelAluno, Usuario } from '../src/tipos.js'

export const SENHA = 'Senha@123'
export const HASH = bcrypt.hashSync(SENHA, 4) // custo baixo só para o teste ser rápido

export const ana: Usuario = {
  idUsuario: 5,
  login: '2026000001',
  perfil: 'ALUNO',
  nome: 'Ana Souza',
  ra: '2026000001',
  cargo: null,
  idAluno: 1,
}

interface UsuarioFake extends Usuario {
  hash: string
  ativo: boolean
  falhas: number
  bloqueadoAte: Date | null
}

const doBanco = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

/**
 * Repositório em memória que imita a procedure sp_registrar_login,
 * para testar o serviço sem precisar do MySQL.
 */
export function criarRepoFake(agora: () => Date = () => new Date()) {
  const usuarios: UsuarioFake[] = [
    { ...ana, hash: HASH, ativo: true, falhas: 0, bloqueadoAte: null },
    { ...ana, idUsuario: 10, login: '2026000006', nome: 'Felipe Almeida', ra: '2026000006', idAluno: 6, hash: HASH, ativo: false, falhas: 0, bloqueadoAte: null },
  ]
  const tentativas: { login: string; senhaOk: boolean; ip: string | null; motivo: MotivoLogin }[] = []

  const repo: AuthRepository = {
    async buscarCredencial(login) {
      const u = usuarios.find((x) => x.login === login)
      return u ? { idUsuario: u.idUsuario, senhaHash: u.hash } : null
    },
    async registrarTentativa(login, senhaOk, ip) {
      const u = usuarios.find((x) => x.login === login)
      let motivo: MotivoLogin
      if (!u) motivo = 'USUARIO_INEXISTENTE'
      else if (!u.ativo) motivo = 'USUARIO_INATIVO'
      else if (u.bloqueadoAte && u.bloqueadoAte > agora()) motivo = 'USUARIO_BLOQUEADO'
      else if (senhaOk) {
        motivo = 'OK'
        u.falhas = 0
        u.bloqueadoAte = null
      } else {
        motivo = 'SENHA_INVALIDA'
        u.falhas += 1
        if (u.falhas >= 3) {
          u.falhas = 0
          u.bloqueadoAte = new Date(agora().getTime() + 15 * 60_000)
        }
      }
      tentativas.push({ login, senhaOk, ip, motivo })
      return motivo
    },
    async buscarEstado(idUsuario): Promise<EstadoUsuario> {
      const u = usuarios.find((x) => x.idUsuario === idUsuario)!
      return { tentativasFalhas: u.falhas, bloqueadoAte: u.bloqueadoAte ? doBanco(u.bloqueadoAte) : null }
    },
    async buscarUsuario(idUsuario) {
      const { hash: _h, ativo: _a, falhas: _f, bloqueadoAte: _b, ...u } = usuarios.find((x) => x.idUsuario === idUsuario)!
      return u
    },
  }

  return { repo, usuarios, tentativas }
}

export const painelAna: PainelAluno = {
  aluno: { ra: '2026000001', nome: 'Ana Souza', email: 'ana.souza@aluno.edu.br', telefone: null, cidade: null, uf: null },
  matricula: { curso: 'Ciência da Computação', status: 'ATIVA', dataMatricula: '2026-02-10' },
  boletim: [{ disciplina: 'Banco de Dados', semestre: 3, a1: 8.5, a2: 7, a3: 9, media: 8.17, situacao: 'APROVADO' }],
  historico: [],
}
