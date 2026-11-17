import { describe, expect, it } from 'vitest'
import type { PainelRepository } from '../src/alunos/painelRepository.js'
import { criarPainelService, podeVerPainel } from '../src/alunos/painelService.js'
import { painelAna } from './fakes.js'

const repo: PainelRepository = { buscarPainel: async (id) => (id === 1 ? painelAna : null) }
const service = criarPainelService(repo)

const alunaAna = { idUsuario: 5, perfil: 'ALUNO', idAluno: 1, cargo: null } as const
const alunoBruno = { idUsuario: 6, perfil: 'ALUNO', idAluno: 2, cargo: null } as const
const professora = { idUsuario: 3, perfil: 'FUNCIONARIO', idAluno: null, cargo: 'PROFESSOR' } as const

describe('Regra de acesso ao painel', () => {
  it('aluno vê o próprio painel', () => expect(podeVerPainel(alunaAna, 1)).toBe(true))
  it('aluno não vê o painel de outro aluno', () => expect(podeVerPainel(alunoBruno, 1)).toBe(false))
  it('funcionário vê o painel de qualquer aluno', () => expect(podeVerPainel(professora, 1)).toBe(true))
})

describe('PainelService.buscar', () => {
  it('devolve o painel quando o acesso é permitido', async () => {
    expect(await service.buscar(alunaAna, 1)).toEqual({ tipo: 'ok', painel: painelAna })
  })

  it('não consulta o banco quando o acesso é proibido', async () => {
    let consultou = false
    const s = criarPainelService({ buscarPainel: async () => ((consultou = true), painelAna) })
    expect(await s.buscar(alunoBruno, 1)).toEqual({ tipo: 'proibido' })
    expect(consultou).toBe(false)
  })

  it('avisa quando o aluno não existe', async () => {
    expect(await service.buscar(professora, 999)).toEqual({ tipo: 'nao-encontrado' })
  })
})
