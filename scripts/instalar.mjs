// npm run instalar
// Instala as dependências do back-end e do front-end e cria o backend/.env.

import { execSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')

for (const pasta of ['backend', 'frontend']) {
  console.log(`\n> Instalando dependências de ${pasta}/ ...`)
  execSync('npm install', { cwd: join(raiz, pasta), stdio: 'inherit' })
}

const env = join(raiz, 'backend', '.env')
if (existsSync(env)) {
  console.log('\n> backend/.env já existe, mantive o seu.')
} else {
  copyFileSync(join(raiz, 'backend', '.env.example'), env)
  // Chave aleatória para os tokens de login
  const conteudo = readFileSync(env, 'utf8').replace(/^JWT_SECRET=.*$/m, `JWT_SECRET=${randomBytes(32).toString('hex')}`)
  writeFileSync(env, conteudo)
  console.log('\n> Criei o backend/.env.')
}

console.log(`
Pronto! Próximos passos:
  1. Abra backend/.env e coloque a senha do seu MySQL em DB_PASSWORD
  2. npm run banco   (cria o banco com os dados de exemplo)
  3. npm run dev     (abre o site em http://localhost:5173)
`)
