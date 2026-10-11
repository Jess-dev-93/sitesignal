'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import LeadFinderForm, {
  DEFAULT_LEAD_PREFERENCES,
  LeadPreferences,
} from './LeadFinderForm'

const DEMO_USER_ID = 'demo-user'

const LOADING_STEPS = [
  { icon: '🔍', text: 'Searching for businesses...' },
  { icon: '🌏', text: 'Finding relevant business websites...' },
  { icon: '📊', text: 'Checking website health...' },
  { icon: '📱', text: 'Reviewing mobile and conversion signals...' },
  { icon: '🔎', text: 'Reviewing SEO and website issues...' },
{ icon: '🎯', text: 'Matching your platform and business preferences...' },
  { icon: '✨', text: 'Preparing your shortlist...' },
]

const LEAD_STATUSES = [
  'New',
  'Not Contacted',
  'Contacted',
  'Replied',
  'Meeting Booked',
  'Won',
  'Lost',
] as const

type LeadStatus =
  (typeof LEAD_STATUSES)[number]

type WorkspaceLead = {
  title?: string
  url?: string
  domain?: string
  leadTemp?: string
  opportunityScore?: number
  problems?: string[]
  platform?: string

  scores?: {
    overall?: number

    mobile?: {
      performance?: number
      seo?: number
      accessibility?: number
      bestPractices?: number
    }

    desktop?: {
      performance?: number
    }
  }
}

type Lead = {
  title: string
  url: string

  displayUrl?: string
  snippet?: string
  domain?: string
  location?: string
  phone?: string
rating?: number | null
reviews?: number
businessType?: string
contactReason?: string

  opportunityScore?: number
  leadTemp?: string
  recommendation?: string

  platform?: string
platformConfidence?: string

estimatedBusinessSize?: string
businessSizeConfidence?: string
businessSizeReason?: string

problems?: string[]
  quick_issues?: string[]
  quick_health_score?: number

  scores?: {
    overall?: number

    performance?: number | null
    seo?: number | null
    accessibility?: number | null
    bestPractices?: number | null

    isHttps?: boolean
    hasMetaDescription?: boolean
    hasViewport?: boolean
    loadTime?: string
  }

  signals?: {
    hasPhone?: boolean
    hasEmail?: boolean
    hasContactPage?: boolean
    hasForm?: boolean
    hasSocialLinks?: boolean

    platform?: string
platformConfidence?: string

businessSize?: string
businessSizeConfidence?: string
businessSizeReason?: string
  }
}

type SearchSummary = {
  query: string
  location: string

  totalFound: number
  hotLeads: number
  warmLeads: number

  stats?: {
    locationKey?: string
    candidatesFound?: number
    candidatesTried?: number
    scannedCount?: number
    failedFetchCount?: number
    skippedHealthyCount?: number
    returnedCount?: number
  }

  message?: string
}

type LeadRecord = {
  status: LeadStatus
  notes: string
  lastSavedAt?: string

  saveState?:
    | 'idle'
    | 'saving'
    | 'saved'
    | 'error'
}

type LeadSearchHistoryEntry = {
  id: string
  query: string

  preferences?: LeadPreferences

  totalFound: number
  hotLeads: number
  warmLeads: number

  leads: Lead[]
  searchedAt: string
}

type StoredLeadRow = {
  domain?: string
  lead_status?: string
  notes?: string
  updated_at?: string
}

interface LeadFinderWorkspaceProps {
  userId?: string | null

  onRunFullAudit?: (
    lead: WorkspaceLead
  ) => void

  onStartAuditedOutreach?: (
    lead: WorkspaceLead
  ) => void

  onOpenManualOutreach?: (
    lead: WorkspaceLead
  ) => void
}

// =====================================================
// HELPERS
// =====================================================

function getLeadOverallScore(
  lead: Lead
): number {
  return (
    lead.quick_health_score ??
    lead.scores?.overall ??
    0
  )
}

function getLeadId(
  lead: Lead
): string {
  return (
    lead.url ||
    lead.domain ||
    lead.title
  )
}

function getLeadDomain(
  lead: Lead
): string {
  if (lead.domain) {
    return lead.domain
  }

  try {
    return new URL(lead.url)
      .hostname
      .replace(/^www\./, '')
  } catch {
    return lead.url
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0]
  }
}

function getLeadPlatform(
  lead: Lead
): string {
  return (
    lead.platform ||
    lead.signals?.platform ||
    'Custom / Unknown'
  )
}
function getBusinessSizeLabel(
  lead: Lead
): string {
  const size =
    lead.estimatedBusinessSize ||
    lead.signals?.businessSize ||
    'unknown'

  if (size === 'small') {
    return 'Small / local'
  }

  if (size === 'medium') {
    return 'Growing / mid-size'
  }

  if (
    size === 'enterprise'
  ) {
    return 'Large / enterprise'
  }

  return 'Size unknown'
}

function getBusinessSizeReason(
  lead: Lead
): string {
  return (
    lead.businessSizeReason ||
    lead.signals
      ?.businessSizeReason ||
    'Estimated from public website signals'
  )
}
function cleanIssueText(
  issue: string
): string {
  return issue
    .replace(
      /^[^\p{L}\p{N}]+/u,
      ''
    )
    .trim()
}

function getIssueItems(
  lead: Lead
): string[] {
  const raw =
    lead.problems?.length
      ? lead.problems
      : lead.quick_issues?.length
        ? lead.quick_issues
        : []

  const items = raw
    .map(cleanIssueText)
    .filter(Boolean)

  if (items.length) {
    return items.slice(0, 3)
  }

  const fallback: string[] = []

  if (
    lead.signals?.hasPhone ===
    false
  ) {
    fallback.push(
  'Phone not detected on scanned page'
)
  }

  if (
    lead.signals?.hasEmail ===
    false
  ) {
    fallback.push(
  'Email not detected on scanned page'
)
  }

  if (
    lead.signals?.hasForm ===
    false
  ) {
    fallback.push(
      'No contact form'
    )
  }

  if (
    lead.scores
      ?.hasMetaDescription ===
    false
  ) {
    fallback.push(
      'Missing meta description'
    )
  }

  if (
    lead.scores?.hasViewport ===
    false
  ) {
    fallback.push(
      'Mobile setup needs review'
    )
  }

  if (!fallback.length) {
    fallback.push(
      'Website worth reviewing'
    )
  }

  return fallback.slice(0, 3)
}

function getPotentialWork(
  lead: Lead
): string[] {
  const work =
    new Set<string>()

  const issueText = [
    ...(lead.problems || []),
    ...(lead.quick_issues || []),
  ]
    .join(' ')
    .toLowerCase()

  if (
    lead.scores?.hasViewport ===
      false ||
    issueText.includes('mobile') ||
    issueText.includes('viewport')
  ) {
    work.add(
      'Mobile improvements'
    )
  }

  if (
    lead.signals
      ?.hasContactPage === false ||
    lead.signals?.hasForm ===
      false ||
    lead.signals?.hasPhone ===
      false ||
    lead.signals?.hasEmail ===
      false ||
    issueText.includes('contact') ||
    issueText.includes('conversion')
  ) {
    work.add(
      'Conversion improvements'
    )
  }

  if (
    lead.scores
      ?.hasMetaDescription ===
      false ||
    issueText.includes('meta') ||
    issueText.includes('seo') ||
    issueText.includes('title')
  ) {
    work.add(
      'SEO improvements'
    )
  }

  if (
    getLeadOverallScore(lead) <
      75 ||
    issueText.includes('old') ||
    issueText.includes('outdated') ||
    issueText.includes('builder') ||
    issueText.includes(
      'placeholder'
    )
  ) {
    work.add(
      'Website refresh'
    )
  }

  if (!work.size) {
    work.add(
      'Further website review'
    )
  }

  return Array.from(work).slice(
    0,
    3
  )
}

function getWhyContactText(
  lead: Lead
): string {
  const score =
    getLeadOverallScore(lead)

  const issues =
    getIssueItems(lead)

  const issueText =
    issues
      .join(' ')
      .toLowerCase()

  if (
    score < 55
  ) {
    return (
      'The website shows several clear weaknesses that may be affecting trust, usability or enquiries. This looks worth reviewing before reaching out.'
    )
  }

  if (
    issueText.includes('mobile') ||
    issueText.includes('contact') ||
    issueText.includes('form') ||
    issueText.includes('phone') ||
    issueText.includes('email')
  ) {
    return (
      'The business appears established, but the website has clear customer journey or enquiry gaps. Improving these could make it easier for customers to take action.'
    )
  }

  if (
    issueText.includes('meta') ||
    issueText.includes('seo') ||
    issueText.includes('title')
  ) {
    return (
      'The website appears functional but has visible discoverability gaps. There may be an opportunity to improve search visibility and strengthen the site.'
    )
  }

  return (
    'The website is worth a closer look. There are visible improvement areas that may support a useful, relevant conversation with the business.'
  )
}

function getHealthLabel(
  score: number
) {
  if (score >= 85) {
    return {
      label: 'Good',
      classes:
        'text-emerald-300',
      ring:
        'border-emerald-400/30 bg-emerald-500/[0.06]',
    }
  }

  if (score >= 70) {
    return {
      label: 'Needs work',
      classes:
        'text-amber-300',
      ring:
        'border-amber-400/30 bg-amber-500/[0.06]',
    }
  }

  return {
    label: 'Needs serious work',
    classes:
      'text-rose-300',
    ring:
      'border-rose-400/30 bg-rose-500/[0.06]',
  }
}

function mapLeadToWorkspaceLead(
  lead: Lead
): WorkspaceLead {
  return {
    title: lead.title,
    url: lead.url,
    domain: lead.domain,

    leadTemp:
      lead.leadTemp,

    opportunityScore:
      lead.opportunityScore,

    platform:
      getLeadPlatform(lead),

    problems:
      lead.problems ||
      lead.quick_issues ||
      [],

    scores: {
      overall:
        getLeadOverallScore(lead),

      mobile: {
        performance:
          lead.scores
            ?.performance ??
          undefined,

        seo:
          lead.scores?.seo ??
          undefined,

        accessibility:
          lead.scores
            ?.accessibility ??
          undefined,

        bestPractices:
          lead.scores
            ?.bestPractices ??
          undefined,
      },

      desktop: {
        performance:
          undefined,
      },
    },
  }
}

// =====================================================
// SEARCH HISTORY
// =====================================================

function saveLeadSearchToHistory(
  searchData: {
    query: string
    preferences: LeadPreferences

    totalFound: number
    hotLeads: number
    warmLeads: number

    leads: Lead[]
  }
) {
  try {
    const existing =
      JSON.parse(
        localStorage.getItem(
          'siteSignalLeadSearchHistory'
        ) || '[]'
      ) as LeadSearchHistoryEntry[]

    const entry:
      LeadSearchHistoryEntry = {
      id:
        typeof crypto !==
          'undefined' &&
        'randomUUID' in crypto
          ? crypto.randomUUID()
          : `search-${Date.now()}`,

      query:
  searchData.query,

preferences:
  searchData.preferences,

totalFound:
        searchData.totalFound,

      hotLeads:
        searchData.hotLeads,

      warmLeads:
        searchData.warmLeads,

      leads:
        searchData.leads,

      searchedAt:
        new Date().toISOString(),
    }

    const updated = [
  entry,
  ...existing,
].slice(0, 200)

    localStorage.setItem(
      'siteSignalLeadSearchHistory',
      JSON.stringify(updated)
    )
  } catch {
    // Ignore history failure.
  }
}

function getLeadSearchHistory():
  LeadSearchHistoryEntry[] {
  try {
    return JSON.parse(
      localStorage.getItem(
        'siteSignalLeadSearchHistory'
      ) || '[]'
    )
  } catch {
    return []
  }
}

function clearLeadSearchHistory() {
  localStorage.removeItem(
    'siteSignalLeadSearchHistory'
  )
}

// =====================================================
// COMPONENT
// =====================================================

export default function LeadFinderWorkspace({
  userId,
  onRunFullAudit,
}: LeadFinderWorkspaceProps) {
  const effectiveUserId =
    userId || DEMO_USER_ID

  const [query, setQuery] =
    useState(
      'Plumbers Sydney'
    )

  const [
  preferences,
  setPreferences,
] = useState<LeadPreferences>(
  () => ({
    ...DEFAULT_LEAD_PREFERENCES,

    selectedPlatforms: [
      ...DEFAULT_LEAD_PREFERENCES.selectedPlatforms,
    ],
  })
)

  const [
    isLoading,
    setIsLoading,
  ] = useState(false)

  const [
    loadingStep,
    setLoadingStep,
  ] = useState(0)

  const [
    elapsedTime,
    setElapsedTime,
  ] = useState(0)

  const [
    results,
    setResults,
  ] = useState<Lead[]>([])

  const [
    summary,
    setSummary,
  ] =
    useState<SearchSummary | null>(
      null
    )

  const [
    leadRecords,
    setLeadRecords,
  ] =
    useState<
      Record<
        string,
        LeadRecord
      >
    >({})

  const [
    savingLeadDomain,
    setSavingLeadDomain,
  ] =
    useState<string | null>(
      null
    )

  const [
    leadSearchHistory,
    setLeadSearchHistory,
  ] =
    useState<
      LeadSearchHistoryEntry[]
    >([])

  const [
    showLeadSearchHistory,
    setShowLeadSearchHistory,
  ] =
    useState(false)

  const hotCount =
    useMemo(
      () =>
        results.filter(
          (lead) =>
            (
              lead.leadTemp ||
              ''
            ).toUpperCase() ===
            'HOT'
        ).length,

      [results]
    )

  const warmCount =
    useMemo(
      () =>
        results.filter(
          (lead) =>
            (
              lead.leadTemp ||
              ''
            ).toUpperCase() ===
            'WARM'
        ).length,

      [results]
    )
const rankedResults = useMemo(
  () =>
    [...results].sort(
      (a, b) =>
        (b.opportunityScore ?? 0) -
        (a.opportunityScore ?? 0)
    ),
  [results]
)
  // ===================================================
  // LOAD HISTORY
  // ===================================================

  const loadHistory =
    useCallback(() => {
      setLeadSearchHistory(
        getLeadSearchHistory()
      )
    }, [])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  // ===================================================
  // LOADING
  // ===================================================

  useEffect(() => {
    if (!isLoading) {
      return
    }

    const startedAt =
      Date.now()

    const timeInterval =
      window.setInterval(() => {
        const seconds =
          Math.floor(
            (
              Date.now() -
              startedAt
            ) / 1000
          )

        setElapsedTime(
          seconds
        )

        const nextStep =
          Math.min(
            Math.floor(
              seconds / 8
            ),
            LOADING_STEPS.length -
              1
          )

        setLoadingStep(
          nextStep
        )
      }, 1000)

    return () => {
      window.clearInterval(
        timeInterval
      )
    }
  }, [isLoading])

  // ===================================================
  // LEAD RECORDS
  // ===================================================

  function getLeadRecord(
    lead: Lead
  ): LeadRecord {
    const domain =
      getLeadDomain(lead)

    return (
      leadRecords[domain] || {
        status: 'New',
        notes: '',
        lastSavedAt: '',
        saveState:
          'idle',
      }
    )
  }

  function updateLeadRecord(
    lead: Lead,
    updates:
      Partial<LeadRecord>
  ) {
    const domain =
      getLeadDomain(lead)

    setLeadRecords(
      (previous) => ({
        ...previous,

        [domain]: {
          ...(previous[
            domain
          ] || {
            status: 'New',
            notes: '',
            lastSavedAt: '',
            saveState:
              'idle',
          }),

          ...updates,
        },
      })
    )
  }

  async function loadExistingLeadRecords(
    leadsToLoad: Lead[]
  ) {
    try {
      const domains =
        leadsToLoad
          .map(
            getLeadDomain
          )
          .filter(Boolean)

      if (!domains.length) {
        return
      }

      const response =
        await fetch(
          '/api/leads-by-domains',
          {
            method:
              'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify({
                domains,
              }),
          }
        )

      const data =
        await response.json()

      if (
        !response.ok ||
        !data.success
      ) {
        console.error(
          'Failed to load saved prospects',
          data.error
        )

        return
      }

      const nextRecords:
        Record<
          string,
          LeadRecord
        > = {}

      leadsToLoad.forEach(
        (lead) => {
          const domain =
            getLeadDomain(
              lead
            )

          nextRecords[domain] =
            {
              status: 'New',
              notes: '',
              lastSavedAt:
                '',
              saveState:
                'idle',
            }
        }
      )

      const stored =
        (data.leads ||
          []) as StoredLeadRow[]

      stored.forEach(
        (row) => {
          if (!row.domain) {
            return
          }

          nextRecords[
            row.domain
          ] = {
            status:
              (
                row.lead_status ||
                'New'
              ) as LeadStatus,

            notes:
              row.notes || '',

            lastSavedAt:
              row.updated_at ||
              '',

            saveState:
              'idle',
          }
        }
      )

      setLeadRecords(
        (previous) => ({
          ...previous,
          ...nextRecords,
        })
      )
    } catch (error) {
      console.error(
        'Failed to load saved prospects',
        error
      )
    }
  }

  async function saveLeadToSupabase(
    lead: Lead
  ) {
    const domain =
      getLeadDomain(lead)

    const record =
      getLeadRecord(lead)

    try {
      setSavingLeadDomain(
        domain
      )

      updateLeadRecord(
        lead,
        {
          saveState:
            'saving',
        }
      )

      const response =
        await fetch(
          '/api/update-lead',
          {
            method:
              'POST',

            headers: {
              'Content-Type':
                'application/json',

              'x-user-id':
                effectiveUserId,
            },

            body:
              JSON.stringify({
                domain,

                notes:
                  record.notes,

                leadStatus:
                  record.status,
              }),
          }
        )

      const data =
        await response.json()

      if (!response.ok) {
        throw new Error(
          data.error ||
            'Failed to save prospect'
        )
      }

      const savedAt =
        data?.lead
          ?.updated_at ||
        new Date().toISOString()

      setLeadRecords(
        (previous) => ({
          ...previous,

          [domain]: {
            ...(previous[
              domain
            ] || record),

            status:
              (
                data?.lead
                  ?.lead_status ||
                record.status
              ) as LeadStatus,

            notes:
              data?.lead
                ?.notes ??
              record.notes,

            lastSavedAt:
              savedAt,

            saveState:
              'saved',
          },
        })
      )

      window.setTimeout(
        () => {
          setLeadRecords(
            (previous) => ({
              ...previous,

              [domain]: {
                ...(previous[
                  domain
                ] ||
                  record),

                saveState:
                  'idle',
              },
            })
          )
        },
        1800
      )
    } catch (error) {
      console.error(error)

      updateLeadRecord(
        lead,
        {
          saveState:
            'error',
        }
      )
    } finally {
      setSavingLeadDomain(
        null
      )
    }
  }

  // ===================================================
  // SEARCH
  // ===================================================

  async function handleSearch(
    nextQuery: string,
    nextPreferences:
      LeadPreferences
  ) {
    try {
      setQuery(nextQuery)

      setPreferences(
        nextPreferences
      )

      setIsLoading(true)
      setLoadingStep(0)
      setElapsedTime(0)

      setResults([])
      setSummary(null)

      const response =
        await fetch(
          '/api/find-leads',
          {
            method:
              'POST',

            headers: {
              'Content-Type':
                'application/json',

              'x-user-id':
                effectiveUserId,
            },

            body:
              JSON.stringify({
                query:
                  nextQuery,

                preferences:
                  nextPreferences,
              }),
          }
        )

      const data =
        await response.json()

      if (!response.ok) {
        alert(
          data.error ||
            'Opportunity search failed'
        )

        return
      }

      const nextResults:
        Lead[] =
        data.leads || []

      setResults(
        nextResults
      )

      setSummary({
        query:
          data.query ||
          nextQuery,

        location:
          data.location ||
          '',

        totalFound:
          data.totalFound ||
          0,

        hotLeads:
          data.hotLeads ||
          0,

        warmLeads:
          data.warmLeads ||
          0,

        stats:
          data.stats,

        message:
          data.message,
      })

      saveLeadSearchToHistory(
  {
    query:
      data.query ||
      nextQuery,

    preferences:
      nextPreferences,

    totalFound:
            data.totalFound ||
            0,

          hotLeads:
            data.hotLeads ||
            0,

          warmLeads:
            data.warmLeads ||
            0,

          leads:
            nextResults,
        }
      )

      loadHistory()

      await loadExistingLeadRecords(
        nextResults
      )
    } catch (error) {
      console.error(
        error
      )

      alert(
        'Opportunity search failed'
      )
    } finally {
      setIsLoading(
        false
      )
    }
  }

  // ===================================================
  // SEARCH HISTORY ACTIONS
  // ===================================================

  function reopenLeadSearch(
    entry:
      LeadSearchHistoryEntry
  ) {
    setQuery(entry.query)
setPreferences({
  ...DEFAULT_LEAD_PREFERENCES,
  ...(entry.preferences || {}),

  selectedPlatforms:
    entry.preferences
      ?.selectedPlatforms
      ?.length
      ? entry.preferences
          .selectedPlatforms
      : [
          ...DEFAULT_LEAD_PREFERENCES.selectedPlatforms,
        ],
})
    setResults(
      entry.leads ||
        []
    )

    setSummary({
      query:
        entry.query,

      location: '',

      totalFound:
        entry.totalFound,

      hotLeads:
        entry.hotLeads,

      warmLeads:
        entry.warmLeads,

      message:
        'Reopened from past searches.',
    })

    void loadExistingLeadRecords(
      entry.leads ||
        []
    )
  }

  function handleClearLeadSearchHistory() {
    clearLeadSearchHistory()

    setLeadSearchHistory(
      []
    )
  }

  // ===================================================
  // UI
  // ===================================================

  return (
    <div className="space-y-5">
      {/* SEARCH + SUMMARY GROUP */}

      <section className="overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.025] shadow-[0_28px_80px_rgba(0,0,0,0.18)]">
        {/* SEARCH */}

        <div className="p-5 sm:p-6">
          <LeadFinderForm
            onSubmit={
              handleSearch
            }
            isLoading={
              isLoading
            }
            initialQuery={
              query
            }
            initialPreferences={
              preferences
            }
          />

          {isLoading && (
            <div className="mt-5 rounded-2xl border border-blue-500/10 bg-blue-500/[0.04] p-6">
              <div className="mx-auto max-w-md text-center">
                <div className="text-3xl">
                  {
                    LOADING_STEPS[
                      loadingStep
                    ].icon
                  }
                </div>

                <p className="mt-3 text-base font-semibold text-white">
                  {
                    LOADING_STEPS[
                      loadingStep
                    ].text
                  }
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  {elapsedTime}s
                  elapsed
                </p>

                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all duration-1000"
                    style={{
                      width: `${Math.min(
                        (
                          elapsedTime /
                          60
                        ) * 100,
                        95
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* CONNECTED SEARCH SUMMARY */}

        {summary &&
          !isLoading && (
            <div className="border-t border-white/[0.07] bg-black/15 p-5 sm:p-6">
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-300">
                    Search result
                  </p>

                  <h3 className="mt-1 text-2xl font-semibold text-white">
                    {
                      summary.query
                    }
                  </h3>

                  {summary.location && (
                    <p className="mt-1 text-sm text-slate-400">
                      📍{' '}
                      {
                        summary.location
                      }
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="min-w-[100px] rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-3 text-center">
                    <p className="text-2xl font-semibold text-white">
                      {
                        summary.totalFound
                      }
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      found
                    </p>
                  </div>

                  <div className="min-w-[100px] rounded-xl border border-emerald-500/15 bg-emerald-500/[0.04] px-4 py-3 text-center">
                    <p className="text-2xl font-semibold text-emerald-300">
                      {
                        hotCount
                      }
                    </p>

                    <p className="mt-1 text-xs text-emerald-300/70">
                      strong
                    </p>
                  </div>

                  <div className="min-w-[100px] rounded-xl border border-amber-500/15 bg-amber-500/[0.04] px-4 py-3 text-center">
                    <p className="text-2xl font-semibold text-amber-300">
                      {
                        warmCount
                      }
                    </p>

                    <p className="mt-1 text-xs text-amber-300/70">
                      research
                    </p>
                  </div>
                </div>
              </div>

              <p className="mt-4 border-t border-white/[0.06] pt-4 text-xs text-slate-500">
                Results ranked by
                website health and
                visible improvement
                opportunities.
              </p>
            </div>
          )}

        {/* HISTORY */}

        {!isLoading &&
          leadSearchHistory.length >
            0 && (
            <div className="border-t border-white/[0.07]">
              <button
                type="button"
                onClick={() =>
                  setShowLeadSearchHistory(
                    (
                      previous
                    ) =>
                      !previous
                  )
                }
                className="flex w-full items-center justify-between gap-4 px-5 py-3 text-left transition hover:bg-white/[0.025] sm:px-6"
              >
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Past searches
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Reopen without
                    running another
                    search
                  </p>
                </div>

                <span className="text-sm text-slate-500">
                  {
                    showLeadSearchHistory
                      ? '▲'
                      : '▼'
                  }
                </span>
              </button>

              {showLeadSearchHistory && (
                <div className="border-t border-white/[0.06] p-5 sm:p-6">
                  <div className="space-y-2">
                    {leadSearchHistory.map(
                      (
                        entry
                      ) => (
                        <div
                          key={
                            entry.id
                          }
                          className="flex flex-col gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <p className="text-sm font-medium text-white">
                              {
                                entry.query
                              }
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {new Date(
                                entry.searchedAt
                              ).toLocaleString()}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              reopenLeadSearch(
                                entry
                              )
                            }
                            className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs text-slate-300 hover:bg-white/[0.06]"
                          >
                            Reopen
                          </button>
                        </div>
                      )
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={
                      handleClearLeadSearchHistory
                    }
                    className="mt-4 text-xs text-rose-300 hover:text-rose-200"
                  >
                    Clear history
                  </button>
                </div>
              )}
            </div>
          )}
      </section>

      {/* RESULT LIST */}

{summary &&
  !isLoading &&
  rankedResults.length > 0 && (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4 px-1">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-300">
            Best prospects first
          </p>

          <h2 className="mt-1 text-2xl font-semibold text-white">
            Who should I call?
          </h2>
        </div>

        <p className="text-sm text-slate-400">
          {rankedResults.length} businesses
        </p>
      </div>

      {rankedResults.map(
        (lead, index) => {
          const domain =
            getLeadDomain(lead)

          const record =
            getLeadRecord(lead)

          const healthScore =
            getLeadOverallScore(lead)

          const opportunityScore =
            lead.opportunityScore ?? 0

          const issues =
            getIssueItems(lead)

          const platform =
            getLeadPlatform(lead)

          const temperature =
            (
              lead.leadTemp ||
              'COLD'
            ).toUpperCase()

          const priorityClasses =
            temperature === 'HOT'
              ? 'border-emerald-400/25 bg-emerald-500/[0.08] text-emerald-200'
              : temperature === 'WARM'
                ? 'border-amber-400/25 bg-amber-500/[0.08] text-amber-200'
                : 'border-white/[0.08] bg-white/[0.03] text-slate-300'

          return (
            <article
              key={getLeadId(lead)}
              className="overflow-hidden rounded-2xl border border-white/[0.09] bg-white/[0.025] shadow-[0_18px_50px_rgba(0,0,0,0.16)]"
            >
              <div className="grid lg:grid-cols-[90px_minmax(0,1fr)_210px]">
                {/* PRIORITY */}

                <div className="flex items-center gap-4 border-b border-white/[0.07] p-5 lg:flex-col lg:justify-center lg:border-b-0 lg:border-r lg:text-center">
                  <span className="text-sm font-semibold text-slate-500">
                    #{index + 1}
                  </span>

                  <div>
                    <p className="text-3xl font-semibold text-white">
                      {opportunityScore}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      opportunity
                    </p>
                  </div>
                </div>

                {/* BUSINESS */}

                <div className="p-5 sm:p-6">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-semibold ${priorityClasses}`}
                        >
                          {temperature === 'HOT'
                            ? 'Strong prospect'
                            : temperature === 'WARM'
                              ? 'Worth researching'
                              : 'Lower priority'}
                        </span>

                        <span className="rounded-full border border-violet-400/20 bg-violet-500/[0.07] px-3 py-1 text-xs text-violet-200">
                          {platform}
                        </span>

                        <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs text-slate-300">
                          Website health {healthScore}/100
                        </span>
                      </div>

                      <h3 className="mt-4 text-2xl font-semibold leading-tight text-white">
                        {lead.title}
                      </h3>

                      {lead.location && (
                        <p className="mt-2 text-base text-slate-400">
                          📍 {lead.location}
                        </p>
                      )}

                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        {lead.phone ? (
                          <a
                            href={`tel:${lead.phone}`}
                            className="inline-flex items-center rounded-xl border border-emerald-400/25 bg-emerald-500/[0.09] px-4 py-3 text-lg font-semibold text-emerald-200 transition hover:bg-emerald-500/[0.15]"
                          >
                            📞 {lead.phone}
                          </a>
                        ) : (
                          <span className="rounded-xl border border-rose-400/20 bg-rose-500/[0.07] px-4 py-3 text-sm text-rose-200">
                            No public phone found
                          </span>
                        )}

                        <a
                          href={lead.url}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-xl border border-white/[0.09] bg-white/[0.035] px-4 py-3 text-sm font-medium text-blue-300 transition hover:bg-white/[0.07] hover:text-blue-200"
                        >
                          Visit {domain} ↗
                        </a>
                      </div>

                      {(lead.rating ||
                        lead.reviews ||
                        lead.businessType) && (
                        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-400">
                          {lead.rating && (
                            <span>
                              ⭐ {lead.rating}
                              {lead.reviews
                                ? ` from ${lead.reviews} reviews`
                                : ''}
                            </span>
                          )}

                          {lead.businessType && (
                            <span>
                              {lead.businessType}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="mt-5">
                        <p className="text-sm font-semibold text-white">
                          Website issues spotted
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {issues.map(
                            (issue, issueIndex) => (
                              <span
                                key={`${issue}-${issueIndex}`}
                                className="rounded-lg border border-rose-400/15 bg-rose-500/[0.07] px-3 py-2 text-sm text-rose-100"
                              >
                                {issue}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ACTIONS */}

                <div className="border-t border-white/[0.07] bg-black/10 p-5 lg:border-l lg:border-t-0">
                  <button
                    type="button"
                    onClick={() =>
                      saveLeadToSupabase(
                        lead
                      )
                    }
                    disabled={
                      savingLeadDomain ===
                      domain
                    }
                    className="w-full rounded-xl bg-blue-600 px-4 py-3 text-base font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50"
                  >
                    {savingLeadDomain ===
                    domain
                      ? 'Saving...'
                      : 'Save Prospect'}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onRunFullAudit?.(
                        mapLeadToWorkspaceLead(
                          lead
                        )
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-white/[0.09] bg-white/[0.035] px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/[0.07]"
                  >
                    Run Full Audit
                  </button>

                  <label className="mt-5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Status
                  </label>

                  <select
                    value={record.status}
                    onChange={(event) => {
                      const nextStatus =
                        event.target
                          .value as LeadStatus

                      updateLeadRecord(
                        lead,
                        {
                          status:
                            nextStatus,

                          saveState:
                            'idle',
                        }
                      )
                    }}
                    className="mt-2 w-full rounded-xl border border-white/[0.08] bg-black/30 px-3 py-3 text-sm text-white outline-none"
                  >
                    {LEAD_STATUSES.map(
                      (status) => (
                        <option
                          key={status}
                          value={status}
                        >
                          {status}
                        </option>
                      )
                    )}
                  </select>

                  <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Notes
                  </label>

                  <textarea
                    rows={3}
                    value={record.notes}
                    onChange={(event) =>
                      updateLeadRecord(
                        lead,
                        {
                          notes:
                            event.target
                              .value,

                          saveState:
                            'idle',
                        }
                      )
                    }
                    onBlur={() =>
                      saveLeadToSupabase(
                        lead
                      )
                    }
                    placeholder="Add a quick note..."
                    className="mt-2 w-full resize-none rounded-xl border border-white/[0.08] bg-black/25 px-3 py-3 text-sm text-white outline-none placeholder:text-slate-600"
                  />

                  {record.saveState ===
                    'saved' && (
                    <p className="mt-2 text-sm text-emerald-300">
                      Saved
                    </p>
                  )}

                  {record.saveState ===
                    'error' && (
                    <p className="mt-2 text-sm text-rose-300">
                      Save failed
                    </p>
                  )}
                </div>
              </div>
            </article>
          )
        }
      )}
    </section>
  )}
    </div>
  )
}