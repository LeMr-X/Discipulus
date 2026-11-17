import { cva, type VariantProps } from 'class-variance-authority'
import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

const badge = cva(
  'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium',
  {
    variants: {
      tone: {
        success: 'bg-success-soft text-success',
        warning: 'bg-warning-soft text-warning',
        danger: 'bg-danger-soft text-danger',
        brand: 'bg-brand-soft text-brand',
        neutral: 'bg-surface-2 text-muted',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
)

export function Badge({ tone, children, className }: VariantProps<typeof badge> & { children: ReactNode; className?: string }) {
  return (
    <span className={cn(badge({ tone }), className)}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {children}
    </span>
  )
}
