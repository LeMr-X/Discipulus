import { ChevronDown } from 'lucide-react'
import { useId, type SelectHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string
  opcoes: { valor: string | number; rotulo: string; desabilitado?: boolean }[]
  vazio?: string
}

/** Select nativo (acessível e com o seletor do sistema no celular), no visual dos campos. */
export function Select({ label, opcoes, vazio, className, id, ...props }: Props) {
  const autoId = useId()
  const selectId = id ?? autoId
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-fg">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          className={cn(
            'h-11 w-full appearance-none rounded-lg border border-border-strong bg-surface pl-3.5 pr-10 text-base text-fg shadow-xs sm:text-[15px]',
            'transition-[border-color,box-shadow] duration-150 ease-out',
            'focus-visible:border-brand focus-visible:shadow-[0_0_0_4px_var(--ring)] focus-visible:outline-none',
            'disabled:opacity-60',
          )}
          {...props}
        >
          {vazio !== undefined && <option value="">{vazio}</option>}
          {opcoes.map((o) => (
            <option key={o.valor} value={o.valor} disabled={o.desabilitado}>
              {o.rotulo}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-subtle" aria-hidden />
      </div>
    </div>
  )
}
