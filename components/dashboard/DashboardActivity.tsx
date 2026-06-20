'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { computeOpportunityScore, normalizeScores } from '../../lib/opportunityScore'

type AuditHistoryEntry = {
  id?: string
  url?: string
  savedAt?: string
  date?: string
  overallScore?: number
  performance?: number
  seo?: number
  accessibility?: number
  bestPractices?: number
  scores?: {
    mobile?: {
      performance?: number
      seo?: number
      accessibility?: number
      bestPractices?: number
    }
    overallScore?: number
    details?: { hasMetaDescription?: boolean; loadTime?: string }
  }
  report?: { keyIssues?: string[] }
  aiReport?: { keyIssues?: string[] }
}

type LeadSearchEntry = {
  query?: string
  totalFound?: number
  hotLeads?: number
  searchedAt?: string
}

function readAuditHistory(): AuditHistoryEntry[] {
  try {
    const raw = localStorage.getItem('siteSignalAuditHistory')
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function readLeadSearches(): LeadSearchEntry[] {
  try {
    const raw = localStorage.getItem('siteSignalLeadSearchHistory')
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function auditOpportunity(entry: AuditHistoryEntry) {
  const issues = entry.aiReport?.keyIssues ?? entry.report?.keyIssues ?? []
  return computeOpportunityScore(normalizeScores(entry), issues)
}

export default function DashboardActivity() {
  const [audits, setAudits] = useState<AuditHistoryEntry[]>([])
  const [searches, setSearches] = useState<LeadSearchEntry[]>([])

  useEffect(() => {
    setAudits(readAuditHistory())
    setSearches(readLeadSearches())
  }, [])

  const bestOpportunity = useMemo((): { entry: AuditHistoryEntry; score: number } | null => {
    if (audits.length === 0) return null
    return audits.reduce<{ entry: AuditHistoryEntry; score: number } | null>((best, entry) => {
      const { score } = auditOpportunity(entry)
      if (!best || score > best.score) return { entry, score }
      return best
    }, null)
  }, [audits])

  const recentAudits = audits.slice(0, 3)
  const recentSearches = searches.slice(0, 3)
  const hasActivity = recentAudits.length > 0 || recentSearches.length > 0 || bestOpportunity

  if (!hasActivity) {
    return (
      <Card className="border-border bg-gradient-to-br from-card to-violet-500/5">
        <CardContent className="p-5 sm:p-6">
          <p className="text-sm font-medium text-foreground">Your workspace is ready</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Run a lead search or scan a website — your recent activity and best opportunities
            will show up here.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild size="sm" className="gap-2">
              <Link href="/app/leads">
                Find leads
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="sm" variant="secondary">
              <Link href="/app/audit">Scan a website</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {bestOpportunity ? (
        <Card className="border-success-border/40 bg-success-muted/15 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-foreground">
              Best opportunity
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-foreground">
                {(bestOpportunity.entry.url ?? '').replace(/^https?:\/\//, '') || 'Recent scan'}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Opportunity score{' '}
                <span className="font-semibold text-success">{bestOpportunity.score}</span> — worth
                following up
              </p>
            </div>
            <Button asChild size="sm" className="gap-2 shrink-0">
              <Link href={`/app/outreach?url=${encodeURIComponent(bestOpportunity.entry.url ?? '')}&mode=audited`}>
                Generate outreach
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-foreground">Recent audits</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {recentAudits.length === 0 ? (
            <p className="text-sm text-muted-foreground">No scans yet.</p>
          ) : (
            recentAudits.map((entry) => {
              const opp = auditOpportunity(entry)
              return (
                <Link
                  key={entry.id ?? entry.url}
                  href="/app/audit"
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary/20 px-3 py-2.5 transition hover:bg-secondary/40"
                >
                  <span className="truncate text-sm text-foreground">
                    {(entry.url ?? '').replace(/^https?:\/\//, '')}
                  </span>
                  <span className="shrink-0 text-xs font-semibold text-success">{opp.score}</span>
                </Link>
              )
            })
          )}
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-foreground">Recent lead searches</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {recentSearches.length === 0 ? (
            <p className="text-sm text-muted-foreground">No searches yet.</p>
          ) : (
            recentSearches.map((entry, i) => (
              <Link
                key={`${entry.query}-${entry.searchedAt}-${i}`}
                href="/app/leads"
                className="block rounded-lg border border-border bg-secondary/20 px-3 py-2.5 transition hover:bg-secondary/40"
              >
                <p className="text-sm font-medium text-foreground">{entry.query || 'Lead search'}</p>
                {entry.totalFound != null ? (
                  <p className="text-xs text-muted-foreground">
                    {entry.totalFound} found
                    {entry.hotLeads != null ? ` · ${entry.hotLeads} hot` : ''}
                  </p>
                ) : null}
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
