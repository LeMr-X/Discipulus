import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'
import { Spinner } from './Spinner'

const button = cva(
  [
    'relative inline-flex items-center justify-center gap-2 rounded-lg font-medium select-none',
    'transition-[transform,background-color,box-shadow,color,filter] duration-150 ease-out',
    'active:scale-[0.97] disabled:pointer-events-none disabled:opacity-60',
  ],
  {
    variants: {
      variant: {
        primary:
          'bg-brand text-brand-fg shadow-xs [@media(hover:hover)]:hover:bg-brand-hover',
        secondary:
          'bg-surface text-fg border border-border-strong shadow-xs [@media(hover:hover)]:hover:bg-surface-2',
        ghost: 'text-muted [@media(hover:hover)]:hover:bg-surface-2 [@media(hover:hover)]:hover:text-fg',
        danger: 'bg-danger text-white shadow-xs [@media(hover:hover)]:hover:brightness-95',
        'danger-ghost': 'text-danger [@media(hover:hover)]:hover:bg-danger-soft',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-5 text-[15px]',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)

type Props = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof button> & { loading?: boolean }

export function Button({ className, variant, size, loading, children, disabled, ...props }: Props) {
  return (
    <button
      className={cn(button({ variant, size }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {/* O conteúdo fica borrado enquanto carrega, e o spinner aparece por cima */}
      <span
        className={cn(
          'inline-flex items-center gap-2 transition-[filter,opacity] duration-200',
          loading && 'opacity-0 blur-[2px]',
        )}
      >
        {children}
      </span>
      {loading && (
        <span className="absolute inset-0 grid place-items-center">
          <Spinner />
        </span>
      )}
    </button>
  )
}
