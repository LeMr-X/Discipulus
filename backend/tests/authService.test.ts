import { describe, expect, it } from 'vitest'
import { criarAuthService, MAX_FALHAS } from '../src/auth/authService.js'
import { criarTokens } from '../src/auth/token.js'
import { ana, criarRepoFake, SENHA } from './fakes.js'

const tokens = criarTokens('segredo-de-teste', '1h')

function montar(agora?: () => Date) {
  const fake = criarRepoFake(agora)
  return { ...fake, service: criarAuthService(fake.repo, tokens, agora) }
}

describe('AuthService.login', () => {
  it('entra com login e senha corretos e devolve um token válido', async () => {
    const { service } = montar()
    const r = await service.login('2026000001', SENHA, '127.0.0.1')

    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.usuario).toEqual(ana)
    expect(tokens.verificar(r.token)).toEqual({ idUsuario: 5, perfil: 'ALUNO', idAluno: 1, cargo: null })
  })

  it('ignora espaços antes e depois do login', async () => {
    const { service, tentativas } = montar()
    const r = await service.login('  2026000001  ', SENHA, null)
    expect(r.ok).toBe(true)
    expect(tentativas[0].login).toBe('2026000001')
  })

  it('recusa senha errada e informa quantas tentativas restam', async () => {
    const { service } = montar()
    const r = await service.login('2026000001', 'errada', null)
    expect(r).toEqual({ ok: false, motivo: 'SENHA_INVALIDA', tentativasRestantes: MAX_FALHAS - 1 })
  })

  it('bloqueia o usuário na 3ª senha errada seguida', async () => {
    const { service } = montar()
    await service.login('2026000001', 'errada', null)
    const segunda = await service.login('2026000001', 'errada', null)
    const terceira = await service.login('2026000001', 'errada', null)

    expect(segunda).toMatchObject({ motivo: 'SENHA_INVALIDA', tentativasRestantes: 1 })
    expect(terceira).toMatchObject({ ok: false, motivo: 'USUARIO_BLOQUEADO' })
    expect(terceira.ok === false && terceira.bloqueadoAte).toBeTruthy()
  })

  it('continua bloqueado mesmo com a senha certa durante os 15 minutos', async () => {
    const { service } = montar()
    for (let i = 0; i < 3; i++) await service.login('2026000001', 'errada', null)
    const r = await service.login('2026000001', SENHA, null)
    expect(r).toMatchObject({ ok: false, motivo: 'USUARIO_BLOQUEADO' })
  })

  it('libera o acesso depois que o bloqueio expira', async () => {
    let agora = new Date('2026-11-03T14:00:00')
    const { service } = montar(() => agora)
    for (let i = 0; i < 3; i++) await service.login('2026000001', 'errada', null)

    agora = new Date('2026-11-03T14:16:00') // 16 minutos depois
    const r = await service.login('2026000001', SENHA, null)
    expect(r.ok).toBe(true)
  })

  it('zera a contagem de falhas após um login correto', async () => {
    const { service } = montar()
    await service.login('2026000001', 'errada', null)
    await service.login('2026000001', 'errada', null)
    await service.login('2026000001', SENHA, null)
    const r = await service.login('2026000001', 'errada', null)
    expect(r).toMatchObject({ motivo: 'SENHA_INVALIDA', tentativasRestantes: 2 })
  })

  it('recusa login que não existe, sem dizer se a senha estava certa', async () => {
    const { service, tentativas } = montar()
    const r = await service.login('nao.existe', SENHA, null)
    expect(r).toEqual({ ok: false, motivo: 'USUARIO_INEXISTENTE' })
    expect(tentativas[0].senhaOk).toBe(false)
  })

  it('recusa usuário inativo mesmo com a senha certa', async () => {
    const { service } = montar()
    const r = await service.login('2026000006', SENHA, null)
    expect(r).toEqual({ ok: false, motivo: 'USUARIO_INATIVO' })
  })

  it('registra toda tentativa com o IP de origem', async () => {
    const { service, tentativas } = montar()
    await service.login('2026000001', 'errada', '10.0.0.5')
    await service.login('2026000001', SENHA, '10.0.0.5')
    expect(tentativas.map((t) => [t.ip, t.motivo])).toEqual([
      ['10.0.0.5', 'SENHA_INVALIDA'],
      ['10.0.0.5', 'OK'],
    ])
  })
})
