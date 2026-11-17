import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Usuario } from '../api/types'

interface AuthState {
  usuario: Usuario | null
  token: string | null
  entrar: (u: Usuario, token: string) => void
  sair: () => void
}

// Sessão guardada só nesta aba (sessionStorage): fechou a aba, saiu.
export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      usuario: null,
      token: null,
      entrar: (usuario, token) => set({ usuario, token }),
      sair: () => set({ usuario: null, token: null }),
    }),
    { name: 'portal-sessao', storage: createJSONStorage(() => sessionStorage) },
  ),
)
