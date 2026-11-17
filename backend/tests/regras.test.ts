import { describe, expect, it } from 'vitest'
import { proximoRa } from '../src/alunos/alunosRepository.js'
import { ErroHttp, traduzirErroMysql } from '../src/erros.js'
import { pode } from '../src/permissoes.js'
import { validarCursoParaMatricula, validarNovaDuracao, validarSemestreDaDisciplina } from '../src/regras.js'
import type { Cargo } from '../src/tipos.js'

const curso = { nome: 'ADS', duracaoSemestres: 5, status: 'ATIVO' as const }

describe('Regras de negócio', () => {
  it('aceita disciplina até o último semestre do curso', () => {
    expect(() => validarSemestreDaDisciplina(5, curso)).not.toThrow()
  })

  it('recusa disciplina depois do fim do curso', () => {
    expect(() => validarSemestreDaDisciplina(6, curso)).toThrow(/5 semestres/)
  })

  it('só matricula em curso ativo', () => {
    expect(() => validarCursoParaMatricula(curso)).not.toThrow()
    expect(() => validarCursoParaMatricula({ ...curso, status: 'INATIVO' })).toThrow(/inativo/)
    expect(() => validarCursoParaMatricula(null)).toThrow(/não encontrado/)
  })

  it('não deixa encurtar curso que tem disciplinas nos semestres finais', () => {
    expect(() => validarNovaDuracao(6, 6)).not.toThrow()
    expect(() => validarNovaDuracao(4, 6)).toThrow(/6º semestre/)
  })
})

describe('Geração de RA', () => {
  it('começa em 000001 no ano', () => expect(proximoRa(2027, null)).toBe('2027000001'))
  it('soma 1 ao maior RA do ano', () => expect(proximoRa(2026, '2026000006')).toBe('2026000007'))
  it('mantém 10 dígitos', () => expect(proximoRa(2026, '2026000099')).toHaveLength(10))
})

describe('Permissões por cargo', () => {
  const sessao = (cargo: Cargo | null, perfil: 'ALUNO' | 'FUNCIONARIO' = 'FUNCIONARIO') => ({ idUsuario: 1, perfil, idAluno: null, cargo })

  it.each([
    ['SECRETARIA', true, false],
    ['PROFESSOR', false, true],
    ['COORDENADOR', true, true],
    ['ADMINISTRADOR', true, true],
  ] as const)('%s: cadastros=%s, notas=%s', (cargo, cadastros, notas) => {
    expect(pode(sessao(cargo), 'cadastros')).toBe(cadastros)
    expect(pode(sessao(cargo), 'notas')).toBe(notas)
    expect(pode(sessao(cargo), 'consultar')).toBe(true)
  })

  it('aluno não tem nenhuma permissão de funcionário', () => {
    expect(pode(sessao(null, 'ALUNO'), 'consultar')).toBe(false)
  })
})

describe('Tradução de erros do MySQL', () => {
  it('chave duplicada vira 409 com mensagem do campo', () => {
    const e = traduzirErroMysql({ errno: 1062, sqlMessage: "Duplicate entry '1' for key 'aluno.uq_aluno_cpf'" })
    expect(e).toEqual(new ErroHttp(409, 'Já existe um aluno com este CPF.'))
    expect(e?.status).toBe(409)
  })

  it('chave duplicada desconhecida tem mensagem genérica', () => {
    expect(traduzirErroMysql({ errno: 1062, sqlMessage: 'x' })?.message).toBe('Registro duplicado.')
  })

  it('SIGNAL de trigger vira 422 com a mensagem do banco', () => {
    const e = traduzirErroMysql({ errno: 1644, sqlMessage: 'Nao e possivel lancar nota' })
    expect([e?.status, e?.message]).toEqual([422, 'Nao e possivel lancar nota'])
  })

  it('CHECK e FK viram 400 e 422', () => {
    expect(traduzirErroMysql({ errno: 3819 })?.status).toBe(400)
    expect(traduzirErroMysql({ errno: 1452 })?.status).toBe(422)
  })

  it('ignora erros que não são do MySQL', () => {
    expect(traduzirErroMysql(new Error('x'))).toBeNull()
    expect(traduzirErroMysql({ errno: 9999 })).toBeNull()
    expect(traduzirErroMysql(null)).toBeNull()
  })
})
