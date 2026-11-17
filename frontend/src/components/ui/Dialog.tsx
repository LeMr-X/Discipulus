import { AlertDialog } from '@base-ui-components/react/alert-dialog'
import { Dialog as BaseDialog } from '@base-ui-components/react/dialog'
import { X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { Button } from './Button'

// Fundo escurece e a janela surge do centro (modais ficam centralizados,
// sem transform-origin no gatilho). Saída mais rápida que a entrada.
const fundo = cn(
  'fixed inset-0 z-40 bg-[rgb(8_10_20/0.45)] backdrop-blur-[2px]',
  'transition-opacity duration-200 ease-out data-[ending-style]:duration-150',
  'data-[starting-style]:opacity-0 data-[ending-style]:opacity-0',
)
const janela = cn(
  'fixed left-1/2 top-1/2 z-50 w-[calc(100vw-24px)] -translate-x-1/2 -translate-y-1/2',
  'max-h-[calc(100dvh-24px)] overflow-y-auto rounded-xl border border-border bg-surface shadow-[0_24px_64px_-12px_rgb(0_0_0/0.35)]',
  'transition-[opacity,transform] duration-200 ease-[var(--ease-out)] data-[ending-style]:duration-150',
  'data-[starting-style]:scale-[0.96] data-[starting-style]:opacity-0',
  'data-[ending-style]:scale-[0.98] data-[ending-style]:opacity-0',
  'motion-reduce:data-[starting-style]:scale-100 motion-reduce:data-[ending-style]:scale-100',
)

interface DialogProps {
  aberto: boolean
  aoMudar: (aberto: boolean) => void
  titulo: string
  descricao?: string
  largura?: 'sm' | 'md' | 'lg'
  children: ReactNode
}

export function Dialog({ aberto, aoMudar, titulo, descricao, largura = 'md', children }: DialogProps) {
  return (
    <BaseDialog.Root open={aberto} onOpenChange={aoMudar}>
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className={fundo} />
        <BaseDialog.Popup className={cn(janela, { sm: 'max-w-[420px]', md: 'max-w-[560px]', lg: 'max-w-[720px]' }[largura])}>
          <div className="flex items-start justify-between gap-4 px-6 pt-6">
            <div className="min-w-0">
              <BaseDialog.Title className="text-[17px] font-semibold tracking-[-0.01em] text-fg">{titulo}</BaseDialog.Title>
              {descricao && <BaseDialog.Description className="mt-1 text-sm text-muted">{descricao}</BaseDialog.Description>}
            </div>
            <BaseDialog.Close
              className="-mr-2 -mt-1 grid size-8 shrink-0 place-items-center rounded-lg text-subtle transition-[color,background-color,transform] duration-150 active:scale-[0.94] [@media(hover:hover)]:hover:bg-surface-2 [@media(hover:hover)]:hover:text-fg"
              aria-label="Fechar"
            >
              <X className="size-4" />
            </BaseDialog.Close>
          </div>
          {children}
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  )
}

/** Rodapé padrão dos formulários em diálogo */
export function DialogRodape({ children }: { children: ReactNode }) {
  return <div className="mt-6 flex flex-col-reverse gap-2 border-t border-border bg-surface-2/50 px-6 py-4 sm:flex-row sm:justify-end">{children}</div>
}

interface ConfirmarProps {
  aberto: boolean
  aoMudar: (aberto: boolean) => void
  titulo: string
  descricao: ReactNode
  rotuloConfirmar: string
  /** Pode lançar erro: a janela continua aberta e o erro aparece nela */
  aoConfirmar: () => Promise<void>
}

/** Confirmação para ações destrutivas (excluir). */
export function Confirmar({ aberto, aoMudar, titulo, descricao, rotuloConfirmar, aoConfirmar }: ConfirmarProps) {
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function confirmar() {
    setCarregando(true)
    setErro(null)
    try {
      await aoConfirmar()
      aoMudar(false)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Algo deu errado.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <AlertDialog.Root
      open={aberto}
      onOpenChange={(a) => {
        if (!a) setErro(null)
        aoMudar(a)
      }}
    >
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className={fundo} />
        <AlertDialog.Popup className={cn(janela, 'max-w-[420px]')}>
          <div className="px-6 pt-6">
            <AlertDialog.Title className="text-[17px] font-semibold tracking-[-0.01em] text-fg">{titulo}</AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm leading-relaxed text-muted">{descricao}</AlertDialog.Description>
            {erro && <p className="mt-4 rounded-lg bg-danger-soft px-3.5 py-2.5 text-sm text-danger" role="alert">{erro}</p>}
          </div>
          <DialogRodape>
            <AlertDialog.Close render={<Button variant="secondary" />}>Cancelar</AlertDialog.Close>
            <Button variant="danger" loading={carregando} onClick={confirmar}>
              {rotuloConfirmar}
            </Button>
          </DialogRodape>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
