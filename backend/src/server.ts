import { criarAlunosRepository } from './alunos/alunosRepository.js'
import { criarPainelRepository } from './alunos/painelRepository.js'
import { criarPainelService } from './alunos/painelService.js'
import { criarApp } from './app.js'
import { criarAuthRepository } from './auth/authRepository.js'
import { criarAuthService } from './auth/authService.js'
import { criarTokens } from './auth/token.js'
import { carregarConfig } from './config.js'
import { criarCursosRepository } from './cursos/cursosRepository.js'
import { criarPool } from './db.js'
import { criarNotasRepository } from './notas/notasRepository.js'

const config = carregarConfig()
const pool = criarPool(config.db)
const tokens = criarTokens(config.jwt.segredo, config.jwt.expiraEm)

const app = criarApp({
  auth: criarAuthService(criarAuthRepository(pool), tokens),
  painel: criarPainelService(criarPainelRepository(pool)),
  tokens,
  alunos: criarAlunosRepository(pool),
  cursos: criarCursosRepository(pool),
  notas: criarNotasRepository(pool),
  bancoOk: async () => {
    try {
      await pool.query('SELECT 1')
      return true
    } catch {
      return false
    }
  },
})

app.listen(config.porta, () => {
  console.log(`API rodando em http://localhost:${config.porta}`)
})
