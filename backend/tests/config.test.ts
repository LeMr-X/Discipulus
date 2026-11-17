import { afterEach, describe, expect, it, vi } from 'vitest'
import { carregarConfig } from '../src/config.js'

describe('carregarConfig', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('exige JWT_SECRET', () => {
    vi.stubEnv('JWT_SECRET', '')
    expect(() => carregarConfig()).toThrow(/JWT_SECRET/)
  })

  it('lê as variáveis de ambiente', () => {
    vi.stubEnv('JWT_SECRET', 'abc')
    vi.stubEnv('PORT', '4000')
    vi.stubEnv('DB_PORT', '3399')
    const c = carregarConfig()
    expect(c.porta).toBe(4000)
    expect(c.db.port).toBe(3399)
    expect(c.jwt).toEqual({ segredo: 'abc', expiraEm: '2h' })
  })
})
