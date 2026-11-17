import { ChevronRight, Plus, Search, UserRoundX } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../api'
import { useAuth } from '../../auth/store'
import { CabecalhoPagina } from '../../components/AppShell'
import { MATRICULA } from '../../components/rotulos'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { useAtrasado } from '../../hooks/useAtrasado'
import { useCarregar } from '../../hooks/useCarregar'
import { formatCpf, iniciais, pluralizar } from '../../lib/format'
import { pode } from '../../lib/permissoes'
import { AlunoForm } from './AlunoForm'

export function Alunos() {
  const usuario = useAuth((s) => s.usuario)
  const navigate = useNavigate()
  const [busca, setBusca] = useState('')
  const buscaAdiada = useAtrasado(busca.trim())
  const [novo, setNovo] = useState(false)
  const { dados: alunos, erro, carregando } = useCarregar(() => api.alunos.listar(buscaAdiada), [buscaAdiada])

  return (
    <>
      <CabecalhoPagina
        titulo="Alunos"
        descricao={alunos ? pluralizar(alunos.length, 'aluno encontrado', 'alunos encontrados') : 'Carregando…'}
        acoes={
          pode(usuario, 'cadastros') && (
            <Button onClick={() => setNovo(true)}>
              <Plus className="size-4" />
              Novo aluno
            </Button>
          )
        }
      />

      <Card className="rise-in min-w-0 [animation-delay:60ms]">
        <div className="border-b border-border p-3 sm:p-4">
          <label className="flex h-10 items-center gap-2.5 rounded-lg bg-surface-2 px-3.5 transition-shadow duration-150 focus-within:shadow-[0_0_0_4px_var(--ring)]">
            <Search className="size-4 shrink-0 text-subtle" aria-hidden />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, RA, CPF ou e-mail"
              aria-label="Buscar alunos"
              className="h-full min-w-0 flex-1 bg-transparent text-base text-fg outline-none placeholder:text-subtle focus-visible:outline-none sm:text-sm"
            />
          </label>
        </div>

        {erro ? (
          <p className="p-8 text-center text-sm text-danger">{erro}</p>
        ) : !alunos ? (
          <div className="flex flex-col gap-2 p-4">
            {[0, 1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse rounded-lg bg-surface-2" />)}
          </div>
        ) : alunos.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
            <UserRoundX className="size-6 text-subtle" />
            <p className="text-sm font-medium text-fg">Nenhum aluno encontrado</p>
            <p className="text-sm text-muted">{busca ? 'Tente buscar de outro jeito.' : 'Cadastre o primeiro aluno.'}</p>
          </div>
        ) : (
          <ul className={carregando ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
            {alunos.map((a) => (
              <li key={a.idAluno} className="border-b border-border last:border-0">
                <Link
                  to={`/funcionario/alunos/${a.idAluno}`}
                  className="flex items-center gap-3 px-4 py-3 transition-colors duration-150 sm:gap-4 sm:px-5 [@media(hover:hover)]:hover:bg-surface-2/60"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-soft text-[13px] font-semibold text-brand">
                    {iniciais(a.nome)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-fg">{a.nome}</p>
                    <p className="truncate text-[13px] text-muted">{a.email}</p>
                  </div>
                  <div className="hidden w-40 shrink-0 md:block">
                    <p className="tabular text-sm text-fg">{a.ra}</p>
                    <p className="tabular text-[13px] text-muted">{formatCpf(a.cpf)}</p>
                  </div>
                  <div className="hidden w-56 min-w-0 shrink-0 lg:block">
                    <p className="truncate text-sm text-fg">{a.curso ?? '—'}</p>
                  </div>
                  <div className="flex shrink-0 justify-end sm:w-32">
                    {a.statusMatricula ? (
                      <Badge tone={MATRICULA[a.statusMatricula].tom}>{MATRICULA[a.statusMatricula].rotulo}</Badge>
                    ) : (
                      <Badge tone="neutral">Sem matrícula</Badge>
                    )}
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-subtle" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <AlunoForm aberto={novo} aoMudar={setNovo} aoSalvar={(id) => navigate(`/funcionario/alunos/${id}`)} />
    </>
  )
}
