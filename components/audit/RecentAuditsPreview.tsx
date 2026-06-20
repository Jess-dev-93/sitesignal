import Image from 'next/image'
import { computeOpportunityScore, normalizeScores } from '../../lib/opportunityScore'
import { displaySiteName, faviconUrl } from '../../lib/pageMeta'
import { Badge } from '../ui/Badge'

type RecentAuditEntry = {
  id: string
  url: string
  savedAt: string
  pageTitle?: string | null
  report?: { keyIssues?: string[] } | null
  scores?: Parameters<typeof normalizeScores>[0]['scores']
  performance?: number
  seo?: number
  accessibility?: number
  bestPractices?: number
  overallScore?: number
  mobilePerformance?: number
  desktopPerformance?: number
}

type RecentAuditsPreviewProps = {
  entries: RecentAuditEntry[]
  onOpen: (entry: RecentAuditEntry) => void
  onViewAll: () => void
}

export default function RecentAuditsPreview({
  entries,
  onOpen,
  onViewAll,
}: RecentAuditsPreviewProps) {
  if (entries.length === 0) return null

  return (
    <div className="overflow-hidden rounded-[28px] border border-border bg-card backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Recent audits</h3>
          <p className="text-xs text-muted-foreground">
            Reopen a scan to continue to outreach
          </p>
        </div>
        <button
          type="button"
          onClick={onViewAll}
          className="text-xs font-medium text-blue-300 transition hover:text-blue-200"
        >
          View all →
        </button>
      </div>
      <div className="divide-y divide-border">
        {entries.map((entry) => {
          const opp = computeOpportunityScore(
            normalizeScores(entry),
            entry.report?.keyIssues ?? []
          )
          const name = displaySiteName(entry.url, entry.pageTitle)

          return (
            <button
              key={entry.id}
              type="button"
              onClick={() => onOpen(entry)}
              className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-secondary/30 sm:px-6"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-card">
                <Image
                  src={faviconUrl(entry.url, 32)}
                  alt=""
                  width={20}
                  height={20}
                  className="h-5 w-5 object-contain"
                  unoptimized
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{name}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {entry.url.replace(/^https?:\/\//, '')}
                </p>
              </div>
              <Badge
                variant={
                  opp.level === 'HIGH'
                    ? 'success'
                    : opp.level === 'MEDIUM'
                      ? 'warning'
                      : 'muted'
                }
              >
                {opp.score} opportunity
              </Badge>
            </button>
          )
        })}
      </div>
    </div>
  )
}
