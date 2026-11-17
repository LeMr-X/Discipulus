import { Dices } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { api } from '../../api'
import { mensagemDe } from '../../api/cliente'
import type { AlunoDetalhe, Curso, DadosAluno } from '../../api/types'
import { Button } from '../../components/ui/Button'
import { DialogRodape, Dialog } from '../../components/ui/Dialog'
import { Field } from '../../components/ui/Field'
import { Select } from '../../components/ui/Select'
import { formatCep, formatCpf, formatTelefone } from '../../lib/format'

type Campos = Record<keyof DadosAluno, string> & { idCurso: string; senhaInicial: string }

const vazio: Campos = {
  nome: '', cpf: '', email: '', telefone: '', dataNascimento: '', logradouro: '', numero: '',
  bairro: '', cidade: '', uf: '', cep: '', idCurso: '', senhaInicial: '',
}

function camposDe(a: AlunoDetalhe): Campos {
  return {
    ...vazio,
    nome: a.nome,
    cpf: formatCpf(a.cpf),
    email: a.email,
    telefone: a.telefone ? formatTelefone(a.telefone) : '',
    dataNascimento: a.dataNascimento ?? '',
    logradouro: a.logradouro ?? '',
    numero: a.numero ?? '',
    bairro: a.bairro ?? '',
    cidade: a.cidade ?? '',
    uf: a.uf ?? '',
    cep: a.cep ? formatCep(a.cep) : '',
  }
}

/** Senha provisória legível: sem 0/O, 1/l */
function gerarSenha() {
  const letras = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  const bytes = crypto.getRandomValues(new Uint8Array(10))
  return Array.from(bytes, (b) => letras[b % letras.length]).join('')
}

interface Props {
  aberto: boolean
  aoMudar: (aberto: boolean) => void
  /** Sem aluno = cadastro novo */
  aluno?: AlunoDetalhe
  aoSalvar: (idAluno: number) => void
}

export function AlunoForm({ aberto, aoMudar, aluno, aoSalvar }: Props) {
  const editando = !!aluno
  const [c, setC] = useState<Campos>(vazio)
  const [cursos, setCursos] = useState<Curso[]>([])
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (!aberto) return
    setC(aluno ? camposDe(aluno) : vazio)
    setErro(null)
    if (!aluno) api.cursos.listar().then(setCursos, () => setCursos([]))
  }, [aberto, aluno])

  const campo = (nome: keyof Campos, formatar?: (v: string) => string) => ({
    name: nome,
    value: c[nome],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setC((x) => ({ ...x, [nome]: formatar ? formatar(e.target.value) : e.target.value })),
  })

  async function salvar(e: FormEvent) {
    e.preventDefault()
    setSalvando(true)
    setErro(null)
    const dados: DadosAluno = {
      nome: c.nome,
      cpf: c.cpf,
      email: c.email,
      telefone: c.telefone || null,
      dataNascimento: c.dataNascimento || null,
      logradouro: c.logradouro || null,
      numero: c.numero || null,
      bairro: c.bairro || null,
      cidade: c.cidade || null,
      uf: c.uf || null,
      cep: c.cep || null,
    }
    try {
      if (editando) {
        await api.alunos.atualizar(aluno.idAluno, dados)
        toast.success('Dados do aluno atualizados.')
        aoSalvar(aluno.idAluno)
      } else {
        const r = await api.alunos.criar({ ...dados, idCurso: c.idCurso ? Number(c.idCurso) : null, senhaInicial: c.senhaInicial })
        toast.success(`Aluno cadastrado com o RA ${r.ra}.`, { description: 'O RA é o login do aluno no portal.' })
        aoSalvar(r.idAluno)
      }
      aoMudar(false)
    } catch (e) {
      setErro(mensagemDe(e))
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Dialog
      aberto={aberto}
      aoMudar={aoMudar}
      largura="lg"
      titulo={editando ? 'Editar aluno' : 'Novo aluno'}
      descricao={editando ? `RA ${aluno.ra}` : 'O RA é gerado automaticamente ao salvar.'}
    >
      <form onSubmit={salvar} noValidate>
        <div className="grid gap-4 px-6 pt-5 sm:grid-cols-6">
          <Field label="Nome completo" className="sm:col-span-6" required autoComplete="off" {...campo('nome')} />
          <Field label="CPF" className="sm:col-span-3" inputMode="numeric" placeholder="000.000.000-00" required {...campo('cpf', formatCpf)} />
          <Field label="Data de nascimento" className="sm:col-span-3" type="date" {...campo('dataNascimento')} />
          <Field label="E-mail" className="sm:col-span-4" type="email" required autoComplete="off" {...campo('email')} />
          <Field label="Telefone" className="sm:col-span-2" inputMode="tel" placeholder="(48) 99999-0000" {...campo('telefone', formatTelefone)} />

          <p className="mt-2 text-xs font-medium uppercase tracking-[0.06em] text-subtle sm:col-span-6">Endereço</p>
          <Field label="CEP" className="sm:col-span-2" inputMode="numeric" placeholder="00000-000" {...campo('cep', formatCep)} />
          <Field label="Logradouro" className="sm:col-span-4" {...campo('logradouro')} />
          <Field label="Número" className="sm:col-span-2" {...campo('numero')} />
          <Field label="Bairro" className="sm:col-span-4" {...campo('bairro')} />
          <Field label="Cidade" className="sm:col-span-4" {...campo('cidade')} />
          <Field label="UF" className="sm:col-span-2" maxLength={2} placeholder="SC" {...campo('uf', (v) => v.toUpperCase().replace(/[^A-Z]/g, ''))} />

          {!editando && (
            <>
              <p className="mt-2 text-xs font-medium uppercase tracking-[0.06em] text-subtle sm:col-span-6">Matrícula e acesso</p>
              <Select
                label="Curso"
                className="sm:col-span-3"
                vazio="Sem matrícula por enquanto"
                opcoes={cursos.filter((x) => x.status === 'ATIVO').map((x) => ({ valor: x.idCurso, rotulo: x.nome }))}
                {...campo('idCurso')}
              />
              <div className="flex items-end gap-2 sm:col-span-3">
                <Field label="Senha inicial" className="min-w-0 flex-1" hint="Mínimo de 8 caracteres." autoComplete="new-password" {...campo('senhaInicial')} />
                <Button type="button" variant="secondary" className="mb-[26px] h-11 shrink-0" onClick={() => setC((x) => ({ ...x, senhaInicial: gerarSenha() }))} aria-label="Gerar senha">
                  <Dices className="size-4" />
                </Button>
              </div>
            </>
          )}
        </div>

        {erro && (
          <p className="mx-6 mt-5 rounded-lg bg-danger-soft px-3.5 py-2.5 text-sm text-danger" role="alert">
            {erro}
          </p>
        )}

        <DialogRodape>
          <Button type="button" variant="secondary" onClick={() => aoMudar(false)}>
            Cancelar
          </Button>
          <Button type="submit" loading={salvando}>
            {editando ? 'Salvar alterações' : 'Cadastrar aluno'}
          </Button>
        </DialogRodape>
      </form>
    </Dialog>
  )
}
