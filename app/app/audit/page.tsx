'use client'

import {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import type { CSSProperties, FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import { useSupabaseSession } from '../../../lib/useSupabaseSession'
import { AUTH_REQUIRED } from '../../../lib/authGuestMode'
import {
  DEFAULT_PROFILE,
  getStoredProfile,
  saveStoredProfile,
} from '../../../lib/profileStorage'
import type { UserProfile } from '../../../lib/profileStorage'
import type { TechStack } from '../../../lib/techStack'

import ReportWorkspace from '../../../components/ReportWorkspace'
import FullSiteAuditReport from '../../../components/FullSiteAuditReport'
import type { FullSiteAuditResult } from '../../../components/FullSiteAuditReport'
import ProfileModal from '../../../components/profile/ProfileModal'
import './sitebrief.css'

type View = 'new' | 'reports' | 'report'
type ScanMode = 'quick' | 'full-site'
type Device = 'mobile' | 'desktop'

interface DeviceScores {
  performance: number
  seo: number
  accessibility: number
  bestPractices: number
}

interface AuditScores {
  mobile: DeviceScores
  desktop: DeviceScores
  overallScore: number
  details: Record<string, unknown>
}

interface ReportContent {
  executiveSummary: string
  keyIssues: string[]
  businessImpact: string[]
  recommendations: string[]
}

interface SavedAudit {
  id: string
  url: string
  savedAt: string
  pageTitle?: string | null
  scores?: AuditScores | null
  techStack?: TechStack | null
  report?: Partial<ReportContent> | null
  overallScore?: number
  performance?: number
  mobilePerformance?: number
  desktopPerformance?: number
  seo?: number
  accessibility?: number
  bestPractices?: number
  status?: string
  notes?: string
}

interface LegacyAudit extends SavedAudit {
  date?: string
  aiReport?: Partial<ReportContent>
}

const HISTORY_KEY = 'siteSignalAuditHistory'

const theme = {
  '--background': '#faf9f7',
  '--foreground': '#271436',
  '--card': '#ffffff',
  '--card-foreground': '#271436',
  '--popover': '#ffffff',
  '--popover-foreground': '#271436',
  '--primary': '#6135ad',
  '--primary-foreground': '#ffffff',
  '--secondary': '#f1edf5',
  '--secondary-foreground': '#493955',
  '--muted': '#f3f0f5',
  '--muted-foreground': '#756b80',
  '--accent': '#eee7f8',
  '--accent-foreground': '#6135ad',
  '--border': '#e5dfe9',
  '--input': '#e5dfe9',
  '--ring': '#6135ad',
  colorScheme: 'light',
} as CSSProperties

const primaryButton =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-[#6135ad] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#50258f] disabled:cursor-not-allowed disabled:opacity-50'

const secondaryButton =
  'inline-flex items-center justify-center rounded-lg border border-[#ded6e5] bg-white px-4 py-2 text-sm font-medium text-[#6135ad] transition hover:bg-[#f1ebf8]'

function normaliseUrl(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ''

  return /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`
}

function displayUrl(value: string) {
  try {
    const url = new URL(normaliseUrl(value))
    const path = url.pathname === '/' ? '' : url.pathname

    return `${url.hostname.replace(/^www\./, '')}${path}`
  } catch {
    return value
  }
}

function reportTitle(entry: SavedAudit) {
  return entry.pageTitle?.trim() || displayUrl(entry.url)
}

function displayDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return 'Date unavailable'

  return date.toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function normaliseReport(
  report?: Partial<ReportContent> | null
): ReportContent {
  return {
    executiveSummary: report?.executiveSummary ?? '',
    keyIssues: report?.keyIssues ?? [],
    businessImpact: report?.businessImpact ?? [],
    recommendations: report?.recommendations ?? [],
  }
}

function readHistory(): SavedAudit[] {
  const parsed: unknown = JSON.parse(
    localStorage.getItem(HISTORY_KEY) || '[]'
  )

  if (!Array.isArray(parsed)) return []

  return parsed
    .filter(
      (entry): entry is LegacyAudit =>
        entry !== null &&
        typeof entry === 'object' &&
        typeof entry.url === 'string'
    )
    .map((entry, index) => ({
      ...entry,
      id: entry.id || `legacy-${index}`,
      savedAt:
        entry.savedAt || entry.date || new Date().toISOString(),
      report: entry.report ?? entry.aiReport ?? null,
    }))
}

function scoresFor(entry: SavedAudit): AuditScores {
  if (entry.scores) return entry.scores

  return {
    mobile: {
      performance:
        entry.mobilePerformance ?? entry.performance ?? 0,
      seo: entry.seo ?? 0,
      accessibility: entry.accessibility ?? 0,
      bestPractices: entry.bestPractices ?? 0,
    },
    desktop: {
      performance: entry.desktopPerformance ?? 0,
      seo: 0,
      accessibility: 0,
      bestPractices: 0,
    },
    overallScore: entry.overallScore ?? 0,
    details: {},
  }
}

function DocumentIcon({ className = 'h-5 w-5' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      className={className}
      aria-hidden="true"
    >
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z" />
      <path d="M14 3v6h6M8 13h8M8 17h5" />
    </svg>
  )
}

function ReportsTable({
  entries,
  onOpen,
}: {
  entries: SavedAudit[]
  onOpen: (entry: SavedAudit) => void
}) {
  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#ded6e5] px-6 py-10 text-center">
        <p className="font-medium text-[#271436]">
          Your reports will appear here
        </p>
        <p className="mt-2 text-sm text-[#756b80]">
          Run a single-page audit to save your first report.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[580px] text-left text-sm">
        <thead>
          <tr className="border-b border-[#e5dfe9] text-xs uppercase tracking-wider text-[#756b80]">
            <th className="pb-4 pr-6 font-medium">Website</th>
            <th className="pb-4 pr-6 font-medium">URL</th>
            <th className="pb-4 pr-6 font-medium">Audited</th>
            <th className="pb-4 text-right font-medium">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>

        <tbody>
          {entries.map((entry) => (
            <tr
              key={entry.id}
              className="border-b border-[#e5dfe9] last:border-0"
            >
              <td className="max-w-[240px] py-5 pr-6">
                <p
                  className="truncate font-medium text-[#271436]"
                  title={reportTitle(entry)}
                >
                  {reportTitle(entry)}
                </p>
              </td>

              <td className="max-w-[240px] py-5 pr-6">
                <p
                  className="truncate text-[#756b80]"
                  title={entry.url}
                >
                  {displayUrl(entry.url)}
                </p>
              </td>

              <td className="whitespace-nowrap py-5 pr-6 text-[#756b80]">
                {displayDate(entry.savedAt)}
              </td>

              <td className="py-5 text-right">
                <button
                  type="button"
                  onClick={() => onOpen(entry)}
                  className="whitespace-nowrap font-medium text-[#6135ad] hover:underline"
                >
                  Open report <span aria-hidden="true">→</span>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function AuditPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#faf9f7] p-10 text-[#756b80]">
          Loading SiteBrief…
        </div>
      }
    >
      <SiteBriefWorkspace />
    </Suspense>
  )
}

function SiteBriefWorkspace() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const {
    userId,
    email,
    loading: authLoading,
  } = useSupabaseSession()

  const [view, setView] = useState<View>('new')
  const [url, setUrl] = useState('')
  const [scanMode, setScanMode] = useState<ScanMode>('quick')
  const [device, setDevice] = useState<Device>('mobile')
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const [history, setHistory] = useState<SavedAudit[]>([])
  const [audit, setAudit] = useState<SavedAudit | null>(null)
  const [fullSite, setFullSite] =
    useState<FullSiteAuditResult | null>(null)

  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE)
  const [brandingOpen, setBrandingOpen] = useState(false)

  const runningRef = useRef(false)
  const queryUrl = searchParams.get('url') || ''

  useEffect(() => {
    if (authLoading) return

    if (AUTH_REQUIRED && !userId) {
      router.replace('/signin')
      return
    }

    const storedProfile = getStoredProfile()
    if (storedProfile) setProfile(storedProfile)

    try {
      setHistory(readHistory())
    } catch {
      setError('Saved reports could not be read from this browser.')
    }
  }, [authLoading, userId, router])

  useEffect(() => {
    if (queryUrl) setUrl(queryUrl)
  }, [queryUrl])

  const refreshHistory = useCallback(() => {
    try {
      setHistory(readHistory())
    } catch {
      setError('Saved reports could not be read from this browser.')
    }
  }, [])

  const openReport = (entry: SavedAudit) => {
    setAudit(entry)
    setFullSite(null)
    setDevice('mobile')
    setError(null)
    setView('report')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const startNew = () => {
    if (runningRef.current) return

    setAudit(null)
    setFullSite(null)
    setError(null)
    setUrl('')
    setView('new')
    refreshHistory()
  }

  const showReports = () => {
    if (runningRef.current) return

    refreshHistory()
    setError(null)
    setView('reports')
  }

  const runAudit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (runningRef.current || (AUTH_REQUIRED && !userId)) return

    const target = normaliseUrl(url)

    try {
      const parsed = new URL(target)

      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error('Unsupported URL')
      }
    } catch {
      setError('Enter a valid website URL, such as example.com.au.')
      return
    }

    runningRef.current = true
    setIsRunning(true)
    setError(null)
    setAudit(null)
    setFullSite(null)

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      if (userId) headers['x-user-id'] = userId

      const response = await fetch(
        scanMode === 'full-site'
          ? '/api/site-discovery'
          : '/api/audit',
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            url: target,
            scanMode,
          }),
        }
      )

      const json = await response.json()

      if (!response.ok || !json.success) {
        setError(json.error || 'The audit failed. Please try again.')
        return
      }

      if (scanMode === 'full-site') {
        setFullSite(json)
        setView('report')
        return
      }

      const entry: SavedAudit = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        url: json.url || target,
        savedAt: json.scannedAt || new Date().toISOString(),
        pageTitle: json.pageTitle || null,
        scores: json.scores,
        techStack: json.techStack || null,
        report: normaliseReport(json.aiReport),
        overallScore: json.scores.overallScore,
        performance: json.scores.mobile.performance,
        mobilePerformance: json.scores.mobile.performance,
        desktopPerformance: json.scores.desktop.performance,
        seo: json.scores.mobile.seo,
        accessibility: json.scores.mobile.accessibility,
        bestPractices: json.scores.mobile.bestPractices,
        status: 'Saved',
        notes: '',
      }

      setAudit(entry)
      setDevice('mobile')
      setView('report')

      try {
        const existing = readHistory()
        const today = new Date().toDateString()

        const remaining = existing.filter(
          (item) =>
            !(
              item.url === entry.url &&
              new Date(item.savedAt).toDateString() === today
            )
        )

        const updated = [entry, ...remaining].slice(0, 50)

        localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
        setHistory(updated)
      } catch {
        setError(
          'Your report is ready, but could not be saved in this browser. Download a copy before leaving.'
        )
      }
    } catch {
      setError(
        'Could not complete the audit. Check your connection and try again.'
      )
    } finally {
      runningRef.current = false
      setIsRunning(false)
    }
  }

  const filteredHistory = history.filter((entry) =>
    `${entry.pageTitle || ''} ${entry.url}`
      .toLowerCase()
      .includes(search.toLowerCase())
  )

  if (authLoading || (AUTH_REQUIRED && !userId)) {
    return (
      <div className="min-h-screen bg-[#faf9f7] p-10 text-[#756b80]">
        Loading SiteBrief…
      </div>
    )
  }

  return (
    <div
  style={theme}
  className="sitebrief-workspace min-h-screen bg-[#faf9f7] text-[#271436] md:flex"
>
      <aside className="flex flex-col border-b border-[#e5dfe9] bg-[#fcfbfa] p-5 md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0 md:border-b-0 md:border-r md:p-6">
        <div className="flex items-center gap-3">
          <DocumentIcon className="h-8 w-8 text-[#6135ad]" />

          <div>
            <p className="font-serif text-3xl tracking-tight">
              SiteBrief
            </p>
            <p className="mt-1 text-xs text-[#756b80]">
              by JM Sites
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={startNew}
          disabled={isRunning}
          className={`${primaryButton} mt-7 w-full`}
        >
          <span className="text-xl" aria-hidden="true">+</span>
          New audit
        </button>

        <nav
          aria-label="Workspace"
          className="mt-4 flex gap-2 md:flex-col"
        >
          <button
            type="button"
            onClick={showReports}
            disabled={isRunning}
            className={`flex flex-1 items-center gap-3 rounded-lg px-4 py-3 text-left text-sm transition disabled:opacity-50 ${
              view === 'reports' || view === 'report'
                ? 'bg-[#eee7f8] text-[#6135ad]'
                : 'text-[#493955] hover:bg-[#f1edf5]'
            }`}
          >
            <DocumentIcon />
            Reports
          </button>

          <button
            type="button"
            onClick={() => setBrandingOpen(true)}
            className="flex flex-1 items-center gap-3 rounded-lg px-4 py-3 text-left text-sm text-[#493955] transition hover:bg-[#f1edf5]"
          >
            <span className="text-lg" aria-hidden="true">✎</span>
            Branding
          </button>
        </nav>

        <div className="mt-auto hidden pt-10 md:block">
          <p className="text-sm font-medium">Your workspace</p>
          <p className="mt-1 truncate text-xs text-[#756b80]">
            {email || 'Reports saved in this browser'}
          </p>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <header className="border-b border-[#e5dfe9] px-6 py-5 text-sm text-[#756b80] sm:px-10">
          {view === 'new' && 'New audit'}
          {view === 'reports' && 'Saved reports'}
          {view === 'report' && (
            <button
              type="button"
              onClick={showReports}
              className="hover:text-[#6135ad]"
            >
              Reports <span className="mx-2">/</span> Website review
            </button>
          )}
        </header>

        <div className="mx-auto max-w-6xl px-6 py-10 sm:px-10 sm:py-14">
          {error && (
            <div
              role="alert"
              className="mb-6 rounded-lg border border-[#efc7c7] bg-[#fff3f1] p-4 text-sm text-[#8b3030]"
            >
              {error}
            </div>
          )}

          {view === 'new' && (
            <>
              <div className="mb-9">
                <h1 className="font-serif text-4xl tracking-tight sm:text-5xl lg:text-6xl">
                  Start with a website
                </h1>

                <p className="mt-4 text-base leading-relaxed text-[#756b80] sm:text-lg">
                  Turn website findings into a clear, client-ready report.
                </p>
              </div>

             <form
  onSubmit={runAudit}
  className="sitebrief-scan-panel rounded-xl border border-[#ded6e5] bg-white p-6 sm:p-8"
>
                <label
                  htmlFor="website-url"
                  className="block text-sm font-medium"
                >
                  Website URL
                </label>

                <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                  <input
                    id="website-url"
                    type="text"
                    inputMode="url"
                    autoComplete="url"
                    autoCapitalize="none"
                    spellCheck={false}
                    value={url}
                    onChange={(event) => setUrl(event.target.value)}
                    disabled={isRunning}
                    required
                    placeholder="https://example.com.au"
                    className="min-w-0 flex-1 rounded-lg border border-[#ded6e5] bg-white px-4 py-3.5 text-base text-[#271436] outline-none placeholder:text-[#aaa1b2] focus:border-[#6135ad] focus:ring-2 focus:ring-[#eee7f8]"
                  />

                  <button
                    type="submit"
                    disabled={isRunning || !url.trim()}
                    className={primaryButton}
                  >
                    <DocumentIcon />
                    {isRunning ? 'Running audit…' : 'Run audit'}
                  </button>
                </div>

                <fieldset
                  disabled={isRunning}
                  className="mt-6 grid gap-5 sm:grid-cols-2"
                >
                  <legend className="sr-only">Audit scope</legend>

                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="radio"
                      name="scan-mode"
                      value="quick"
                      checked={scanMode === 'quick'}
                      onChange={() => setScanMode('quick')}
                      className="mt-1 h-4 w-4 accent-[#6135ad]"
                    />

                    <span>
                      <span className="block font-medium">
                        Single page
                      </span>
                      <span className="mt-1 block text-sm text-[#756b80]">
                        Mobile and desktop checks
                      </span>
                    </span>
                  </label>

                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="radio"
                      name="scan-mode"
                      value="full-site"
                      checked={scanMode === 'full-site'}
                      onChange={() => setScanMode('full-site')}
                      className="mt-1 h-4 w-4 accent-[#6135ad]"
                    />

                    <span>
                      <span className="block font-medium">
                        Full website
                      </span>
                      <span className="mt-1 block text-sm text-[#756b80]">
                        Discover pages and review representative pages
                      </span>
                    </span>
                  </label>
                </fieldset>

                <p className="mt-7 border-t border-[#e5dfe9] pt-5 text-sm leading-relaxed text-[#756b80]">
                  Review the findings before exporting your report.
                </p>

                {isRunning && (
                  <div
                    role="status"
                    className="mt-5 flex items-center gap-3 text-sm text-[#6135ad]"
                  >
                    <span className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-[#ded6e5] border-t-[#6135ad]" />
                    {scanMode === 'quick'
                      ? 'Checking mobile and desktop results…'
                      : 'Discovering pages and preparing your site review…'}
                  </div>
                )}
              </form>

              <section className="mt-12">
                <div className="mb-6 flex items-center justify-between gap-4">
                  <h2 className="font-serif text-2xl sm:text-3xl">
                    Recent reports
                  </h2>

                  <button
                    type="button"
                    onClick={showReports}
                    disabled={isRunning}
                    className="text-sm font-medium text-[#6135ad] hover:underline disabled:opacity-50"
                  >
                    View all reports →
                  </button>
                </div>

                {isRunning ? (
                  <p className="text-sm text-[#756b80]">
                    Your saved reports will be available when the scan finishes.
                  </p>
                ) : (
                  <ReportsTable
                    entries={history.slice(0, 3)}
                    onOpen={openReport}
                  />
                )}
              </section>
            </>
          )}

          {view === 'reports' && (
            <section>
              <div className="flex flex-wrap items-center justify-between gap-5">
                <div>
                  <h1 className="font-serif text-4xl sm:text-5xl">
                    Your reports
                  </h1>

                  <p className="mt-3 text-sm text-[#756b80]">
                    Reopen a saved audit to review or download it.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={startNew}
                  className={primaryButton}
                >
                  + New audit
                </button>
              </div>

              <label className="mt-8 block">
                <span className="sr-only">Search saved reports</span>
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by website or URL"
                  className="w-full rounded-lg border border-[#ded6e5] bg-white px-4 py-3 text-sm outline-none focus:border-[#6135ad] focus:ring-2 focus:ring-[#eee7f8]"
                />
              </label>

              <div className="mt-7">
                {history.length > 0 && filteredHistory.length === 0 ? (
                  <p className="py-6 text-sm text-[#756b80]">
                    No reports match your search.
                  </p>
                ) : (
                  <ReportsTable
                    entries={filteredHistory}
                    onOpen={openReport}
                  />
                )}
              </div>
            </section>
          )}

          {view === 'report' && audit && (
  <ReportWorkspace
    key={audit.id}
    url={audit.url}
    pageTitle={audit.pageTitle}
    auditedAt={audit.savedAt}
    scores={scoresFor(audit)}
    report={normaliseReport(audit.report)}
    profile={profile}
    onNewAudit={startNew}
    onEditBranding={() => setBrandingOpen(true)}
    onSave={(report) => {
      const updatedAudit = {
        ...audit,
        report,
      }

      const existing = readHistory()
      const found = existing.some((entry) => entry.id === audit.id)

      const updatedHistory = found
        ? existing.map((entry) =>
            entry.id === audit.id ? updatedAudit : entry
          )
        : [updatedAudit, ...existing].slice(0, 50)

      // Save first. If storage fails, the editor keeps your draft.
      localStorage.setItem(
        HISTORY_KEY,
        JSON.stringify(updatedHistory)
      )

      setAudit(updatedAudit)
      setHistory(updatedHistory)
    }}
  />
)}

{view === 'report' && fullSite && (
  <section className="space-y-7">
    <div className="flex items-center justify-between gap-4">
      <h1 className="font-serif text-3xl">
        Full website review
      </h1>

      <button
        type="button"
        onClick={startNew}
        className={secondaryButton}
      >
        New audit
      </button>
    </div>

    <FullSiteAuditReport
      result={fullSite}
      profile={profile}
    />
  </section>
)}
        </div>
      </main>

      <ProfileModal
        open={brandingOpen}
        initialProfile={profile}
        sessionEmail={email}
        onClose={() => setBrandingOpen(false)}
        onSave={(nextProfile) => {
          setProfile(nextProfile)
          saveStoredProfile(nextProfile)
          setBrandingOpen(false)
        }}
      />
    </div>
  )
}