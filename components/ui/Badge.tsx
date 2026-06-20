type BadgeVariant = 'success' | 'warning' | 'muted' | 'violet' | 'blue' | 'rose'

type BadgeProps = {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

const VARIANTS: Record<BadgeVariant, string> = {
  success: 'border-success-border bg-success-muted text-success',
  warning: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  muted: 'border-border bg-secondary/50 text-muted-foreground',
  violet: 'border-violet-500/30 bg-violet-500/10 text-violet-300',
  blue: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
  rose: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
}

export function Badge({ children, variant = 'muted', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </span>
  )
}
