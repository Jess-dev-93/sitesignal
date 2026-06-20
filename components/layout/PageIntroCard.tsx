import type { ReactNode } from 'react'
import { Card, CardContent } from '../ui/card'

/** Gradient intro card used on home and app workspace pages. */
export default function PageIntroCard({
  title,
  description,
  children,
  className = '',
}: {
  title: string
  description?: string
  children?: ReactNode
  className?: string
}) {
  return (
    <Card
      className={`overflow-hidden border-border bg-gradient-to-br from-card via-card to-violet-500/10 shadow-lg shadow-violet-500/5 ${className}`.trim()}
    >
      <CardContent className="p-4 sm:p-6">
        <h2 className="mb-1 text-lg font-semibold text-foreground sm:text-xl">{title}</h2>
        {description ? (
          <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        ) : null}
        {children}
      </CardContent>
    </Card>
  )
}
