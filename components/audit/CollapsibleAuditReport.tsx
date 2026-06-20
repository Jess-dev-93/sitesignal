'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Card, CardContent } from '../ui/card'

type CollapsibleAuditReportProps = {
  url: string
  sectionCount?: number
  children: React.ReactNode
  headerExtra?: React.ReactNode
}

export default function CollapsibleAuditReport({
  url,
  sectionCount = 4,
  children,
  headerExtra,
}: CollapsibleAuditReportProps) {
  const [open, setOpen] = useState(false)
  const hostname = url.replace(/^https?:\/\//, '')

  return (
    <Card className="overflow-hidden border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-4 border-b border-border bg-gradient-to-r from-card to-violet-500/5 p-5 text-left transition hover:bg-secondary/20 sm:p-6"
        aria-expanded={open}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <ChevronDown
              className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 ${
                open ? 'rotate-0' : '-rotate-90'
              }`}
              aria-hidden="true"
            />
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {open ? 'Hide full audit report' : 'Show full audit report'}
            </p>
          </div>
          <h3 className="mt-2 truncate text-lg font-semibold text-foreground">{hostname}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {open
              ? 'Client-ready findings, score breakdown, and PDF export'
              : `${sectionCount} sections · score breakdown · PDF export — expand when you need the detail`}
          </p>
        </div>
        {!open && (
          <span className="hidden shrink-0 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-violet-300 sm:inline-flex">
            Collapsed
          </span>
        )}
      </button>

      {headerExtra && !open ? (
        <div className="border-b border-border px-5 py-3 sm:px-6">{headerExtra}</div>
      ) : null}

      {open ? (
        <CardContent className="space-y-6 p-5 sm:p-6 md:p-8">{children}</CardContent>
      ) : null}
    </Card>
  )
}
