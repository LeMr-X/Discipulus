import { ArrowLeft, CalendarDays, KeyRound, Lock, Mail, MapPin, Pencil, Phone, Plus, ShieldCheck, ShieldOff, Trash2, UserRound } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { api } from '../../api'
import { mensagemDe } from '../../api/cliente'
import type { AlunoDetalhe as Detalhe, Curso, StatusMatricula } from '../../api/types'
import { useAuth } from '../../auth/store'
import { CabecalhoPagina } from '../../components/AppShell'
import { Boletim } from '../../components/Boletim'
import { MATRICULA } from '../../components/rotulos'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card, CardHeader } from '../../components/ui/Card'
import { Confirmar, Dialog, DialogRodape } from '../../components/ui/Dialog'
import { Select } from '../../components/ui/Select'
import { useCarregar } from '../../hooks/useCarregar'
import { formatCep, formatCpf, formatData, formatHora, formatTelefone, iniciais } from '../../lib/format'
import { pode } from '../../lib/permissoes'
import { AlunoForm } from './AlunoForm'

export function AlunoDetalhe() {
  const id = Number(useParams().id)
  const usuario = useAuth((s) => s.usuario)
  const podeEditar = pode(usuario, 'cadastros')
  const navigate = useNavigate()
  const aluno = useCarregar(() => api.alunos.buscar(id), [id])
  const painel = useCarregar(() => api.painelAluno(id), [id])
  const [editar, setEditar] = useState(false)
  const [excluir, setExcluir] = useState(false)
  const [matricular, setMatricular] = useState(false)

  const recarregar = () => {
    aluno.recarregar()
    painel.recarregar()
  }

  const voltar = (
    <Link to="/funcionario/alunos" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted transition-colors duration-150 [@media(hover:hover)]:hover:text-fg">
      <ArrowLeft className="size-4" />
      Alunos
    </Link>
  )

  if (aluno.erro) return <><CabecalhoPagina titulo="Aluno" voltar={voltar} /><Card className="p-6 text-sm text-danger">{aluno.erro}</Card></>
  if (!aluno.dados) return <div className="h-60 animate-pulse rounded-xl bg-surface-2" />

  const a = aluno.dados

  return (
    <>
      <CabecalhoPagina
        voltar={voltar}
        titulo={
          <span className="flex items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-soft text-base font-semibold text-brand">{iniciais(a.nome)}</span>
            <span className="min-w-0 [overflow-wrap:anywhere]">{a.nome}</span>
          </span>
        }
        descricao={<span className="tabular">RA {a.ra} · cadastrado em {formatData(a.dataCadastro)}</span>}
        acoes={
          podeEditar && (
            <>
              <Button variant="secondary" onClick={() => setEditar(true)}>
                <Pencil className="size-4" />
                Editar
              </Button>
              <Button variant="danger-ghost" onClick={() => setExcluir(true)}>
                <Trash2 className="size-4" />
                Excluir
              </Button>
            </>
          )
        }
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card className="rise-in [animation-delay:60ms]">
            <CardHeader
              title="Matrículas"
              action={
                podeEditar && (
                  <Button variant="secondary" size="sm" onClick={() => setMatricular(true)}>
                    <Plus className="size-4" />
                    Matricular
                  </Button>
                )
              }
            />
            {a.matriculas.length === 0 ? (
              <p className="px-6 pb-6 pt-3 text-sm text-muted">Este aluno ainda não está matriculado em nenhum curso.</p>
            ) : (
              <ul className="mt-3">
                {a.matriculas.map((m) => (
                  <li key={m.idMatricula} className="flex flex-col gap-3 border-t border-border px-5 py-3.5 sm:flex-row sm:items-center sm:px-6">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-fg">{m.curso}</p>
                      <p className="tabular text-[13px] text-muted">desde {formatData(m.dataMatricula + 'T12:00:00')}</p>
                    </div>
                    {podeEditar ? (
                      <StatusMatriculaSelect idAluno={a.idAluno} idMatricula={m.idMatricula} status={m.status} aoMudar={recarregar} />
                    ) : (
                      <Badge tone={MATRICULA[m.status].tom}>{MATRICULA[m.status].rotulo}</Badge>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="rise-in min-w-0 pb-1 [animation-delay:100ms]">
            <CardHeader title="Boletim" description="Média aprovada a partir de 7,0 com as três avaliações." />
            {painel.dados ? <Boletim linhas={painel.dados.boletim} /> : <div className="m-6 h-24 animate-pulse rounded-lg bg-surface-2" />}
          </Card>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <Card className="rise-in [animation-delay:140ms]">
            <CardHeader title="Dados pessoais" />
            <dl className="flex flex-col gap-3.5 px-5 pb-5 pt-4 text-sm sm:px-6">
              <Dado icone={<UserRound className="size-4" />} rotulo="CPF" valor={<span className="tabular">{formatCpf(a.cpf)}</span>} />
              <Dado icone={<Mail className="size-4" />} rotulo="E-mail" valor={<span className="[overflow-wrap:anywhere]">{a.email}</span>} />
              <Dado icone={<Phone className="size-4" />} rotulo="Telefone" valor={a.telefone ? <span className="tabular">{formatTelefone(a.telefone)}</span> : null} />
              <Dado icone={<CalendarDays className="size-4" />} rotulo="Nascimento" valor={a.dataNascimento ? formatData(a.dataNascimento + 'T12:00:00') : null} />
              <Dado
                icone={<MapPin className="size-4" />}
                rotulo="Endereço"
                valor={
                  a.logradouro || a.cidade
                    ? [[a.logradouro, a.numero].filter(Boolean).join(', '), a.bairro, [a.cidade, a.uf].filter(Boolean).join(' – '), a.cep && formatCep(a.cep)]
                        .filter(Boolean)
                        .join(' · ')
                    : null
                }
              />
            </dl>
          </Card>

          <Acesso aluno={a} podeEditar={podeEditar} aoMudar={recarregar} />
        </div>
      </div>

      <AlunoForm aberto={editar} aoMudar={setEditar} aluno={a} aoSalvar={recarregar} />
      <Matricular aberto={matricular} aoMudar={setMatricular} aluno={a} aoSalvar={recarregar} />
      <Confirmar
        aberto={excluir}
        aoMudar={setExcluir}
        titulo={`Excluir ${a.nome}?`}
        descricao="Isso apaga o aluno, as matrículas, as notas, o histórico e o acesso ao portal. Não dá para desfazer."
        rotuloConfirmar="Excluir aluno"
        aoConfirmar={async () => {
          await api.alunos.excluir(a.idAluno)
          toast.success('Aluno excluído.')
          navigate('/funcionario/alunos', { replace: true })
        }}
      />
    </>
  )
}

function Dado({ icone, rotulo, valor }: { icone: ReactNode; rotulo: string; valor: ReactNode | null }) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 shrink-0 text-subtle">{icone}</span>
      <div className="min-w-0">
        <dt className="text-xs text-muted">{rotulo}</dt>
        <dd className={valor ? 'text-fg' : 'text-subtle'}>{valor ?? 'Não informado'}</dd>
      </div>
    </div>
  )
}

function StatusMatriculaSelect({ idAluno, idMatricula, status, aoMudar }: { idAluno: number; idMatricula: number; status: StatusMatricula; aoMudar: () => void }) {
  const [salvando, setSalvando] = useState(false)
  return (
    <Select
      aria-label="Situação da matrícula"
      className="w-full sm:w-44"
      value={status}
      disabled={salvando}
      opcoes={(Object.keys(MATRICULA) as StatusMatricula[]).map((s) => ({ valor: s, rotulo: MATRICULA[s].rotulo }))}
      onChange={async (e) => {
        setSalvando(true)
        try {
          await api.alunos.alterarMatricula(idAluno, idMatricula, e.target.value as StatusMatricula)
          toast.success('Situação da matrícula atualizada.', { description: 'A mudança foi registrada no histórico.' })
          aoMudar()
        } catch (err) {
          toast.error(mensagemDe(err))
        } finally {
          setSalvando(false)
        }
      }}
    />
  )
}

function Acesso({ aluno, podeEditar, aoMudar }: { aluno: Detalhe; podeEditar: boolean; aoMudar: () => void }) {
  const [salvando, setSalvando] = useState(false)
  const acesso = aluno.acesso
  if (!acesso) return null
  const bloqueado = !!acesso.bloqueadoAte && new Date(acesso.bloqueadoAte) > new Date()

  async function definir(ativo: boolean, mensagem: string) {
    setSalvando(true)
    try {
      await api.alunos.definirAcesso(aluno.idAluno, ativo)
      toast.success(mensagem)
      aoMudar()
    } catch (e) {
      toast.error(mensagemDe(e))
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Card className="rise-in [animation-delay:180ms]">
      <CardHeader
        title="Acesso ao portal"
        action={
          !acesso.ativo ? <Badge tone="danger">Desativado</Badge> : bloqueado ? <Badge tone="warning">Bloqueado</Badge> : <Badge tone="success">Liberado</Badge>
        }
      />
      <dl className="flex flex-col gap-3.5 px-5 pt-4 text-sm sm:px-6">
        <Dado icone={<KeyRound className="size-4" />} rotulo="Login" valor={<span className="tabular">{acesso.login}</span>} />
        <Dado icone={<CalendarDays className="size-4" />} rotulo="Último acesso" valor={acesso.ultimoAcesso ? `${formatData(acesso.ultimoAcesso)} às ${formatHora(acesso.ultimoAcesso)}` : 'Nunca entrou'} />
        {bloqueado && <Dado icone={<Lock className="size-4" />} rotulo="Bloqueado por senha errada até" valor={formatHora(acesso.bloqueadoAte!)} />}
      </dl>
      {podeEditar && (
        <div className="flex flex-wrap gap-2 px-5 pb-5 pt-4 sm:px-6">
          {bloqueado && acesso.ativo && (
            <Button size="sm" variant="secondary" loading={salvando} onClick={() => definir(true, 'Acesso desbloqueado.')}>
              <ShieldCheck className="size-4" />
              Desbloquear agora
            </Button>
          )}
          {acesso.ativo ? (
            <Button size="sm" variant="danger-ghost" loading={salvando} onClick={() => definir(false, 'Acesso desativado.')}>
              <ShieldOff className="size-4" />
              Desativar acesso
            </Button>
          ) : (
            <Button size="sm" variant="secondary" loading={salvando} onClick={() => definir(true, 'Acesso reativado.')}>
              <ShieldCheck className="size-4" />
              Reativar acesso
            </Button>
          )}
        </div>
      )}
    </Card>
  )
}

function Matricular({ aberto, aoMudar, aluno, aoSalvar }: { aberto: boolean; aoMudar: (a: boolean) => void; aluno: Detalhe; aoSalvar: () => void }) {
  const [cursos, setCursos] = useState<Curso[]>([])
  const [idCurso, setIdCurso] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const jaMatriculado = new Set(aluno.matriculas.map((m) => m.idCurso))

  return (
    <Dialog
      aberto={aberto}
      aoMudar={(a) => {
        if (a) {
          setIdCurso('')
          setErro(null)
          api.cursos.listar().then(setCursos, () => setCursos([]))
        }
        aoMudar(a)
      }}
      largura="sm"
      titulo="Matricular em curso"
      descricao={aluno.nome}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault()
          setSalvando(true)
          setErro(null)
          try {
            await api.alunos.matricular(aluno.idAluno, Number(idCurso))
            toast.success('Matrícula realizada.')
            aoSalvar()
            aoMudar(false)
          } catch (err) {
            setErro(mensagemDe(err))
          } finally {
            setSalvando(false)
          }
        }}
      >
        <div className="px-6 pt-5">
          <Select
            label="Curso"
            vazio="Escolha um curso"
            value={idCurso}
            onChange={(e) => setIdCurso(e.target.value)}
            opcoes={cursos.map((c) => ({
              valor: c.idCurso,
              rotulo: c.status === 'INATIVO' ? `${c.nome} (inativo)` : jaMatriculado.has(c.idCurso) ? `${c.nome} (já matriculado)` : c.nome,
              desabilitado: c.status === 'INATIVO' || jaMatriculado.has(c.idCurso),
            }))}
          />
          {erro && <p className="mt-4 rounded-lg bg-danger-soft px-3.5 py-2.5 text-sm text-danger" role="alert">{erro}</p>}
        </div>
        <DialogRodape>
          <Button type="button" variant="secondary" onClick={() => aoMudar(false)}>Cancelar</Button>
          <Button type="submit" loading={salvando} disabled={!idCurso}>Matricular</Button>
        </DialogRodape>
      </form>
    </Dialog>
  )
}
