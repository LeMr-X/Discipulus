import type { LinhaBoletim } from '../api/types'
import { cn } from '../lib/cn'
import { formatNota } from '../lib/format'
import { SITUACAO } from './rotulos'
import { Badge } from './ui/Badge'

export function Nota({ valor, destaque }: { valor: number | null; destaque?: boolean }) {
  return (
    <span className={cn('tabular', valor === null && 'text-subtle', valor !== null && valor < 7 && 'text-danger', destaque && 'font-semibold')}>
      {formatNota(valor)}
    </span>
  )
}

/** Boletim: tabela no computador, cartões no celular. */
export function Boletim({ linhas }: { linhas: LinhaBoletim[] }) {
  if (linhas.length === 0) return <p className="px-6 py-10 text-center text-sm text-muted">Nenhuma nota lançada ainda.</p>
  return (
    <>
      <div className="mt-4 hidden overflow-x-auto sm:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-y border-border bg-surface-2/60 text-left text-xs font-medium uppercase tracking-[0.05em] text-subtle">
              <th className="py-2.5 pl-6 pr-3 font-medium">Disciplina</th>
              <th className="px-3 py-2.5 text-right font-medium">A1</th>
              <th className="px-3 py-2.5 text-right font-medium">A2</th>
              <th className="px-3 py-2.5 text-right font-medium">A3</th>
              <th className="px-3 py-2.5 text-right font-medium">Média</th>
              <th className="py-2.5 pl-3 pr-6 font-medium">Situação</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => (
              <tr key={l.disciplina} className="border-b border-border last:border-0">
                <td className="py-3.5 pl-6 pr-3">
                  <p className="font-medium text-fg">{l.disciplina}</p>
                  <p className="text-xs text-muted">{l.semestre}º semestre</p>
                </td>
                <td className="px-3 py-3.5 text-right"><Nota valor={l.a1} /></td>
                <td className="px-3 py-3.5 text-right"><Nota valor={l.a2} /></td>
                <td className="px-3 py-3.5 text-right"><Nota valor={l.a3} /></td>
                <td className="px-3 py-3.5 text-right"><Nota valor={l.media} destaque /></td>
                <td className="py-3.5 pl-3 pr-6">
                  <Badge tone={SITUACAO[l.situacao].tom}>{SITUACAO[l.situacao].rotulo}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="mt-4 flex flex-col gap-3 px-4 pb-4 sm:hidden">
        {linhas.map((l) => (
          <li key={l.disciplina} className="rounded-lg border border-border bg-surface-2/50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-fg">{l.disciplina}</p>
                <p className="text-xs text-muted">{l.semestre}º semestre</p>
              </div>
              <Badge tone={SITUACAO[l.situacao].tom}>{SITUACAO[l.situacao].rotulo}</Badge>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2 text-center">
              {([['A1', l.a1], ['A2', l.a2], ['A3', l.a3], ['Média', l.media]] as const).map(([r, v]) => (
                <div key={r} className="rounded-lg bg-surface px-2 py-2">
                  <p className="text-[11px] text-muted">{r}</p>
                  <p className="text-[15px]"><Nota valor={v} destaque={r === 'Média'} /></p>
                </div>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}
