// npm run dev
// Sobe o back-end (porta 3333) e o front-end (porta 5173) juntos.
// Ctrl+C encerra os dois.

import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')

if (!existsSync(join(raiz, 'backend', 'node_modules')) || !existsSync(join(raiz, 'frontend', 'node_modules'))) {
  console.error('Rode primeiro: npm run instalar')
  process.exit(1)
}
if (!existsSync(join(raiz, 'backend', '.env'))) {
  console.error('Falta o arquivo backend/.env. Rode: npm run instalar')
  process.exit(1)
}

const cores = { api: '\x1b[35m', site: '\x1b[36m' }
const processos = []

function rodar(nome, pasta) {
  const p = spawn('npm run dev', { cwd: join(raiz, pasta), shell: true })
  const prefixo = `${cores[nome]}[${nome}]\x1b[0m `
  const repassar = (saida) => (dados) => {
    for (const linha of dados.toString().split(/\r?\n/)) if (linha.trim()) saida.write(prefixo + linha + '\n')
  }
  p.stdout.on('data', repassar(process.stdout))
  p.stderr.on('data', repassar(process.stderr))
  p.on('exit', (codigo) => {
    console.log(`${prefixo}encerrado (código ${codigo})`)
    encerrar()
  })
  processos.push(p)
}

let encerrando = false
function encerrar() {
  if (encerrando) return
  encerrando = true
  for (const p of processos) {
    // No Windows, o npm abre processos filhos: taskkill /T encerra a árvore toda
    if (process.platform === 'win32') spawn('taskkill', ['/pid', String(p.pid), '/T', '/F'])
    else p.kill('SIGTERM')
  }
  setTimeout(() => process.exit(0), 500)
}
process.on('SIGINT', encerrar)
process.on('SIGTERM', encerrar)

rodar('api', 'backend')
rodar('site', 'frontend')
console.log('Abrindo o site em http://localhost:5173 (Ctrl+C para parar)\n')
