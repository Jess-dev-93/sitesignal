'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, Crown, FileSearch, Radar } from 'lucide-react'
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
    return <section className="ss-empty-signal"><div className="ss-empty-icon"><Radar /></div><div><span>Nothing boring here</span><h2>Your signal field is ready.</h2><p>Run a market search or decode a website. The strongest commercial opportunities will rise to the top automatically.</p></div><Link href="/app/leads" className="ss-ghost-button">Start searching <ArrowUpRight className="h-4 w-4" /></Link></section>
  }

  return (
    <section className="ss-dashboard-section">
      <div className="ss-section-heading"><div><span>Signal</span><h2>Your opportunity field</h2></div><p>Evidence, not guesswork.</p></div>
      <div className="ss-activity-grid">
      {bestOpportunity ? (
        <article className="ss-best-signal">
          <div className="ss-best-glow" /><div className="ss-best-label"><Crown className="h-4 w-4" /> Strongest signal</div>
          <div className="ss-best-body"><div><p className="ss-best-domain">{(bestOpportunity.entry.url ?? '').replace(/^https?:\/\//, '') || 'Recent scan'}</p><p className="ss-best-copy">The clearest commercial opportunity in your recent scans.</p></div><div className="ss-score-orb"><strong>{bestOpportunity.score}</strong><span>opportunity</span></div></div>
          <Link href={`/app/audit?url=${encodeURIComponent(bestOpportunity.entry.url ?? '')}`} className="ss-best-link">Open client-ready findings <ArrowUpRight className="h-4 w-4" /></Link>
        </article>
      ) : null}

      <article className="ss-feed-card">
        <div className="ss-feed-heading"><div className="ss-feed-icon"><FileSearch /></div><div><span>Decoded</span><h3>Recent audits</h3></div><Link href="/app/audit">View all</Link></div>
        <div className="ss-feed-list">
          {recentAudits.length === 0 ? (
            <p className="ss-feed-empty">No websites decoded yet.</p>
          ) : (
            recentAudits.map((entry) => {
              const opp = auditOpportunity(entry)
              return (
                <Link
                  key={entry.id ?? entry.url}
                  href="/app/audit"
                  className="ss-feed-row"
                >
                  <span className="truncate">
                    {(entry.url ?? '').replace(/^https?:\/\//, '')}
                  </span>
                  <span className="ss-mini-score">{opp.score}</span>
                </Link>
              )
            })
          )}
        </div>
      </article>

      <article className="ss-feed-card">
        <div className="ss-feed-heading"><div className="ss-feed-icon ss-feed-icon-violet"><Radar /></div><div><span>Scouted</span><h3>Recent searches</h3></div><Link href="/app/leads">View all</Link></div>
        <div className="ss-feed-list">
          {recentSearches.length === 0 ? (
            <p className="ss-feed-empty">No markets searched yet.</p>
          ) : (
            recentSearches.map((entry, i) => (
              <Link
                key={`${entry.query}-${entry.searchedAt}-${i}`}
                href="/app/leads"
                className="ss-feed-row ss-search-row"
              >
                <p>{entry.query || 'Opportunity search'}</p>
                {entry.totalFound != null ? (
                  <span>
                    {entry.totalFound} found
                    {entry.hotLeads != null ? ` · ${entry.hotLeads} hot` : ''}
                  </span>
                ) : null}
              </Link>
            ))
          )}
        </div>
      </article>
      </div>
    </section>
  )
}
