import { AlertCircle, ArrowRight, Lock, LockKeyhole, ShieldCheck, UserRound } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { api } from '../api'
import type { ResultadoLogin } from '../api/types'
import { useAuth } from '../auth/store'
import { Logo } from '../components/Logo'
import { Button } from '../components/ui/Button'
import { Field } from '../components/ui/Field'
import { cn } from '../lib/cn'
import { formatHora, pluralizar, primeiroNome } from '../lib/format'
import { VitrinePortal } from './login/VitrinePortal'

type Erros = { login?: string; senha?: string }

/** Mensagem para cada motivo de recusa (mesmos motivos do log_acesso). */
function mensagemErro(r: Extract<ResultadoLogin, { ok: false }>) {
  switch (r.motivo) {
    case 'USUARIO_INEXISTENTE':
      // Não revela se o login existe: mesma mensagem da senha errada
      return { titulo: 'RA/e-mail ou senha incorretos', detalhe: 'Confira os dados e tente de novo.' }
    case 'SENHA_INVALIDA':
      return {
        titulo: 'RA/e-mail ou senha incorretos',
        detalhe: `${pluralizar(r.tentativasRestantes ?? 0, 'tentativa restante', 'tentativas restantes')} antes do bloqueio temporário.`,
      }
    case 'USUARIO_BLOQUEADO':
      return {
        titulo: 'Acesso bloqueado temporariamente',
        detalhe: `Por segurança, após 3 tentativas erradas o acesso fica bloqueado. Tente de novo às ${formatHora(r.bloqueadoAte!)}.`,
      }
    case 'USUARIO_INATIVO':
      return { titulo: 'Seu acesso está desativado', detalhe: 'Procure a secretaria acadêmica para reativar.' }
  }
}

const CONTAS_TESTE = [
  { rotulo: 'Aluna', login: '2026000001' },
  { rotulo: 'Secretaria', login: 'roberto.lima@faculdade.edu.br' },
  { rotulo: 'Professora', login: 'juliana.prado@faculdade.edu.br' },
  { rotulo: 'Administração', login: 'carla.mendes@faculdade.edu.br' },
  { rotulo: 'Aluno inativo', login: '2026000006' },
]

export function Login() {
  const navigate = useNavigate()
  const entrar = useAuth((s) => s.entrar)
  const [login, setLogin] = useState('')
  const [senha, setSenha] = useState('')
  const [erros, setErros] = useState<Erros>({})
  const [falha, setFalha] = useState<ReturnType<typeof mensagemErro> | null>(null)
  const [tentativa, setTentativa] = useState(0) // reinicia a animação de "tremida"
  const [carregando, setCarregando] = useState(false)

  async function enviar(e: FormEvent) {
    e.preventDefault()
    const novos: Erros = {}
    if (!login.trim()) novos.login = 'Informe seu RA ou e-mail.'
    if (!senha) novos.senha = 'Informe sua senha.'
    setErros(novos)
    if (Object.keys(novos).length) return

    setCarregando(true)
    setFalha(null)
    try {
      const r = await api.login(login, senha)
      if (r.ok) {
        entrar(r.usuario, r.token)
        toast.success(`Bem-vindo(a), ${primeiroNome(r.usuario.nome)}!`)
        navigate(r.usuario.perfil === 'ALUNO' ? '/aluno' : '/funcionario', { replace: true }) // /funcionario escolhe a tela pelo cargo
      } else {
        setFalha(mensagemErro(r))
        setTentativa((t) => t + 1)
        setSenha('')
      }
    } catch {
      toast.error('Não foi possível conectar. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* Formulário */}
      <main className="flex flex-col px-6 py-8 sm:px-10">
        <Logo />

        <div className="mx-auto flex w-full max-w-[380px] flex-1 flex-col justify-center py-12">
          <div className="rise-in">
            <h1 className="text-[34px] font-semibold leading-tight text-fg sm:text-[40px]">
              Entrar
            </h1>
            <p className="mt-2 text-[15px] text-muted">
              Use seu RA (alunos) ou e-mail institucional (funcionários).
            </p>
          </div>

          <form
            onSubmit={enviar}
            noValidate
            className="rise-in mt-8 flex flex-col gap-5 [animation-delay:60ms]"
          >
            <Field
              label="RA ou e-mail institucional"
              icon={UserRound}
              name="login"
              autoComplete="username"
              placeholder="Ex.: 2026000001"
              value={login}
              onChange={(e) => {
                setLogin(e.target.value)
                if (erros.login) setErros((x) => ({ ...x, login: undefined }))
              }}
              error={erros.login}
              autoFocus
            />
            <Field
              label="Senha"
              icon={Lock}
              type="password"
              name="senha"
              autoComplete="current-password"
              placeholder="Sua senha"
              value={senha}
              onChange={(e) => {
                setSenha(e.target.value)
                if (erros.senha) setErros((x) => ({ ...x, senha: undefined }))
              }}
              error={erros.senha}
            />

            {falha && (
              <div
                key={tentativa}
                role="alert"
                className="animate-[shake_360ms_var(--ease-out)] flex gap-3 rounded-lg border border-danger/20 bg-danger-soft px-3.5 py-3 motion-reduce:animate-none"
              >
                {falha.titulo.startsWith('Acesso bloqueado') ? (
                  <LockKeyhole className="mt-0.5 size-4 shrink-0 text-danger" />
                ) : (
                  <AlertCircle className="mt-0.5 size-4 shrink-0 text-danger" />
                )}
                <div className="min-w-0 text-sm">
                  <p className="font-medium text-danger">{falha.titulo}</p>
                  <p className="mt-0.5 text-fg/80">{falha.detalhe}</p>
                </div>
              </div>
            )}

            <Button type="submit" size="lg" loading={carregando} className="mt-1 w-full">
              Entrar
              <ArrowRight className="size-4" />
            </Button>
          </form>

          <p className="rise-in mt-6 flex items-center gap-2 text-[13px] text-muted [animation-delay:120ms]">
            <ShieldCheck className="size-4 shrink-0 text-success" />
            Senhas protegidas com criptografia BCrypt.
          </p>

          {import.meta.env.DEV && (
            <div className="rise-in mt-10 rounded-lg border border-dashed border-border-strong p-3.5 [animation-delay:180ms]">
              <p className="text-xs font-medium uppercase tracking-[0.06em] text-subtle">
                Contas de teste (só em desenvolvimento)
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {CONTAS_TESTE.map((c) => (
                  <button
                    key={c.login}
                    type="button"
                    onClick={() => {
                      setLogin(c.login)
                      setSenha('Senha@123')
                      setErros({})
                      setFalha(null)
                    }}
                    className={cn(
                      'rounded-lg border border-border-strong bg-surface px-2.5 py-1 text-[13px] text-fg',
                      'transition-[transform,background-color] duration-150 ease-out active:scale-[0.97]',
                      '[@media(hover:hover)]:hover:bg-surface-2',
                    )}
                  >
                    {c.rotulo}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Vitrine (só em telas grandes) */}
      <VitrinePortal />
    </div>
  )
}
