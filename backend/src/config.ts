import 'dotenv/config'

function obrigatorio(nome: string): string {
  const valor = process.env[nome]
  if (!valor) throw new Error(`Variável de ambiente ${nome} não definida. Veja o arquivo .env.example.`)
  return valor
}

export function carregarConfig() {
  return {
    porta: Number(process.env.PORT ?? 3333),
    db: {
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 3306),
      user: process.env.DB_USER ?? 'root',
      password: process.env.DB_PASSWORD ?? '',
      database: process.env.DB_NAME ?? 'sistema_alunos',
    },
    jwt: {
      segredo: obrigatorio('JWT_SECRET'),
      expiraEm: process.env.JWT_EXPIRA_EM ?? '2h',
    },
  }
}

export type Config = ReturnType<typeof carregarConfig>
