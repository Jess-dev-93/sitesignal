import type { ReactNode } from 'react'

export default function SectionLabel({
  id,
  children,
  className = '',
}: {
  id?: string
  children: ReactNode
  className?: string
}) {
  return (
    <h3
      id={id}
      className={`mb-5 text-xs font-semibold uppercase tracking-[0.22em] text-foreground/55 sm:text-sm sm:tracking-[0.18em] ${className}`.trim()}
    >
      {children}
    </h3>
  )
}
