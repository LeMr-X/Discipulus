// Cria (ou recria do zero) o banco sistema_alunos rodando os scripts de
// database/ na ordem. Usa os dados de conexão do arquivo .env.
//
//   npm run banco
//
// ATENÇÃO: apaga o banco sistema_alunos existente e cria de novo com os dados de exemplo.

import 'dotenv/config'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import mysql from 'mysql2/promise'

const PASTA_DATABASE = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'database')
const SCRIPTS = ['01_schema.sql', '02_regras.sql', '03_dados.sql']

/**
 * Divide um script SQL em comandos, respeitando "DELIMITER $$"
 * (usado nas triggers e procedures). Ignora comentários de linha.
 */
export function dividirComandos(sql: string): string[] {
  const comandos: string[] = []
  let delimitador = ';'
  let atual = ''

  for (const linha of sql.split(/\r?\n/)) {
    const limpa = linha.trim()
    const mudanca = /^DELIMITER\s+(\S+)/i.exec(limpa)
    if (mudanca) {
      delimitador = mudanca[1]
      continue
    }
    if (atual === '' && (limpa === '' || limpa.startsWith('--'))) continue

    atual += linha + '\n'
    // Comentário no fim da linha ("...);   -- texto") não conta para achar o fim do comando
    const semComentario = limpa.replace(/\s+--\s.*$/, '').trimEnd()
    if (semComentario.endsWith(delimitador)) {
      atual = atual.replace(/\s+--\s[^\n]*\n$/, '\n')
      const comando = atual.trimEnd().slice(0, -delimitador.length).trim()
      if (comando) comandos.push(comando)
      atual = ''
    }
  }
  if (atual.trim()) comandos.push(atual.trim())
  return comandos
}

async function main() {
  const conexao = await mysql.createConnection({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
    charset: 'utf8mb4',
  })

  try {
    for (const arquivo of SCRIPTS) {
      const comandos = dividirComandos(readFileSync(join(PASTA_DATABASE, arquivo), 'utf8'))
      process.stdout.write(`${arquivo} ... `)
      for (const c of comandos) await conexao.query(c)
      console.log(`ok (${comandos.length} comandos)`)
    }
    console.log('\nBanco sistema_alunos criado com os dados de exemplo.')
  } finally {
    await conexao.end()
  }
}

// Só executa quando chamado direto (os testes importam dividirComandos)
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((e) => {
    if (e?.code === 'ER_ACCESS_DENIED_ERROR') console.error('\nUsuário ou senha do MySQL incorretos. Confira DB_USER e DB_PASSWORD no backend/.env.')
    else if (e?.code === 'ECONNREFUSED') console.error('\nNão foi possível conectar ao MySQL. Ele está instalado e rodando? Confira DB_HOST e DB_PORT no backend/.env.')
    else console.error('\nErro ao criar o banco:', e?.message ?? e)
    process.exit(1)
  })
}
