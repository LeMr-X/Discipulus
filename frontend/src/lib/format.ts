const nota = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })
const data = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
const hora = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' })

export const formatNota = (n: number | null) => (n === null ? '—' : nota.format(n))
/** "10 fev 2026" */
export function formatData(iso: string) {
  const p = Object.fromEntries(data.formatToParts(new Date(iso)).map((x) => [x.type, x.value]))
  return `${p.day} ${p.month.replace('.', '')} ${p.year}`
}
export const formatHora = (iso: string) => hora.format(new Date(iso))

/** Primeiro + último nome, para iniciais e saudações. */
export function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/)
  const primeira = partes[0]?.[0] ?? ''
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : ''
  return (primeira + ultima).toUpperCase()
}

export const primeiroNome = (nome: string) => nome.trim().split(/\s+/)[0]

/** "1 disciplina", "2 disciplinas" */
const plural = new Intl.PluralRules('pt-BR')
export const pluralizar = (n: number, um: string, varios: string) =>
  `${n} ${plural.select(n) === 'one' ? um : varios}`

export const somenteDigitos = (v: string) => v.replace(/\D/g, '')

/** 12345678901 -> 123.456.789-01 (também formata enquanto digita) */
export function formatCpf(v: string) {
  const d = somenteDigitos(v).slice(0, 11)
  return d
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2')
}

/** 48999990001 -> (48) 99999-0001 */
export function formatTelefone(v: string) {
  const d = somenteDigitos(v).slice(0, 11)
  if (d.length <= 2) return d.length ? `(${d}` : ''
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  const meio = d.length === 11 ? 7 : 6
  return `(${d.slice(0, 2)}) ${d.slice(2, meio)}-${d.slice(meio)}`
}

/** 88010000 -> 88010-000 */
export function formatCep(v: string) {
  const d = somenteDigitos(v).slice(0, 8)
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d
}

/**
 * Lê uma nota digitada ("7,5", "10", "") e diz se é válida.
 * Vazio = apagar a nota.
 */
export function lerNota(texto: string): { ok: true; valor: number | null } | { ok: false } {
  const t = texto.trim().replace(',', '.')
  if (t === '') return { ok: true, valor: null }
  if (!/^\d{1,2}(\.\d{1,2})?$/.test(t)) return { ok: false }
  const n = Number(t)
  return n >= 0 && n <= 10 ? { ok: true, valor: n } : { ok: false }
}

/** Mesma regra da view vw_boletim */
export function calcularSituacao(notas: (number | null)[]) {
  const lancadas = notas.filter((n): n is number => n !== null)
  if (!lancadas.length) return { media: null, situacao: null }
  const media = Math.round((lancadas.reduce((s, n) => s + n, 0) / lancadas.length) * 100) / 100
  const situacao = lancadas.length < 3 ? 'EM ANDAMENTO' : media >= 7 ? 'APROVADO' : 'REPROVADO'
  return { media, situacao } as const
}
