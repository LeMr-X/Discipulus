import { cn } from '../lib/cn'

/** Livro aberto: o símbolo do Discipulus ("aquele que aprende", em latim). */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('size-8', className)} aria-hidden>
      <rect width="32" height="32" rx="7" fill="var(--brand)" />
      <path d="M7 10.2c3-.9 6-.6 8.2 1v11.6c-2.2-1.4-5.2-1.7-8.2-.9V10.2Z" fill="var(--brand-fg)" />
      <path d="M25 10.2c-3-.9-6-.6-8.2 1v11.6c2.2-1.4 5.2-1.7 8.2-.9V10.2Z" fill="var(--brand-fg)" fillOpacity="0.72" />
    </svg>
  )
}

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <LogoMark />
      <span className="font-serif text-[19px] font-semibold tracking-[-0.01em] text-fg">Discipulus</span>
    </div>
  )
}
