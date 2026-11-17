// Integração com o MySQL real: regra de aprovação (RN02).
// Situação na view vw_boletim:
//   - menos de 3 avaliações lançadas -> EM ANDAMENTO
//   - média das 3 avaliações >= 7     -> APROVADO
//   - média das 3 avaliações <  7     -> REPROVADO
// Só roda com DB_TESTE=1 (veja mysql.integration.test.ts).

import { afterAll, afterEach, describe, expect, it } from 'vitest'
import { criarPainelRepository } from '../src/alunos/painelRepository.js'
import { criarPool } from '../src/db.js'
import { criarNotasRepository } from '../src/notas/notasRepository.js'
import type { Avaliacao } from '../src/tipos.js'

const ativo = process.env.DB_TESTE === '1'

// Ana (id 1) é de Ciência da Computação e não tem notas em "Algoritmos e Programação" (disciplina 1)
const ANA = 1
const ALGORITMOS = 1
const PROFESSORA = 3 // usuário da Juliana

describe.skipIf(!ativo)('Integração com MySQL: situação do aluno (RN02)', () => {
  const pool = criarPool({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME ?? 'sistema_alunos',
  })
  const notas = criarNotasRepository(pool)
  const painel = criarPainelRepository(pool)

  const lancarTodas = async (valores: Partial<Record<Avaliacao, number>>) => {
    for (const [avaliacao, nota] of Object.entries(valores)) {
      await notas.lancar(ALGORITMOS, ANA, avaliacao as Avaliacao, nota, PROFESSORA)
    }
  }
  const boletim = async () =>
    (await painel.buscarPainel(ANA))!.boletim.find((b) => b.disciplina === 'Algoritmos e Programação')

  afterEach(async () => {
    await pool.query('DELETE FROM nota WHERE id_aluno = ? AND id_disciplina = ?', [ANA, ALGORITMOS])
  })
  afterAll(() => pool.end())

  it('fica EM ANDAMENTO enquanto faltar avaliação', async () => {
    await lancarTodas({ A1: 10, A2: 10 })
    expect(await boletim()).toMatchObject({ situacao: 'EM ANDAMENTO' })
  })

  it('aprova com média exatamente 7 (limite)', async () => {
    await lancarTodas({ A1: 7, A2: 7, A3: 7 })
    expect(await boletim()).toMatchObject({ media: 7, situacao: 'APROVADO' })
  })

  it('reprova com média 6,99 (logo abaixo do limite)', async () => {
    await lancarTodas({ A1: 7, A2: 7, A3: 6.97 })
    expect(await boletim()).toMatchObject({ media: 6.99, situacao: 'REPROVADO' })
  })

  it('a correção de uma nota recalcula a situação', async () => {
    await lancarTodas({ A1: 5, A2: 6, A3: 7 })
    expect(await boletim()).toMatchObject({ situacao: 'REPROVADO' })
    await lancarTodas({ A3: 10 })
    expect(await boletim()).toMatchObject({ media: 7, situacao: 'APROVADO' })
  })

  it('o banco recusa nota fora da escala, mesmo sem passar pela validação da API', async () => {
    await expect(notas.lancar(ALGORITMOS, ANA, 'A1', 10.5, PROFESSORA)).rejects.toMatchObject({ errno: 3819 })
    await expect(notas.lancar(ALGORITMOS, ANA, 'A1', -1, PROFESSORA)).rejects.toMatchObject({ errno: 3819 })
  })
})
