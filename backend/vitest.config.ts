import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    // Os testes de integração usam o mesmo banco: um arquivo por vez
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      // server.ts só liga as peças e sobe o servidor
      exclude: ['src/server.ts', 'src/tipos.ts'],
      reporter: ['text', 'html', 'lcov'], // lcov é o formato que o SonarCloud lê
      // Meta da A3: pelo menos 75% de cobertura. Só é exigida com o MySQL ligado
      // (DB_TESTE=1, como no CI), porque sem banco os repositórios SQL não rodam.
      thresholds: process.env.DB_TESTE === '1' ? { lines: 75, statements: 75, functions: 75, branches: 75 } : undefined,
    },
  },
})
