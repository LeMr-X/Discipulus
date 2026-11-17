import { BookMarked, GraduationCap, Pencil, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { api } from '../../api'
import { mensagemDe } from '../../api/cliente'
import type { Categoria, Curso, DadosCurso, DadosDisciplina, Disciplina } from '../../api/types'
import { useAuth } from '../../auth/store'
import { CabecalhoPagina } from '../../components/AppShell'
import { CATEGORIA } from '../../components/rotulos'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card, CardHeader } from '../../components/ui/Card'
import { Confirmar, Dialog, DialogRodape } from '../../components/ui/Dialog'
import { Field } from '../../components/ui/Field'
import { Select } from '../../components/ui/Select'
import { useCarregar } from '../../hooks/useCarregar'
import { cn } from '../../lib/cn'
import { pluralizar } from '../../lib/format'
import { pode } from '../../lib/permissoes'

export function Cursos() {
  const usuario = useAuth((s) => s.usuario)
  const podeEditar = pode(usuario, 'cadastros')
  const [params, setParams] = useSearchParams()
  const cursos = useCarregar(() => api.cursos.listar(), [])
  const idSelecionado = Number(params.get('curso')) || cursos.dados?.[0]?.idCurso
  const curso = cursos.dados?.find((c) => c.idCurso === idSelecionado)
  const disciplinas = useCarregar(() => (idSelecionado ? api.cursos.disciplinas(idSelecionado) : Promise.resolve([])), [idSelecionado])

  const [formCurso, setFormCurso] = useState<{ aberto: boolean; curso?: Curso }>({ aberto: false })
  const [formDisc, setFormDisc] = useState<{ aberto: boolean; disciplina?: Disciplina }>({ aberto: false })
  const [excluirCurso, setExcluirCurso] = useState(false)
  const [excluirDisc, setExcluirDisc] = useState<Disciplina | null>(null)

  const selecionar = (id: number) => setParams({ curso: String(id) }, { replace: true })
  const tudo = () => {
    cursos.recarregar()
    disciplinas.recarregar()
  }

  return (
    <>
      <CabecalhoPagina
        titulo="Cursos e disciplinas"
        descricao="Grade de cada curso oferecido."
        acoes={
          podeEditar && (
            <Button onClick={() => setFormCurso({ aberto: true })}>
              <Plus className="size-4" />
              Novo curso
            </Button>
          )
        }
      />

      {cursos.erro && <Card className="p-6 text-sm text-danger">{cursos.erro}</Card>}

      <div className="grid items-start gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        {/* Lista de cursos */}
        <div className="rise-in flex flex-col gap-2 [animation-delay:60ms]" role="listbox" aria-label="Cursos">
          {!cursos.dados
            ? [0, 1, 2].map((i) => <div key={i} className="h-[92px] animate-pulse rounded-xl bg-surface-2" />)
            : cursos.dados.map((c) => {
                const ativo = c.idCurso === idSelecionado
                return (
                  <button
                    key={c.idCurso}
                    role="option"
                    aria-selected={ativo}
                    onClick={() => selecionar(c.idCurso)}
                    className={cn(
                      'rounded-xl border p-4 text-left transition-[background-color,border-color,box-shadow,transform] duration-150 ease-out active:scale-[0.99]',
                      ativo ? 'border-brand/40 bg-surface shadow-card ring-1 ring-brand/30' : 'border-border bg-surface/60 [@media(hover:hover)]:hover:bg-surface',
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="min-w-0 text-sm font-semibold text-fg">{c.nome}</p>
                      {c.status === 'INATIVO' && <Badge tone="neutral">Inativo</Badge>}
                    </div>
                    <p className="mt-1 text-[13px] text-muted">
                      {CATEGORIA[c.categoria]} · {pluralizar(c.duracaoSemestres, 'semestre', 'semestres')}
                    </p>
                    <p className="tabular mt-2 text-xs text-subtle">
                      {pluralizar(c.qtdDisciplinas, 'disciplina', 'disciplinas')} · {pluralizar(c.qtdMatriculas, 'matrícula', 'matrículas')}
                    </p>
                  </button>
                )
              })}
          {cursos.dados?.length === 0 && <Card className="p-6 text-center text-sm text-muted">Nenhum curso cadastrado.</Card>}
        </div>

        {/* Disciplinas do curso escolhido */}
        {curso && (
          <Card className="rise-in min-w-0 [animation-delay:100ms]">
            <CardHeader
              title={curso.nome}
              description={`${CATEGORIA[curso.categoria]} · ${pluralizar(curso.duracaoSemestres, 'semestre', 'semestres')}`}
              action={
                podeEditar && (
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setFormCurso({ aberto: true, curso })} aria-label="Editar curso">
                      <Pencil className="size-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-danger" onClick={() => setExcluirCurso(true)} aria-label="Excluir curso">
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                )
              }
            />

            <div className="mt-4 flex items-center justify-between gap-3 border-t border-border px-5 py-3 sm:px-6">
              <p className="text-sm font-medium text-fg">Disciplinas</p>
              {podeEditar && (
                <Button variant="secondary" size="sm" onClick={() => setFormDisc({ aberto: true })}>
                  <Plus className="size-4" />
                  Disciplina
                </Button>
              )}
            </div>

            {!disciplinas.dados ? (
              <div className="mx-6 mb-6 h-24 animate-pulse rounded-lg bg-surface-2" />
            ) : disciplinas.dados.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-6 pb-10 pt-6 text-center">
                <BookMarked className="size-6 text-subtle" />
                <p className="text-sm text-muted">Este curso ainda não tem disciplinas.</p>
              </div>
            ) : (
              <ul>
                {disciplinas.dados.map((d) => (
                  <li key={d.idDisciplina} className="group flex items-center gap-3 border-t border-border px-5 py-3 sm:px-6">
                    <span className="tabular grid size-8 shrink-0 place-items-center rounded-lg bg-surface-2 text-xs font-semibold text-muted" title={`${d.semestre}º semestre`}>
                      {d.semestre}º
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-fg">{d.nome}</p>
                      <p className="tabular text-[13px] text-muted">{d.cargaHoraria} h</p>
                    </div>
                    {podeEditar && (
                      <div className="flex shrink-0 gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setFormDisc({ aberto: true, disciplina: d })} aria-label={`Editar ${d.nome}`}>
                          <Pencil className="size-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-danger" onClick={() => setExcluirDisc(d)} aria-label={`Excluir ${d.nome}`}>
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}
      </div>

      <CursoForm
        {...formCurso}
        aoMudar={(aberto) => setFormCurso((f) => ({ ...f, aberto }))}
        aoSalvar={(id) => {
          cursos.recarregar()
          selecionar(id)
        }}
      />
      {curso && (
        <DisciplinaForm
          {...formDisc}
          curso={curso}
          aoMudar={(aberto) => setFormDisc((f) => ({ ...f, aberto }))}
          aoSalvar={tudo}
        />
      )}
      <Confirmar
        aberto={excluirCurso}
        aoMudar={setExcluirCurso}
        titulo={`Excluir ${curso?.nome}?`}
        descricao="O curso e as disciplinas dele serão apagados. Cursos com alunos matriculados não podem ser excluídos: marque-os como inativos."
        rotuloConfirmar="Excluir curso"
        aoConfirmar={async () => {
          await api.cursos.excluir(curso!.idCurso)
          toast.success('Curso excluído.')
          setParams({}, { replace: true })
          cursos.recarregar()
        }}
      />
      <Confirmar
        aberto={!!excluirDisc}
        aoMudar={(a) => !a && setExcluirDisc(null)}
        titulo={`Excluir ${excluirDisc?.nome}?`}
        descricao="Disciplinas com notas lançadas não podem ser excluídas."
        rotuloConfirmar="Excluir disciplina"
        aoConfirmar={async () => {
          await api.disciplinas.excluir(excluirDisc!.idDisciplina)
          toast.success('Disciplina excluída.')
          tudo()
        }}
      />
    </>
  )
}

const CATEGORIAS = Object.entries(CATEGORIA).map(([valor, rotulo]) => ({ valor, rotulo }))

function CursoForm({ aberto, aoMudar, curso, aoSalvar }: { aberto: boolean; aoMudar: (a: boolean) => void; curso?: Curso; aoSalvar: (id: number) => void }) {
  const [c, setC] = useState({ nome: '', categoria: 'BACHARELADO', duracaoSemestres: '8', status: 'ATIVO' })
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (!aberto) return
    setErro(null)
    setC(curso
      ? { nome: curso.nome, categoria: curso.categoria, duracaoSemestres: String(curso.duracaoSemestres), status: curso.status }
      : { nome: '', categoria: 'BACHARELADO', duracaoSemestres: '8', status: 'ATIVO' })
  }, [aberto, curso])

  async function salvar(e: FormEvent) {
    e.preventDefault()
    setSalvando(true)
    setErro(null)
    const dados: DadosCurso = { nome: c.nome, categoria: c.categoria as Categoria, duracaoSemestres: Number(c.duracaoSemestres), status: c.status as 'ATIVO' | 'INATIVO' }
    try {
      if (curso) {
        await api.cursos.atualizar(curso.idCurso, dados)
        toast.success('Curso atualizado.')
        aoSalvar(curso.idCurso)
      } else {
        const { idCurso } = await api.cursos.criar(dados)
        toast.success('Curso criado.')
        aoSalvar(idCurso)
      }
      aoMudar(false)
    } catch (err) {
      setErro(mensagemDe(err))
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Dialog aberto={aberto} aoMudar={aoMudar} largura="sm" titulo={curso ? 'Editar curso' : 'Novo curso'}>
      <form onSubmit={salvar} noValidate>
        <div className="grid gap-4 px-6 pt-5 sm:grid-cols-2">
          <Field label="Nome" className="sm:col-span-2" icon={GraduationCap} value={c.nome} onChange={(e) => setC({ ...c, nome: e.target.value })} />
          <Select label="Categoria" className="sm:col-span-2" opcoes={CATEGORIAS} value={c.categoria} onChange={(e) => setC({ ...c, categoria: e.target.value })} />
          <Field label="Duração (semestres)" type="number" min={1} max={12} inputMode="numeric" value={c.duracaoSemestres} onChange={(e) => setC({ ...c, duracaoSemestres: e.target.value })} />
          <Select
            label="Situação"
            opcoes={[{ valor: 'ATIVO', rotulo: 'Ativo' }, { valor: 'INATIVO', rotulo: 'Inativo' }]}
            value={c.status}
            onChange={(e) => setC({ ...c, status: e.target.value })}
          />
        </div>
        {erro && <p className="mx-6 mt-5 rounded-lg bg-danger-soft px-3.5 py-2.5 text-sm text-danger" role="alert">{erro}</p>}
        <DialogRodape>
          <Button type="button" variant="secondary" onClick={() => aoMudar(false)}>Cancelar</Button>
          <Button type="submit" loading={salvando}>{curso ? 'Salvar' : 'Criar curso'}</Button>
        </DialogRodape>
      </form>
    </Dialog>
  )
}

function DisciplinaForm({ aberto, aoMudar, curso, disciplina, aoSalvar }: { aberto: boolean; aoMudar: (a: boolean) => void; curso: Curso; disciplina?: Disciplina; aoSalvar: () => void }) {
  const [d, setD] = useState({ nome: '', cargaHoraria: '80', semestre: '1' })
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (!aberto) return
    setErro(null)
    setD(disciplina ? { nome: disciplina.nome, cargaHoraria: String(disciplina.cargaHoraria), semestre: String(disciplina.semestre) } : { nome: '', cargaHoraria: '80', semestre: '1' })
  }, [aberto, disciplina])

  async function salvar(e: FormEvent) {
    e.preventDefault()
    setSalvando(true)
    setErro(null)
    const dados: DadosDisciplina = { nome: d.nome, cargaHoraria: Number(d.cargaHoraria), semestre: Number(d.semestre) }
    try {
      if (disciplina) await api.disciplinas.atualizar(disciplina.idDisciplina, dados)
      else await api.cursos.criarDisciplina(curso.idCurso, dados)
      toast.success(disciplina ? 'Disciplina atualizada.' : 'Disciplina criada.')
      aoSalvar()
      aoMudar(false)
    } catch (err) {
      setErro(mensagemDe(err))
    } finally {
      setSalvando(false)
    }
  }

  const semestres = Array.from({ length: curso.duracaoSemestres }, (_, i) => ({ valor: i + 1, rotulo: `${i + 1}º semestre` }))

  return (
    <Dialog aberto={aberto} aoMudar={aoMudar} largura="sm" titulo={disciplina ? 'Editar disciplina' : 'Nova disciplina'} descricao={curso.nome}>
      <form onSubmit={salvar} noValidate>
        <div className="grid gap-4 px-6 pt-5 sm:grid-cols-2">
          <Field label="Nome" className="sm:col-span-2" value={d.nome} onChange={(e) => setD({ ...d, nome: e.target.value })} />
          <Field label="Carga horária (h)" type="number" min={1} inputMode="numeric" value={d.cargaHoraria} onChange={(e) => setD({ ...d, cargaHoraria: e.target.value })} />
          <Select label="Semestre" opcoes={semestres} value={d.semestre} onChange={(e) => setD({ ...d, semestre: e.target.value })} />
        </div>
        {erro && <p className="mx-6 mt-5 rounded-lg bg-danger-soft px-3.5 py-2.5 text-sm text-danger" role="alert">{erro}</p>}
        <DialogRodape>
          <Button type="button" variant="secondary" onClick={() => aoMudar(false)}>Cancelar</Button>
          <Button type="submit" loading={salvando}>{disciplina ? 'Salvar' : 'Criar disciplina'}</Button>
        </DialogRodape>
      </form>
    </Dialog>
  )
}
