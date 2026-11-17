import { BookMarked, ClipboardList, LogOut, Users, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/store'
import { cn } from '../lib/cn'
import { iniciais } from '../lib/format'
import { pode, type Permissao } from '../lib/permissoes'
import { Logo } from './Logo'
import { CARGO } from './rotulos'
import { Button } from './ui/Button'

const MENU_FUNCIONARIO: { para: string; rotulo: string; icone: LucideIcon; permissao: Permissao }[] = [
  { para: '/funcionario/alunos', rotulo: 'Alunos', icone: Users, permissao: 'consultar' },
  { para: '/funcionario/cursos', rotulo: 'Cursos', icone: BookMarked, permissao: 'consultar' },
  { para: '/funcionario/notas', rotulo: 'Notas', icone: ClipboardList, permissao: 'notas' },
]

export function AppShell({ children }: { children: ReactNode }) {
  const usuario = useAuth((s) => s.usuario)!
  const sair = useAuth((s) => s.sair)
  const navigate = useNavigate()
  const papel = usuario.perfil === 'ALUNO' ? `RA ${usuario.ra}` : usuario.cargo ? CARGO[usuario.cargo] : ''
  const menu = usuario.perfil === 'FUNCIONARIO' ? MENU_FUNCIONARIO.filter((m) => pode(usuario, m.permissao)) : []

  return (
    <div className="min-h-dvh">
      {/* Barra translúcida: o conteúdo rola por baixo */}
      <header className="sticky top-0 z-20 border-b border-border bg-surface">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-8">
            <Logo />
            {menu.length > 0 && (
              <nav className="hidden items-center gap-1 md:flex" aria-label="Menu principal">
                {menu.map((m) => (
                  <ItemMenu key={m.para} {...m} />
                ))}
              </nav>
            )}
          </div>
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="hidden min-w-0 text-right sm:block">
              <p className="truncate text-sm font-medium text-fg">{usuario.nome}</p>
              <p className="tabular truncate text-xs text-muted">{papel}</p>
            </div>
            <div className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-soft text-[13px] font-semibold text-brand">
              {iniciais(usuario.nome)}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                sair()
                navigate('/login', { replace: true })
              }}
              aria-label="Sair"
            >
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
        {/* Celular: menu em uma segunda linha */}
        {menu.length > 0 && (
          <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-3 pb-2 md:hidden" aria-label="Menu principal">
            {menu.map((m) => (
              <ItemMenu key={m.para} {...m} />
            ))}
          </nav>
        )}
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>
    </div>
  )
}

function ItemMenu({ para, rotulo, icone: Icone }: { para: string; rotulo: string; icone: LucideIcon }) {
  return (
    <NavLink
      to={para}
      className={({ isActive }) =>
        cn(
          'flex h-9 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-[background-color,color] duration-150',
          isActive ? 'bg-brand-soft text-brand' : 'text-muted [@media(hover:hover)]:hover:bg-surface-2 [@media(hover:hover)]:hover:text-fg',
        )
      }
    >
      <Icone className="size-4" />
      {rotulo}
    </NavLink>
  )
}

/** Título de página com ações à direita */
export function CabecalhoPagina({ titulo, descricao, acoes, voltar }: { titulo: ReactNode; descricao?: ReactNode; acoes?: ReactNode; voltar?: ReactNode }) {
  return (
    <div className="rise-in mb-6 sm:mb-8">
      {voltar}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-[26px] font-semibold leading-tight text-fg sm:text-[30px]">{titulo}</h1>
          {descricao && <div className="mt-1.5 text-[15px] text-muted">{descricao}</div>}
        </div>
        {acoes && <div className="flex shrink-0 flex-wrap gap-2">{acoes}</div>}
      </div>
    </div>
  )
}
