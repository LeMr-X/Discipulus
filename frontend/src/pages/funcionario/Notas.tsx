import { Check, ClipboardList, Lock } from 'lucide-react'
import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { api } from '../../api'
import { mensagemDe } from '../../api/cliente'
import type { Avaliacao, LinhaPlanilha } from '../../api/types'
import { CabecalhoPagina } from '../../components/AppShell'
import { Nota } from '../../components/Boletim'
import { MATRICULA, SITUACAO } from '../../components/rotulos'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { Select } from '../../components/ui/Select'
import { Spinner } from '../../components/ui/Spinner'
import { useCarregar } from '../../hooks/useCarregar'
import { cn } from '../../lib/cn'
import { calcularSituacao, formatNota, lerNota, pluralizar } from '../../lib/format'

const AVALIACOES: Avaliacao[] = ['A1', 'A2', 'A3']
const campoDe = (a: Avaliacao) => a.toLowerCase() as 'a1' | 'a2' | 'a3'

export function Notas() {
  const [params, setParams] = useSearchParams()
  const idCurso = Number(params.get('curso')) || null
  const idDisciplina = Number(params.get('disciplina')) || null

  const cursos = useCarregar(() => api.cursos.listar(), [])
  const disciplinas = useCarregar(() => (idCurso ? api.cursos.disciplinas(idCurso) : Promise.resolve([])), [idCurso])
  const planilha = useCarregar(() => (idDisciplina ? api.disciplinas.planilha(idDisciplina) : Promise.resolve(null)), [idDisciplina])

  // Atualiza a linha na hora (a média e a situação mudam junto)
  function atualizarLinha(idAluno: number, avaliacao: Avaliacao, nota: number | null) {
    planilha.setDados((p) => p && { ...p, alunos: p.alunos.map((l) => (l.idAluno === idAluno ? { ...l, [campoDe(avaliacao)]: nota } : l)) })
  }

  const ativos = planilha.dados?.alunos.filter((a) => a.statusMatricula === 'ATIVA').length ?? 0

  return (
    <>
      <CabecalhoPagina titulo="Lançamento de notas" descricao="Escolha a disciplina e digite as notas. Cada nota é salva quando você sai do campo." />

      <Card className="rise-in mb-6 grid gap-4 p-4 sm:grid-cols-2 sm:p-5 [animation-delay:60ms]">
        <Select
          label="Curso"
          vazio="Escolha o curso"
          value={idCurso ?? ''}
          onChange={(e) => setParams(e.target.value ? { curso: e.target.value } : {}, { replace: true })}
          opcoes={(cursos.dados ?? []).map((c) => ({ valor: c.idCurso, rotulo: c.status === 'INATIVO' ? `${c.nome} (inativo)` : c.nome }))}
        />
        <Select
          label="Disciplina"
          vazio={idCurso ? 'Escolha a disciplina' : 'Escolha o curso primeiro'}
          disabled={!idCurso}
          value={idDisciplina ?? ''}
          onChange={(e) => setParams(e.target.value ? { curso: String(idCurso), disciplina: e.target.value } : { curso: String(idCurso) }, { replace: true })}
          opcoes={(disciplinas.dados ?? []).map((d) => ({ valor: d.idDisciplina, rotulo: `${d.semestre}º sem. · ${d.nome}` }))}
        />
      </Card>

      {!idDisciplina ? (
        <Card className="rise-in flex flex-col items-center gap-2 px-6 py-16 text-center [animation-delay:100ms]">
          <ClipboardList className="size-6 text-subtle" />
          <p className="text-sm font-medium text-fg">Nenhuma disciplina escolhida</p>
          <p className="text-sm text-muted">Escolha o curso e a disciplina para ver a turma.</p>
        </Card>
      ) : planilha.erro ? (
        <Card className="p-6 text-sm text-danger">{planilha.erro}</Card>
      ) : !planilha.dados ? (
        <div className="h-64 animate-pulse rounded-xl bg-surface-2" />
      ) : (
        <Card className="rise-in min-w-0 [animation-delay:100ms]">
          <div className="flex flex-wrap items-baseline justify-between gap-2 px-5 pt-5 sm:px-6">
            <h2 className="text-[15px] font-semibold text-fg">{planilha.dados.disciplina.nome}</h2>
            <p className="tabular text-sm text-muted">{pluralizar(ativos, 'aluno ativo', 'alunos ativos')}</p>
          </div>
          {planilha.dados.alunos.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-muted">Nenhum aluno matriculado neste curso.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[620px] text-sm">
                <thead>
                  <tr className="border-y border-border bg-surface-2/60 text-left text-xs font-medium uppercase tracking-[0.05em] text-subtle">
                    <th className="sticky left-0 z-10 bg-surface-2 py-2.5 pl-6 pr-3 font-medium sm:static sm:bg-transparent">Aluno</th>
                    {AVALIACOES.map((a) => <th key={a} className="w-24 px-2 py-2.5 text-center font-medium">{a}</th>)}
                    <th className="w-20 px-3 py-2.5 text-right font-medium">Média</th>
                    <th className="w-36 py-2.5 pl-3 pr-6 font-medium">Situação</th>
                  </tr>
                </thead>
                <tbody>
                  {planilha.dados.alunos.map((l, linha) => (
                    <LinhaNotas key={l.idAluno} linha={linha} aluno={l} idDisciplina={idDisciplina} aoSalvar={atualizarLinha} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="border-t border-border px-6 py-3 text-xs text-muted">
            Use vírgula para decimais (ex.: 7,5). Apague o campo para remover a nota. <kbd className="rounded border border-border-strong px-1">Enter</kbd> vai para o próximo aluno.
          </p>
        </Card>
      )}
    </>
  )
}

function LinhaNotas({ linha, aluno, idDisciplina, aoSalvar }: { linha: number; aluno: LinhaPlanilha; idDisciplina: number; aoSalvar: (idAluno: number, av: Avaliacao, n: number | null) => void }) {
  const ativa = aluno.statusMatricula === 'ATIVA'
  const { media, situacao } = calcularSituacao([aluno.a1, aluno.a2, aluno.a3])

  return (
    <tr className={cn('border-b border-border last:border-0', !ativa && 'bg-surface-2/40')}>
      <td className="sticky left-0 z-10 bg-surface py-2.5 pl-6 pr-3 shadow-[1px_0_0_var(--border)] sm:static sm:shadow-none">
        <p className="font-medium text-fg">{aluno.nome}</p>
        <p className="tabular flex items-center gap-1.5 text-xs text-muted">
          RA {aluno.ra}
          {!ativa && (
            <span className="inline-flex items-center gap-1 text-warning">
              <Lock className="size-3" />
              Matrícula {MATRICULA[aluno.statusMatricula].rotulo.toLowerCase()}
            </span>
          )}
        </p>
      </td>
      {AVALIACOES.map((av, coluna) => (
        <td key={av} className="px-2 py-2.5">
          <CelulaNota
            linha={linha}
            coluna={coluna}
            valor={aluno[campoDe(av)]}
            desabilitada={!ativa}
            rotulo={`${av} de ${aluno.nome}`}
            aoSalvar={async (nota) => {
              await api.disciplinas.lancarNota(idDisciplina, aluno.idAluno, av, nota)
              aoSalvar(aluno.idAluno, av, nota)
            }}
          />
        </td>
      ))}
      <td className="px-3 py-2.5 text-right">
        <Nota valor={media} destaque />
      </td>
      <td className="py-2.5 pl-3 pr-6">{situacao ? <Badge tone={SITUACAO[situacao].tom}>{SITUACAO[situacao].rotulo}</Badge> : <span className="text-subtle">—</span>}</td>
    </tr>
  )
}

type Estado = 'ocioso' | 'salvando' | 'salvo' | 'erro'

function CelulaNota({ linha, coluna, valor, desabilitada, rotulo, aoSalvar }: { linha: number; coluna: number; valor: number | null; desabilitada: boolean; rotulo: string; aoSalvar: (n: number | null) => Promise<void> }) {
  const [texto, setTexto] = useState(valor === null ? '' : formatNota(valor))
  const [estado, setEstado] = useState<Estado>('ocioso')
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Valor salvo mudou por fora (recarregou a planilha)
  useEffect(() => {
    setTexto(valor === null ? '' : formatNota(valor))
  }, [valor])
  useEffect(() => () => clearTimeout(timer.current), [])

  async function salvar() {
    const lido = lerNota(texto)
    if (!lido.ok) {
      setEstado('erro')
      toast.error('Nota inválida', { description: 'Digite um número de 0 a 10, com até 2 casas decimais.' })
      return
    }
    if (lido.valor === valor) {
      setEstado('ocioso')
      setTexto(valor === null ? '' : formatNota(valor))
      return
    }
    setEstado('salvando')
    try {
      await aoSalvar(lido.valor)
      setEstado('salvo')
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setEstado('ocioso'), 1400)
    } catch (e) {
      setEstado('erro')
      setTexto(valor === null ? '' : formatNota(valor))
      toast.error(mensagemDe(e))
    }
  }

  function teclas(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      const destino = linha + (e.key === 'ArrowUp' ? -1 : 1)
      const proximo = document.querySelector<HTMLInputElement>(`[data-celula="${destino}-${coluna}"]`)
      if (proximo) proximo.focus()
      else e.currentTarget.blur()
    } else if (e.key === 'Escape') {
      setTexto(valor === null ? '' : formatNota(valor))
      setEstado('ocioso')
    }
  }

  const lido = lerNota(texto)
  const abaixoDaMedia = lido.ok && lido.valor !== null && lido.valor < 7

  return (
    <div className="relative mx-auto w-[72px]">
      <input
        data-celula={`${linha}-${coluna}`}
        aria-label={rotulo}
        aria-invalid={estado === 'erro' || undefined}
        inputMode="decimal"
        autoComplete="off"
        disabled={desabilitada}
        value={texto}
        placeholder="—"
        onChange={(e) => {
          setTexto(e.target.value.replace(/[^\d,.]/g, '').slice(0, 5))
          if (estado === 'erro') setEstado('ocioso')
        }}
        onFocus={(e) => e.currentTarget.select()}
        onBlur={salvar}
        onKeyDown={teclas}
        className={cn(
          'tabular h-9 w-full rounded-lg border bg-surface text-center text-[15px] text-fg outline-none transition-[border-color,box-shadow,background-color] duration-150',
          'placeholder:text-subtle focus-visible:border-brand focus-visible:shadow-[0_0_0_3px_var(--ring)] focus-visible:outline-none',
          'disabled:cursor-not-allowed disabled:bg-transparent disabled:text-muted',
          estado === 'erro' ? 'border-danger bg-danger-soft' : 'border-border-strong',
          abaixoDaMedia && 'text-danger',
        )}
      />
      <span className="pointer-events-none absolute -right-5 top-1/2 -translate-y-1/2" aria-live="polite">
        {estado === 'salvando' && <Spinner className="size-3.5 text-subtle" />}
        {estado === 'salvo' && <Check className="size-3.5 text-success animate-[rise-in_200ms_var(--ease-out)]" aria-label="Salvo" />}
      </span>
    </div>
  )
}
