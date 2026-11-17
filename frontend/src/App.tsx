import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import type { Perfil, Usuario } from './api/types'
import { useAuth } from './auth/store'
import { AppShell } from './components/AppShell'
import { pode } from './lib/permissoes'
import { Login } from './pages/Login'
import { PainelAluno } from './pages/PainelAluno'
import { AlunoDetalhe } from './pages/funcionario/AlunoDetalhe'
import { Alunos } from './pages/funcionario/Alunos'
import { Cursos } from './pages/funcionario/Cursos'
import { Notas } from './pages/funcionario/Notas'

function inicio(usuario: Usuario | null) {
  if (!usuario) return '/login'
  if (usuario.perfil === 'ALUNO') return '/aluno'
  // Professor começa nas notas; os demais, nos alunos
  return pode(usuario, 'cadastros') ? '/funcionario/alunos' : '/funcionario/notas'
}

/** Só deixa entrar quem está logado com o perfil certo. */
function Protegida({ perfil, children }: { perfil: Perfil; children: ReactNode }) {
  const usuario = useAuth((s) => s.usuario)
  if (!usuario) return <Navigate to="/login" replace />
  if (usuario.perfil !== perfil) return <Navigate to={inicio(usuario)} replace />
  return children
}

export default function App() {
  const usuario = useAuth((s) => s.usuario)
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={usuario ? <Navigate to={inicio(usuario)} replace /> : <Login />} />
        <Route path="/aluno" element={<Protegida perfil="ALUNO"><PainelAluno /></Protegida>} />
        <Route
          path="/funcionario"
          element={
            <Protegida perfil="FUNCIONARIO">
              <AppShell>
                <Outlet />
              </AppShell>
            </Protegida>
          }
        >
          <Route index element={<Navigate to={inicio(usuario)} replace />} />
          <Route path="alunos" element={<Alunos />} />
          <Route path="alunos/:id" element={<AlunoDetalhe />} />
          <Route path="cursos" element={<Cursos />} />
          <Route path="notas" element={<Notas />} />
        </Route>
        <Route path="*" element={<Navigate to={inicio(usuario)} replace />} />
      </Routes>
      <Toaster position="bottom-right" richColors closeButton={false} />
    </BrowserRouter>
  )
}
