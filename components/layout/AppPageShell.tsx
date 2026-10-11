'use client'

import type { ReactNode } from 'react'
import { AppHeader } from '../app-header'

type AppPageShellProps = { title: string; description?: string; eyebrow?: string; children: ReactNode; mainClassName?: string; hideHeader?: boolean }

export default function AppPageShell({ title, description, eyebrow = 'Workspace', children, mainClassName = '', hideHeader = false }: AppPageShellProps) {
  return <div className="relative flex min-h-screen flex-col">{!hideHeader ? <AppHeader variant="app" eyebrow={eyebrow} title={title} description={description} /> : null}<main className={`ss-page-main flex-1 ${mainClassName}`.trim()}>{children}</main></div>
}
