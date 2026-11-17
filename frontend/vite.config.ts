import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Repassa as chamadas /api para o back-end
    proxy: { '/api': 'http://localhost:3333' },
  },
})
