import { describe, expect, it } from 'vitest'
import { esquemaCurso, esquemaDadosAluno, esquemaNota, esquemaNovoAluno } from '../src/validacao.js'

const alunoValido = { nome: 'Maria Silva', cpf: '987.654.321-00', email: ' Maria@Email.com ' }

describe('Validação do aluno', () => {
  it('limpa CPF, e-mail e campos vazios', () => {
    const d = esquemaDadosAluno.parse({ ...alunoValido, telefone: '(48) 99999-0000', cep: '88010-000', uf: 'sc', cidade: '' })
    expect(d).toMatchObject({ cpf: '98765432100', email: 'maria@email.com', telefone: '48999990000', cep: '88010000', uf: 'SC', cidade: null, bairro: null })
  })

  it.each([
    [{ cpf: '123' }, 'O CPF deve ter 11 dígitos.'],
    [{ email: 'sem-arroba' }, 'E-mail inválido.'],
    [{ nome: 'Al' }, 'Informe o nome completo.'],
    [{ telefone: '9999' }, 'Telefone deve ter DDD + número.'],
    [{ cep: '123' }, 'O CEP deve ter 8 dígitos.'],
    [{ uf: 'S1' }, 'UF deve ter 2 letras.'],
    [{ dataNascimento: '10/05/2004' }, 'Data de nascimento inválida.'],
  ])('recusa %j', (troca, mensagem) => {
    const r = esquemaDadosAluno.safeParse({ ...alunoValido, ...troca })
    expect(r.success).toBe(false)
    expect(r.error?.issues[0].message).toBe(mensagem)
  })

  it('exige senha inicial de 8+ caracteres no cadastro', () => {
    expect(esquemaNovoAluno.safeParse({ ...alunoValido, senhaInicial: '1234567' }).success).toBe(false)
    expect(esquemaNovoAluno.parse({ ...alunoValido, senhaInicial: '12345678' }).idCurso).toBeNull()
  })
})

describe('Validação do curso', () => {
  it('assume status ATIVO quando não informado', () => {
    expect(esquemaCurso.parse({ nome: 'Direito', categoria: 'BACHARELADO', duracaoSemestres: 10 }).status).toBe('ATIVO')
  })

  it('recusa duração fora de 1 a 12', () => {
    expect(esquemaCurso.safeParse({ nome: 'Direito', categoria: 'BACHARELADO', duracaoSemestres: 13 }).success).toBe(false)
  })
})

describe('Validação da nota', () => {
  it.each([0, 7.5, 9.25, 10, null])('aceita %s', (nota) => {
    expect(esquemaNota.safeParse({ idAluno: 1, avaliacao: 'A1', nota }).success).toBe(true)
  })

  it.each([-1, 10.5, 7.333])('recusa %s', (nota) => {
    expect(esquemaNota.safeParse({ idAluno: 1, avaliacao: 'A1', nota }).success).toBe(false)
  })

  it('recusa avaliação que não é A1, A2 ou A3', () => {
    expect(esquemaNota.safeParse({ idAluno: 1, avaliacao: 'A4', nota: 5 }).success).toBe(false)
  })
})
