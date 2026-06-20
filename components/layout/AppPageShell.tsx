'use client'

import type { ReactNode } from 'react'
import { AppHeader } from '../app-header'

type AppPageShellProps = {
  title: string
  description?: string
  eyebrow?: string
  children: ReactNode
  mainClassName?: string
}

/** Consistent app workspace page frame — header + spaced main container. */
export default function AppPageShell({
  title,
  description,
  eyebrow = 'Workspace',
  children,
  mainClassName = '',
}: AppPageShellProps) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <AppHeader variant="app" eyebrow={eyebrow} title={title} description={description} />
      <main
        className={`ss-page-main flex-1 ${mainClassName}`.trim()}
      >
        {children}
      </main>
    </div>
  )
}
