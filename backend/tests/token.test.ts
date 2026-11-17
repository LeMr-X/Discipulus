import jwt from 'jsonwebtoken'
import { describe, expect, it } from 'vitest'
import { criarTokens } from '../src/auth/token.js'
import { ana } from './fakes.js'

describe('Tokens', () => {
  const tokens = criarTokens('segredo-de-teste', '1h')

  it('gera um token que guarda só id, perfil e aluno', () => {
    const token = tokens.gerar(ana)
    expect(tokens.verificar(token)).toEqual({ idUsuario: 5, perfil: 'ALUNO', idAluno: 1, cargo: null })
    expect(JSON.stringify(jwt.decode(token))).not.toContain('Ana')
  })

  it('recusa token assinado com outra chave', () => {
    const outro = criarTokens('outro-segredo', '1h').gerar(ana)
    expect(tokens.verificar(outro)).toBeNull()
  })

  it('recusa token expirado', () => {
    const expirado = jwt.sign({ idUsuario: 5, perfil: 'ALUNO', idAluno: 1, exp: Math.floor(Date.now() / 1000) - 10 }, 'segredo-de-teste')
    expect(tokens.verificar(expirado)).toBeNull()
  })

  it('recusa texto que não é token', () => {
    expect(tokens.verificar('abc.def.ghi')).toBeNull()
  })
})
