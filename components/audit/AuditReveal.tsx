'use client'

import type { ReactNode } from 'react'

type AuditRevealProps = {
  index: number
  children: ReactNode
  className?: string
}

export default function AuditReveal({ index, children, className = '' }: AuditRevealProps) {
  return (
    <div
      className={`audit-reveal ${className}`}
      style={{ animationDelay: `${index * 160}ms` }}
    >
      {children}
    </div>
  )
}
