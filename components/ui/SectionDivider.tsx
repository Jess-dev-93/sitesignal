type SectionDividerProps = {
  label: string
}

export function SectionDivider({ label }: SectionDividerProps) {
  return (
    <div className="flex items-center gap-4 py-1" aria-hidden="true">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border/80 to-border/30" />
      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/75">
        {label}
      </span>
      <div className="h-px flex-1 bg-gradient-to-l from-transparent via-border/80 to-border/30" />
    </div>
  )
}
