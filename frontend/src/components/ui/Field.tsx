import { Eye, EyeOff, type LucideIcon } from 'lucide-react'
import { useId, useState, type InputHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  icon?: LucideIcon
  error?: string
  hint?: string
}

export function Field({ label, icon: Icon, error, hint, type, className, id, ...props }: Props) {
  const autoId = useId()
  const inputId = id ?? autoId
  const msgId = `${inputId}-msg`
  const isPassword = type === 'password'
  const [visivel, setVisivel] = useState(false)

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={inputId} className="text-sm font-medium text-fg">
        {label}
      </label>
      <div
        className={cn(
          'group flex h-11 items-center gap-2.5 rounded-lg border bg-surface px-3.5 shadow-xs',
          'transition-[border-color,box-shadow] duration-150 ease-out',
          'focus-within:border-brand focus-within:shadow-[0_0_0_4px_var(--ring)]',
          error ? 'border-danger' : 'border-border-strong',
        )}
      >
        {Icon && (
          <Icon
            className="size-4 shrink-0 text-subtle transition-colors duration-150 group-focus-within:text-brand"
            aria-hidden
          />
        )}
        <input
          id={inputId}
          type={isPassword && visivel ? 'text' : type}
          aria-invalid={!!error || undefined}
          aria-describedby={error || hint ? msgId : undefined}
          // 16px evita o zoom automático do iOS ao focar
          className="h-full min-w-0 flex-1 bg-transparent text-base text-fg outline-none focus-visible:outline-none placeholder:text-subtle sm:text-[15px]"
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisivel((v) => !v)}
            className="-mr-1.5 grid size-8 shrink-0 place-items-center rounded-lg text-subtle transition-[color,transform] duration-150 active:scale-[0.94] [@media(hover:hover)]:hover:text-fg"
            aria-label={visivel ? 'Ocultar senha' : 'Mostrar senha'}
          >
            {visivel ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>
      {(error || hint) && (
        <p id={msgId} className={cn('text-[13px]', error ? 'text-danger' : 'text-muted')}>
          {error ?? hint}
        </p>
      )}
    </div>
  )
}
