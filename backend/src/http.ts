import type { NextFunction, Request, Response } from 'express'
import { z } from 'zod'
import type { Sessao, Tokens } from './auth/token.js'
import { ErroHttp } from './erros.js'
import { pode, type Permissao } from './permissoes.js'

/** Exige token válido; a sessão fica em res.locals.sessao */
export function autenticar(tokens: Tokens) {
  return (req: Request, res: Response, next: NextFunction) => {
    const [tipo, token] = (req.headers.authorization ?? '').split(' ')
    const sessao = tipo === 'Bearer' && token ? tokens.verificar(token) : null
    if (!sessao) {
      res.status(401).json({ erro: 'Sessão inválida ou expirada. Faça login novamente.' })
      return
    }
    res.locals.sessao = sessao
    next()
  }
}

/** Exige que o funcionário logado tenha a permissão (ver permissoes.ts) */
export function exigir(permissao: Permissao) {
  return (_req: Request, res: Response, next: NextFunction) => {
    if (!pode(res.locals.sessao as Sessao, permissao)) {
      res.status(403).json({ erro: 'Seu cargo não tem permissão para esta ação.' })
      return
    }
    next()
  }
}

export const sessaoDe = (res: Response) => res.locals.sessao as Sessao

/** Lê um id numérico da URL */
export function idDaRota(req: Request, nome = 'id') {
  const id = Number(req.params[nome])
  if (!Number.isInteger(id) || id <= 0) throw new ErroHttp(400, 'Id inválido.')
  return id
}

/** Valida o corpo com zod; erro vira 400 com a primeira mensagem */
export function validar<T extends z.ZodTypeAny>(esquema: T, dados: unknown): z.infer<T> {
  const r = esquema.safeParse(dados)
  if (!r.success) {
    const p = r.error.issues[0]
    throw new ErroHttp(400, p.message)
  }
  return r.data
}
