// Regras de validação dos formulários. Seguem as restrições do banco
// (01_schema.sql), para o erro aparecer antes de chegar no MySQL.

import { z } from 'zod'

const apenasDigitos = (v: string) => v.replace(/\D/g, '')

/** Texto opcional: vazio vira null */
const opcional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => (v ? v : null))

export const esquemaDadosAluno = z.object({
  nome: z.string().trim().min(3, 'Informe o nome completo.').max(100),
  cpf: z
    .string()
    .transform(apenasDigitos)
    .refine((v) => v.length === 11, 'O CPF deve ter 11 dígitos.'),
  email: z.string().trim().toLowerCase().email('E-mail inválido.').max(100),
  telefone: opcional(20)
    .transform((v) => (v ? apenasDigitos(v) : null))
    .refine((v) => v === null || (v.length >= 10 && v.length <= 11), 'Telefone deve ter DDD + número.'),
  dataNascimento: opcional(10).refine((v) => v === null || /^\d{4}-\d{2}-\d{2}$/.test(v), 'Data de nascimento inválida.'),
  logradouro: opcional(120),
  numero: opcional(10),
  bairro: opcional(60),
  cidade: opcional(60),
  uf: opcional(2)
    .transform((v) => (v ? v.toUpperCase() : null))
    .refine((v) => v === null || /^[A-Z]{2}$/.test(v), 'UF deve ter 2 letras.'),
  cep: opcional(9)
    .transform((v) => (v ? apenasDigitos(v) : null))
    .refine((v) => v === null || v.length === 8, 'O CEP deve ter 8 dígitos.'),
})

export const esquemaNovoAluno = esquemaDadosAluno.extend({
  idCurso: z.number().int().positive().nullish().transform((v) => v ?? null),
  senhaInicial: z.string().min(8, 'A senha inicial deve ter pelo menos 8 caracteres.').max(72),
})

export const esquemaStatusMatricula = z.object({
  status: z.enum(['ATIVA', 'TRANCADA', 'CONCLUIDA', 'CANCELADA'], { message: 'Status inválido.' }),
})

export const esquemaCurso = z.object({
  nome: z.string().trim().min(3, 'Informe o nome do curso.').max(100),
  categoria: z.enum(['BACHARELADO', 'LICENCIATURA', 'TECNOLOGO', 'POS_GRADUACAO'], { message: 'Categoria inválida.' }),
  duracaoSemestres: z.number({ message: 'Informe a duração.' }).int().min(1, 'Duração mínima: 1 semestre.').max(12, 'Duração máxima: 12 semestres.'),
  status: z.enum(['ATIVO', 'INATIVO']).default('ATIVO'),
})

export const esquemaDisciplina = z.object({
  nome: z.string().trim().min(2, 'Informe o nome da disciplina.').max(100),
  cargaHoraria: z.number({ message: 'Informe a carga horária.' }).int().min(1, 'Carga horária deve ser maior que zero.').max(1000),
  semestre: z.number({ message: 'Informe o semestre.' }).int().min(1).max(12),
})

export const esquemaNota = z.object({
  idAluno: z.number().int().positive(),
  avaliacao: z.enum(['A1', 'A2', 'A3'], { message: 'Avaliação inválida.' }),
  // null apaga a nota
  nota: z
    .number()
    .min(0, 'A nota vai de 0 a 10.')
    .max(10, 'A nota vai de 0 a 10.')
    .refine((n) => Math.round(n * 100) === n * 100, 'Use no máximo 2 casas decimais.')
    .nullable(),
})
