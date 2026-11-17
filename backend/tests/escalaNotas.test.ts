// Regra de negócio documentada no README (RN01): escala de notas.
// Nota de 0,00 a 10,00, com no máximo 2 casas decimais, para as avaliações A1, A2 e A3.
// Testa valores válidos, os limites exatos e valores logo fora dos limites.

import { describe, expect, it } from 'vitest'
import { esquemaNota } from '../src/validacao.js'

const lancar = (nota: unknown, avaliacao: unknown = 'A1') => esquemaNota.safeParse({ idAluno: 1, avaliacao, nota })

describe('RN01: escala de notas (0 a 10, até 2 casas)', () => {
  describe('situações válidas', () => {
    it.each([0, 0.01, 6.99, 7, 9.99, 10])('aceita a nota %s', (nota) => {
      expect(lancar(nota).success).toBe(true)
    })

    it.each(['A1', 'A2', 'A3'])('aceita a avaliação %s', (avaliacao) => {
      expect(lancar(8, avaliacao).success).toBe(true)
    })

    it('aceita null para apagar uma nota já lançada', () => {
      expect(lancar(null).success).toBe(true)
    })
  })

  describe('limites e rejeições', () => {
    it.each([-0.01, -1])('recusa nota abaixo de 0 (%s)', (nota) => {
      const r = lancar(nota)
      expect(r.success).toBe(false)
      expect(r.error?.issues[0].message).toBe('A nota vai de 0 a 10.')
    })

    it.each([10.01, 11])('recusa nota acima de 10 (%s)', (nota) => {
      const r = lancar(nota)
      expect(r.success).toBe(false)
      expect(r.error?.issues[0].message).toBe('A nota vai de 0 a 10.')
    })

    it.each([7.001, 9.999])('recusa nota com mais de 2 casas decimais (%s)', (nota) => {
      const r = lancar(nota)
      expect(r.success).toBe(false)
      expect(r.error?.issues[0].message).toBe('Use no máximo 2 casas decimais.')
    })

    it.each(['7', '', undefined, Number.NaN])('recusa valor que não é número (%s)', (nota) => {
      expect(lancar(nota).success).toBe(false)
    })

    it.each(['A0', 'A4', 'a1', ''])('recusa a avaliação %s', (avaliacao) => {
      expect(lancar(8, avaliacao).success).toBe(false)
    })
  })
})
