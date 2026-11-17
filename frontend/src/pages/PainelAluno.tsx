import { BookOpenCheck, CalendarDays, CircleCheck, Clock3, Mail, MapPin, Phone, TrendingUp } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { api } from '../api'
import type { PainelAluno as Dados } from '../api/types'
import { useAuth } from '../auth/store'
import { AppShell } from '../components/AppShell'
import { Boletim } from '../components/Boletim'
import { MATRICULA } from '../components/rotulos'
import { Badge } from '../components/ui/Badge'
import { Card, CardHeader } from '../components/ui/Card'
import { cn } from '../lib/cn'
import { formatData, formatNota, formatTelefone, pluralizar, primeiroNome } from '../lib/format'

export function PainelAluno() {
  const usuario = useAuth((s) => s.usuario)!
  const [dados, setDados] = useState<Dados | null>(null)
  const [erro, setErro] = useState(false)

  useEffect(() => {
    api.painelAluno(usuario.idAluno!).then(setDados, () => setErro(true))
  }, [usuario.idAluno])

  return (
    <AppShell>
      <div className="rise-in">
        <p className="text-sm text-muted">Painel do aluno</p>
        <h1 className="mt-1 text-[26px] font-semibold leading-tight text-fg sm:text-[30px]">
          Olá, {primeiroNome(usuario.nome)}
        </h1>
      </div>

      {erro ? (
        <Card className="mt-8 p-6 text-sm text-muted">Não foi possível carregar seus dados. Recarregue a página.</Card>
      ) : !dados ? (
        <Esqueleto />
      ) : (
        <Conteudo dados={dados} />
      )}
    </AppShell>
  )
}

function Conteudo({ dados }: { dados: Dados }) {
  const { boletim, matricula, aluno, historico } = dados
  const fechadas = boletim.filter((l) => l.situacao !== 'EM ANDAMENTO')
  const mediaGeral = boletim.length ? boletim.reduce((s, l) => s + l.media, 0) / boletim.length : null
  const aprovadas = boletim.filter((l) => l.situacao === 'APROVADO').length
  const andamento = boletim.length - fechadas.length

  return (
    <>
      <div className="rise-in mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-muted [animation-delay:40ms]">
        {matricula ? (
          <>
            <span className="font-medium text-fg">{matricula.curso}</span>
            <Badge tone={MATRICULA[matricula.status].tom}>Matrícula {MATRICULA[matricula.status].rotulo.toLowerCase()}</Badge>
          </>
        ) : (
          <span>Nenhuma matrícula encontrada</span>
        )}
      </div>

      {/* Indicadores */}
      <section className="mt-6 grid grid-cols-3 gap-2.5 sm:mt-8 sm:gap-4">
        <Indicador
          atraso={80}
          icone={<TrendingUp className="size-4" />}
          rotulo="Média geral"
          valor={mediaGeral === null ? '—' : formatNota(Math.round(mediaGeral * 100) / 100)}
          detalhe={pluralizar(boletim.length, 'disciplina cursada', 'disciplinas cursadas')}
        />
        <Indicador
          atraso={120}
          icone={<CircleCheck className="size-4" />}
          rotulo="Aprovações"
          valor={`${aprovadas}`}
          detalhe={`de ${pluralizar(fechadas.length, 'disciplina concluída', 'disciplinas concluídas')}`}
        />
        <Indicador
          atraso={160}
          icone={<Clock3 className="size-4" />}
          rotulo="Cursando"
          valor={`${andamento}`}
          detalhe={andamento ? 'aguardando notas' : 'nenhuma pendente'}
        />
      </section>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Boletim */}
        <Card className="rise-in min-w-0 [animation-delay:200ms]">
          <CardHeader title="Boletim" description="Média aprovada a partir de 7,0 com as três avaliações." />
          <Boletim linhas={boletim} />
        </Card>

        <div className="flex min-w-0 flex-col gap-6">
          {/* Dados pessoais */}
          <Card className="rise-in [animation-delay:240ms]">
            <CardHeader title="Meus dados" />
            <dl className="flex flex-col gap-3.5 px-5 pb-5 pt-4 text-sm sm:px-6">
              <Dado icone={<BookOpenCheck className="size-4" />} rotulo="RA" valor={<span className="tabular">{aluno.ra}</span>} />
              <Dado icone={<Mail className="size-4" />} rotulo="E-mail" valor={<span className="[overflow-wrap:anywhere]">{aluno.email}</span>} />
              {aluno.telefone && <Dado icone={<Phone className="size-4" />} rotulo="Telefone" valor={<span className="tabular">{formatTelefone(aluno.telefone)}</span>} />}
              {aluno.cidade && <Dado icone={<MapPin className="size-4" />} rotulo="Cidade" valor={`${aluno.cidade}${aluno.uf ? ` – ${aluno.uf}` : ''}`} />}
            </dl>
          </Card>

          {/* Histórico */}
          <Card className="rise-in [animation-delay:280ms]">
            <CardHeader title="Histórico acadêmico" />
            <ol className="px-5 pb-5 pt-4 sm:px-6">
              {historico.map((h, i) => (
                <li key={i} className="relative flex gap-3 pb-4 last:pb-0">
                  {i < historico.length - 1 && <span className="absolute left-[7px] top-5 h-full w-px bg-border-strong" aria-hidden />}
                  <span className="relative mt-1 size-[15px] shrink-0 rounded-full border-[3px] border-surface bg-brand ring-1 ring-brand/30" aria-hidden />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-fg">{h.observacao}</p>
                    <p className="mt-0.5 text-[13px] text-muted">{h.curso}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-[13px] text-subtle">
                      <CalendarDays className="size-3.5 shrink-0" />
                      <span className="tabular">{formatData(h.data)}</span>
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </>
  )
}

function Indicador({ icone, rotulo, valor, detalhe, atraso }: { icone: ReactNode; rotulo: string; valor: string; detalhe: string; atraso: number }) {
  return (
    <Card className="rise-in min-w-0 p-4 sm:p-5" style={{ animationDelay: `${atraso}ms` }}>
      <div className="flex items-center gap-2 text-xs text-muted sm:text-sm">
        <span className="hidden size-7 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand sm:grid">{icone}</span>
        <span className="truncate">{rotulo}</span>
      </div>
      <p className="tabular mt-2 text-[24px] font-semibold leading-none tracking-[-0.02em] text-fg sm:mt-3 sm:text-[30px]">{valor}</p>
      <p className="mt-1.5 hidden text-[13px] text-muted sm:block">{detalhe}</p>
    </Card>
  )
}

function Dado({ icone, rotulo, valor }: { icone: ReactNode; rotulo: string; valor: ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 shrink-0 text-subtle">{icone}</span>
      <div className="min-w-0">
        <dt className="text-xs text-muted">{rotulo}</dt>
        <dd className="text-fg">{valor}</dd>
      </div>
    </div>
  )
}

function Esqueleto() {
  const bloco = 'animate-pulse rounded-xl bg-surface-2'
  return (
    <div className="mt-8" aria-busy aria-label="Carregando">
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        {[0, 1, 2].map((i) => <div key={i} className={cn(bloco, 'h-[84px] sm:h-[124px]')} />)}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className={cn(bloco, 'h-72')} />
        <div className={cn(bloco, 'h-72')} />
      </div>
    </div>
  )
}
