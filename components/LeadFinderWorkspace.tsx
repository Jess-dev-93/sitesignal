'use client'

import { useEffect, useMemo, useState } from 'react'
import LeadFinderForm, { LeadPreferences } from './LeadFinderForm'
import CallListPanel from './CallListPanel'

const DEMO_USER_ID = 'demo-user'

const LOADING_STEPS = [
  { icon: '🔍', text: 'Searching Google for businesses...' },
  { icon: '🌏', text: 'Finding Australian business websites...' },
  { icon: '📊', text: 'Checking Quick Health...' },
  { icon: '🐌', text: 'Testing page speed...' },
  { icon: '🔎', text: 'Reviewing SEO issues...' },
  { icon: '🏆', text: 'Sorting the weakest websites first...' },
  { icon: '🎯', text: 'Almost done — preparing your leads...' },
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

type LeadStatus = (typeof LEAD_STATUSES)[number]

type WorkspaceLead = {
  title?: string
  url?: string
  domain?: string
  leadTemp?: string
  opportunityScore?: number
  estimatedValue?: string
  problems?: string[]
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
  opportunityScore?: number
  leadTemp?: string
  estimatedValue?: string
  problems?: string[]
  quick_issues?: string[]
  quick_health_score?: number
  suburb?: string
  location?: string
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

type CallListLead = {
  id: string
  business_name: string
  website_url: string
  display_url?: string
  snippet?: string
  industry?: string
  location?: string
  quick_health_score?: number
  opportunity_score?: number
  lead_temperature?: string
  lead_status?: string
  quick_issues?: string[]
  suburb?: string
  notes?: string
}

type CallListItem = {
  id: string
  status: string
  priority?: number
  note?: string
  follow_up_date?: string
  reminder_note?: string
  leads: CallListLead | null
}

type LeadRecord = {
  status: LeadStatus
  notes: string
  lastSavedAt?: string
  saveState?: 'idle' | 'saving' | 'saved' | 'error'
}

type LeadSearchHistoryEntry = {
  id: string
  query: string
  totalFound: number
  hotLeads: number
  warmLeads: number
  leads: Lead[]
  searchedAt: string
}

interface LeadFinderWorkspaceProps {
  userId?: string | null
  onRunFullAudit?: (lead: WorkspaceLead) => void
  onStartAuditedOutreach?: (lead: WorkspaceLead) => void
  onOpenManualOutreach?: (lead: WorkspaceLead) => void
}

function normaliseLeadForApi(lead: Lead, query: string) {
  return {
    business_name: lead.title,
    website_url: lead.url,
    search_query: query,
    industry: query,
    location: lead.location || '',
    quick_health_score: getLeadOverallScore(lead),
    opportunity_score: lead.opportunityScore ?? 0,
    lead_temperature: (lead.leadTemp || 'NEW').toLowerCase(),
    quick_issues: lead.quick_issues || lead.problems || [],
    metadata: {
      displayUrl: lead.displayUrl || '',
      snippet: lead.snippet || '',
      estimatedValue: lead.estimatedValue || '',
      scores: lead.scores || {},
      signals: lead.signals || {},
      location: lead.location || '',
      domain: lead.domain || '',
    },
  }
}

function getLeadOverallScore(lead: Lead): number {
  return lead.quick_health_score ?? lead.scores?.overall ?? 0
}

function getLeadPerformanceScore(lead: Lead): number | undefined {
  return lead.scores?.performance ?? undefined
}

function getLeadSeoScore(lead: Lead): number | undefined {
  return lead.scores?.seo ?? undefined
}

function getLeadAccessibilityScore(lead: Lead): number | undefined {
  return lead.scores?.accessibility ?? undefined
}

function getLeadBestPracticesScore(lead: Lead): number | undefined {
  return lead.scores?.bestPractices ?? undefined
}

function mapLeadToWorkspaceLead(lead: Lead): WorkspaceLead {
  return {
    title: lead.title,
    url: lead.url,
    domain: lead.domain,
    leadTemp: lead.leadTemp,
    opportunityScore: lead.opportunityScore,
    estimatedValue: lead.estimatedValue,
    problems: lead.problems || lead.quick_issues || [],
    scores: {
      overall: getLeadOverallScore(lead),
      mobile: {
        performance: getLeadPerformanceScore(lead),
        seo: getLeadSeoScore(lead),
        accessibility: getLeadAccessibilityScore(lead),
        bestPractices: getLeadBestPracticesScore(lead),
      },
      desktop: {
        performance: undefined,
      },
    },
  }
}

function getTempClasses(temp?: string) {
  const t = (temp || '').toLowerCase()
  if (t === 'hot') return 'border-red-400/20 bg-red-500/10 text-red-200'
  if (t === 'warm') return 'border-amber-400/20 bg-amber-500/10 text-amber-200'
  return 'border-white/[0.10] bg-white/[0.05] text-slate-300'
}

function getStatusStyles(status: string): string {
  const map: Record<string, string> = {
    New: 'bg-slate-100 text-slate-700 border-slate-200',
    'Not Contacted': 'bg-amber-50 text-amber-700 border-amber-200',
    Contacted: 'bg-blue-50 text-blue-700 border-blue-200',
    Replied: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'Meeting Booked': 'bg-purple-50 text-purple-700 border-purple-200',
    Won: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Lost: 'bg-rose-50 text-rose-700 border-rose-200',
  }

  return map[status] ?? 'bg-slate-100 text-slate-700 border-slate-200'
}

function getLeadId(lead: Lead): string {
  return lead.url || lead.domain || lead.title
}

function getLeadDomain(lead: Lead): string {
  if (lead.domain) return lead.domain
  try {
    return new URL(lead.url).hostname.replace(/^www\./, '')
  } catch {
    return lead.url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
  }
}

function saveLeadSearchToHistory(searchData: {
  query: string
  totalFound: number
  hotLeads: number
  warmLeads: number
  leads: Lead[]
}) {
  try {
    const existing = JSON.parse(
      localStorage.getItem('siteSignalLeadSearchHistory') || '[]'
    ) as LeadSearchHistoryEntry[]

    const entry: LeadSearchHistoryEntry = {
      id:
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `search-${Date.now()}`,
      query: searchData.query,
      totalFound: searchData.totalFound,
      hotLeads: searchData.hotLeads,
      warmLeads: searchData.warmLeads,
      leads: searchData.leads,
      searchedAt: new Date().toISOString(),
    }

    const updated = [entry, ...existing.filter((x) => x.query !== entry.query)].slice(0, 200)
    localStorage.setItem('siteSignalLeadSearchHistory', JSON.stringify(updated))
    return entry
  } catch {
    return null
  }
}

function getLeadSearchHistory(): LeadSearchHistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem('siteSignalLeadSearchHistory') || '[]')
  } catch {
    return []
  }
}

function clearLeadSearchHistory() {
  localStorage.removeItem('siteSignalLeadSearchHistory')
}

function formatLastSaved(date?: string) {
  if (!date) return ''
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString()
}

function getSignalsSummary(lead: Lead): string[] {
  const items: string[] = []

  if (lead.scores?.hasMetaDescription === false) {
    items.push('Missing meta description')
  }

  if (lead.scores?.hasViewport === false) {
    items.push('Mobile viewport issues')
  }

  if (lead.signals?.hasContactPage === false) {
    items.push('No clear contact page')
  }

  if (lead.signals?.hasEmail === false) {
    items.push('No email found')
  }

  if (lead.signals?.hasPhone === false) {
    items.push('No phone number found')
  }

  if (lead.signals?.hasForm === false) {
    items.push('No contact form found')
  }

  if (lead.signals?.hasSocialLinks === false) {
    items.push('No social links found')
  }

  return items
}

function getWhyLeadText(lead: Lead): string {
  const issues = lead.problems?.length
    ? lead.problems
    : lead.quick_issues?.length
      ? lead.quick_issues
      : getSignalsSummary(lead)

  if (!issues.length) {
    return 'General website improvement opportunity.'
  }

  return issues.slice(0, 3).join(', ')
}

export default function LeadFinderWorkspace({
  userId,
  onRunFullAudit,
  onStartAuditedOutreach,
  onOpenManualOutreach,
}: LeadFinderWorkspaceProps) {
  const effectiveUserId = userId || DEMO_USER_ID

  const [query, setQuery] = useState('Plumbers Sydney')
  const [preferences, setPreferences] = useState<LeadPreferences>({
    preferLowReview: true,
    preferOuterMetro: false,
    excludePolishedSites: true,
    prioritizeContactMobileIssues: true,
  })

  const [isLoading, setIsLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)
  const [elapsedTime, setElapsedTime] = useState(0)

  const [results, setResults] = useState<Lead[]>([])
  const [summary, setSummary] = useState<SearchSummary | null>(null)

  const [callListItems, setCallListItems] = useState<CallListItem[]>([])
  const [loadingCallList, setLoadingCallList] = useState(false)

  const [queuedUrls, setQueuedUrls] = useState<Record<string, boolean>>({})

  const [leadRecords, setLeadRecords] = useState<Record<string, LeadRecord>>({})
  const [savingLeadDomain, setSavingLeadDomain] = useState<string | null>(null)
  const [saveLeadMessage, setSaveLeadMessage] = useState<Record<string, string>>({})

  const [leadSearchHistory, setLeadSearchHistory] = useState<LeadSearchHistoryEntry[]>([])
  const [showLeadSearchHistory, setShowLeadSearchHistory] = useState(true)

  const hotCount = useMemo(
    () => results.filter((r) => (r.leadTemp || '').toUpperCase() === 'HOT').length,
    [results]
  )

  const warmCount = useMemo(
    () => results.filter((r) => (r.leadTemp || '').toUpperCase() === 'WARM').length,
    [results]
  )

  useEffect(() => {
    fetchCallList()
    setLeadSearchHistory(getLeadSearchHistory())
  }, [effectiveUserId])

  useEffect(() => {
    if (!isLoading) {
      setLoadingStep(0)
      setElapsedTime(0)
      return
    }

    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev))
    }, 8000)

    const timeInterval = setInterval(() => {
      setElapsedTime((prev) => prev + 1)
    }, 1000)

    return () => {
      clearInterval(stepInterval)
      clearInterval(timeInterval)
    }
  }, [isLoading])

  useEffect(() => {
    const nextQueued: Record<string, boolean> = {}
    callListItems.forEach((item) => {
      const url = item?.leads?.website_url
      if (url) nextQueued[url] = true
    })
    setQueuedUrls(nextQueued)
  }, [callListItems])

  useEffect(() => {
    if (!results.length) return

    const nextRecords: Record<string, LeadRecord> = {}
    results.forEach((lead) => {
      const domain = getLeadDomain(lead)
      nextRecords[domain] = leadRecords[domain] || {
        status: 'New',
        notes: '',
        lastSavedAt: '',
        saveState: 'idle',
      }
    })

    setLeadRecords((prev) => ({
      ...nextRecords,
      ...prev,
    }))
  }, [results])

  async function fetchCallList() {
    try {
      setLoadingCallList(true)
      const res = await fetch('/api/call-list', {
        headers: { 'x-user-id': effectiveUserId },
      })
      const data = await res.json()
      setCallListItems(data.items || [])
    } catch (error) {
      console.error('Failed to fetch call list', error)
    } finally {
      setLoadingCallList(false)
    }
  }

  async function handleSearch(nextQuery: string, nextPreferences: LeadPreferences) {
    try {
      setQuery(nextQuery)
      setPreferences(nextPreferences)
      setIsLoading(true)
      setResults([])
      setSummary(null)

      const res = await fetch('/api/find-leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': effectiveUserId,
        },
        body: JSON.stringify({ query: nextQuery, preferences: nextPreferences }),
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.error || 'Lead search failed')
        return
      }

      const nextResults = data.leads || []

      setResults(nextResults)
      setSummary({
        query: data.query,
        location: data.location,
        totalFound: data.totalFound,
        hotLeads: data.hotLeads,
        warmLeads: data.warmLeads,
        stats: data.stats,
        message: data.message,
      })

      saveLeadSearchToHistory({
        query: data.query,
        totalFound: data.totalFound || 0,
        hotLeads: data.hotLeads || 0,
        warmLeads: data.warmLeads || 0,
        leads: nextResults,
      })

      setLeadSearchHistory(getLeadSearchHistory())
      await loadExistingLeadRecords(nextResults)
    } catch (error) {
      console.error(error)
      alert('Lead search failed')
    } finally {
      setIsLoading(false)
    }
  }

  async function saveServerSearchHistory(payload: any) {
  try {
    await fetch('/api/lead-search-history', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': effectiveUserId,
      },
      body: JSON.stringify(payload),
    })
  } catch (e) {
    console.error('Failed to save server search history', e)
  }
}

function exportLeadSearchHistory() {
  const data = localStorage.getItem('siteSignalLeadSearchHistory') || '[]'
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'lead-search-history.json'
  a.click()
  URL.revokeObjectURL(url)
}

async function importLeadSearchHistory(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0]
  if (!file) return
  const text = await file.text()

  let incoming: any[] = []
  try {
    incoming = JSON.parse(text)
  } catch {
    alert('Invalid JSON file')
    return
  }

  const existing = JSON.parse(
    localStorage.getItem('siteSignalLeadSearchHistory') || '[]'
  ) as any[]

  const merged = [...incoming, ...existing]
    .filter((x) => x && x.query)
    .reduce((acc, item) => {
      // dedupe by query
      if (!acc.some((x: any) => x.query === item.query)) acc.push(item)
      return acc
    }, [] as any[])
    .slice(0, 200)

  localStorage.setItem('siteSignalLeadSearchHistory', JSON.stringify(merged))
  setLeadSearchHistory(merged as any)
  e.target.value = ''
}

  async function loadExistingLeadRecords(leadsToLoad: Lead[]) {
    try {
      const domains = leadsToLoad.map((lead) => getLeadDomain(lead)).filter(Boolean)
      if (!domains.length) return

      const res = await fetch('/api/leads-by-domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domains }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        console.error('Failed to hydrate lead records', data.error)
        return
      }

      const nextRecords: Record<string, LeadRecord> = {}

      leadsToLoad.forEach((lead) => {
        const domain = getLeadDomain(lead)
        nextRecords[domain] = {
          status: 'New',
          notes: '',
          lastSavedAt: '',
          saveState: 'idle',
        }
      })

      ;(data.leads || []).forEach((row: any) => {
        if (!row?.domain) return
        nextRecords[row.domain] = {
          status: (row.lead_status || 'New') as LeadStatus,
          notes: row.notes || '',
          lastSavedAt: row.updated_at || '',
          saveState: 'idle',
        }
      })

      setLeadRecords((prev) => ({ ...prev, ...nextRecords }))
    } catch (error) {
      console.error('Failed to load existing lead records', error)
    }
  }

  function reopenLeadSearch(entry: LeadSearchHistoryEntry) {
    setQuery(entry.query)
    setResults(entry.leads || [])
    setSummary({
      query: entry.query,
      location: '',
      totalFound: entry.totalFound,
      hotLeads: entry.hotLeads,
      warmLeads: entry.warmLeads,
      stats: undefined,
      message: 'Reopened from past searches.',
    })
    loadExistingLeadRecords(entry.leads || [])
  }

  function handleClearLeadSearchHistory() {
    clearLeadSearchHistory()
    setLeadSearchHistory([])
  }

  function getLeadRecord(lead: Lead): LeadRecord {
    const domain = getLeadDomain(lead)
    return (
      leadRecords[domain] || {
        status: 'New',
        notes: '',
        lastSavedAt: '',
        saveState: 'idle',
      }
    )
  }

  function updateLeadRecord(lead: Lead, updates: Partial<LeadRecord>) {
    const domain = getLeadDomain(lead)
    setLeadRecords((prev) => ({
      ...prev,
      [domain]: {
        ...(prev[domain] || {
          status: 'New',
          notes: '',
          lastSavedAt: '',
          saveState: 'idle',
        }),
        ...updates,
      },
    }))
  }

  async function saveLeadToSupabase(lead: Lead) {
    const domain = getLeadDomain(lead)
    const record = getLeadRecord(lead)

    try {
      setSavingLeadDomain(domain)
      updateLeadRecord(lead, { saveState: 'saving' })

      const res = await fetch('/api/update-lead', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': effectiveUserId,
        },
        body: JSON.stringify({
          domain,
          notes: record.notes,
          leadStatus: record.status,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save lead')

      const savedAt = data?.lead?.updated_at || new Date().toISOString()

      setLeadRecords((prev) => ({
        ...prev,
        [domain]: {
          ...(prev[domain] || { status: 'New', notes: '' }),
          status: (data?.lead?.lead_status || record.status) as LeadStatus,
          notes: data?.lead?.notes ?? record.notes,
          lastSavedAt: savedAt,
          saveState: 'saved',
        },
      }))

      setSaveLeadMessage((prev) => ({ ...prev, [domain]: 'Saved' }))

      setTimeout(() => {
        setLeadRecords((prev) => ({
          ...prev,
          [domain]: { ...(prev[domain] || record), saveState: 'idle' },
        }))
        setSaveLeadMessage((prev) => ({ ...prev, [domain]: '' }))
      }, 2000)
    } catch (error) {
      console.error(error)
      setLeadRecords((prev) => ({
        ...prev,
        [domain]: { ...(prev[domain] || record), saveState: 'error' },
      }))
      setSaveLeadMessage((prev) => ({ ...prev, [domain]: 'Save failed' }))
    } finally {
      setSavingLeadDomain(null)
    }
  }
async function filterOutWorkedLeads(sites) {
  if (!sites.length) return []

  const domains = sites.map((site) => site.domain)

  const { data, error } = await supabaseAdmin
    .from('leads')
    .select('domain, lead_status')
    .in('domain', domains)

  if (error) {
    console.error('❌ Supabase filter error:', error)
    return sites
  }

  const skipStatuses = new Set(['Contacted', 'Won', 'Lost'])
  const workedDomains = new Set(
    (data || [])
      .filter((row) => skipStatuses.has(row.lead_status))
      .map((row) => row.domain)
  )

  const filteredSites = sites.filter((site) => !workedDomains.has(site.domain))

  console.log(`🚫 Skipped worked leads: ${sites.length - filteredSites.length}`)
  console.log(`✅ Remaining candidates: ${filteredSites.length}`)

  return filteredSites
}
  async function addToCallList(lead: Lead) {
    try {
      const payloadLead = normaliseLeadForApi(lead, query)

      const res = await fetch('/api/call-list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': effectiveUserId,
        },
        body: JSON.stringify({ lead: payloadLead }),
      })

      const data = await res.json()
      if (!res.ok) {
        alert(data.error || 'Failed to add to call list')
        return
      }

      setQueuedUrls((prev) => ({ ...prev, [lead.url]: true }))
      await fetchCallList()
    } catch (error) {
      console.error(error)
      alert('Failed to add to call list')
    }
  }

  async function removeCallListItem(id: string) {
    try {
      const item = callListItems.find((x) => x.id === id)
      const url = item?.leads?.website_url

      const res = await fetch(`/api/call-list/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-id': effectiveUserId },
      })

      const data = await res.json()
      if (!res.ok) {
        alert(data.error || 'Failed to remove item')
        return
      }

      if (url) {
        setQueuedUrls((prev) => {
          const next = { ...prev }
          delete next[url]
          return next
        })
      }

      await fetchCallList()
    } catch (error) {
      console.error(error)
      alert('Failed to remove item')
    }
  }

  async function updateCallListStatus(id: string, status: string) {
    try {
      const res = await fetch(`/api/call-list/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': effectiveUserId,
        },
        body: JSON.stringify({ status }),
      })

      const data = await res.json()
      if (!res.ok) {
        alert(data.error || 'Failed to update status')
        return
      }

      await fetchCallList()
    } catch (error) {
      console.error(error)
      alert('Failed to update status')
    }
  }

  async function updateCallListReminder(
    id: string,
    followUpDate: string,
    reminderNote: string
  ) {
    try {
      const res = await fetch(`/api/call-list/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': effectiveUserId,
        },
        body: JSON.stringify({
          follow_up_date: followUpDate || null,
          reminder_note: reminderNote || '',
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        alert(data.error || 'Failed to update reminder')
        return
      }

      await fetchCallList()
    } catch (error) {
      console.error(error)
      alert('Failed to update reminder')
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-white/[0.08] bg-[#1b2545]/90 shadow-[0_20px_80px_rgba(2,6,23,0.35)] backdrop-blur">
        <div className="flex flex-col gap-4 border-b border-white/[0.06] px-6 py-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
              <span>🎯</span>
              Lead Finder
            </div>
            <h2 className="text-2xl font-semibold text-white">
              Find the weakest websites in your market
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Search by industry and location, then move into audit, outreach or your call list.
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-slate-300">
            {results.length} opportunities found
          </div>
        </div>

        <div className="px-6 py-6">
          <LeadFinderForm
            onSubmit={handleSearch}
            isLoading={isLoading}
            initialQuery={query}
            initialPreferences={preferences}
          />

          {isLoading && (
            <div className="mt-5 rounded-2xl border border-blue-500/20 bg-blue-500/[0.06] p-5 sm:p-7">
              <div className="mx-auto max-w-md text-center">
                <div className="mb-3 animate-bounce text-4xl">
                  {LOADING_STEPS[loadingStep].icon}
                </div>
                <p className="mb-1 text-base font-bold text-blue-300 sm:text-lg">
                  {LOADING_STEPS[loadingStep].text}
                </p>
                <p className="mb-4 text-sm text-blue-400">
                  ⏱ {elapsedTime}s elapsed — typically takes 45–60 seconds
                </p>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.08]">
                  <div
                    className="h-2 rounded-full bg-blue-500 transition-all duration-1000"
                    style={{ width: `${Math.min((elapsedTime / 60) * 100, 95)}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {!isLoading && leadSearchHistory.length > 0 && (
            <div className="mt-5 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.04]">
              <button
                type="button"
                onClick={() => setShowLeadSearchHistory((prev) => !prev)}
                className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-white/[0.03]"
              >
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Past Searches
                  </p>
                  <p className="mt-1 text-sm text-slate-300">
                    Reopen a previous lead search without searching again
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full border border-white/[0.10] bg-white/[0.04] px-2.5 py-1 text-xs font-semibold text-slate-300">
                    {leadSearchHistory.length}
                  </span>
                  <span className="text-slate-400">{showLeadSearchHistory ? '▲' : '▼'}</span>
                </div>
              </button>

              {showLeadSearchHistory && (
                <div className="border-t border-white/[0.07] px-4 py-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs text-slate-500">Your most recent lead finder runs</p>
                    <button
                      onClick={handleClearLeadSearchHistory}
                      className="text-xs font-semibold text-rose-300 transition hover:text-rose-200"
                    >
                      Clear history
                    </button>
                  </div>
                  <button
  onClick={exportLeadSearchHistory}
  className="text-xs font-semibold text-blue-300 transition hover:text-blue-200"
>
  Export
</button>

<label className="text-xs font-semibold text-blue-300 transition hover:text-blue-200 cursor-pointer">
  Import
  <input type="file" accept="application/json" className="hidden" onChange={importLeadSearchHistory} />
</label>

                  <div className="space-y-2">
                    {leadSearchHistory.map((entry) => (
                      <div
                        key={entry.id}
                        className="rounded-xl border border-white/[0.08] bg-slate-950/30 p-3"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-white">
                              {entry.query}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {new Date(entry.searchedAt).toLocaleString()}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              <span className="rounded-full border border-blue-500/20 bg-blue-500/[0.08] px-2 py-0.5 text-xs font-medium text-blue-300">
                                {entry.totalFound} found
                              </span>
                              <span className="rounded-full border border-rose-500/20 bg-rose-500/[0.08] px-2 py-0.5 text-xs font-medium text-rose-300">
                                {entry.hotLeads} hot
                              </span>
                              <span className="rounded-full border border-amber-500/20 bg-amber-500/[0.08] px-2 py-0.5 text-xs font-medium text-amber-300">
                                {entry.warmLeads} warm
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => reopenLeadSearch(entry)}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.10] bg-white/[0.05] px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
                          >
                            <span>📂</span>
                            Reopen Search
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {summary && !isLoading && (
        <>
          <section className="rounded-[24px] border border-white/[0.08] bg-[#1b2545]/90 p-5">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Search Summary
                </div>
                <div className="mt-2 text-sm text-white">
                  {summary.location || 'Search complete'}
                </div>
                <div className="mt-1 text-xs text-slate-400">{summary.query}</div>
              </div>

              <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-200/70">
                  Websites Found
                </div>
                <div className="mt-2 text-3xl font-semibold text-blue-200">
                  {summary.totalFound}
                </div>
              </div>

              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-red-200/70">
                  Hot Leads
                </div>
                <div className="mt-2 text-3xl font-semibold text-red-200">
                  {summary.hotLeads}
                </div>
              </div>

              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-200/70">
                  Warm Leads
                </div>
                <div className="mt-2 text-3xl font-semibold text-amber-200">
                  {summary.warmLeads}
                </div>
              </div>
            </div>

            {summary.stats && (
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-white/[0.05] px-3 py-1 text-slate-300">
                  Found {summary.stats?.candidatesFound || 0}
                </span>
                <span className="rounded-full bg-white/[0.05] px-3 py-1 text-slate-300">
                  Tried {summary.stats?.candidatesTried || 0}
                </span>
                <span className="rounded-full bg-white/[0.05] px-3 py-1 text-slate-300">
                  Scanned {summary.stats?.scannedCount || 0}
                </span>
                <span className="rounded-full bg-amber-500/10 px-3 py-1 text-amber-200">
                  Healthy skipped {summary.stats?.skippedHealthyCount || 0}
                </span>
                <span className="rounded-full bg-rose-500/10 px-3 py-1 text-rose-200">
                  Fetch failures {summary.stats?.failedFetchCount || 0}
                </span>
              </div>
            )}

            {summary.message && (
              <p className="mt-4 text-sm text-slate-400">{summary.message}</p>
            )}
          </section>

          <section className="rounded-[24px] border border-white/[0.08] bg-[#1b2545]/90 p-5">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/[0.05] px-3 py-1 text-xs text-white/80">
                Total: {results.length}
              </span>
              <span className="rounded-full bg-red-500/15 px-3 py-1 text-xs text-red-200">
                Hot: {hotCount}
              </span>
              <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs text-amber-200">
                Warm: {warmCount}
              </span>
            </div>

            <div className="space-y-5">
              {results.map((lead) => {
                const record = getLeadRecord(lead)
                const domain = getLeadDomain(lead)
                const issueChips = lead.problems?.length
                  ? lead.problems
                  : lead.quick_issues?.length
                    ? lead.quick_issues
                    : getSignalsSummary(lead)

                return (
                  <article
                    key={getLeadId(lead)}
                    className="rounded-[24px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.02))] p-5 shadow-[0_18px_50px_rgba(2,6,23,0.18)]"
                  >
                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_260px]">
                      <div className="min-w-0">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-medium ${getTempClasses(lead.leadTemp)}`}
                          >
                            {(lead.leadTemp || 'NEW').toUpperCase()}
                          </span>

                          <span
                            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${getStatusStyles(record.status)}`}
                          >
                            {record.status}
                          </span>

                          {lead.location && (
                            <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-xs font-medium text-slate-300">
                              {lead.location}
                            </span>
                          )}
                        </div>

                        <h3 className="text-[30px] font-semibold leading-tight text-white">
                          {lead.title}
                        </h3>

                        <a
                          href={lead.url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-block break-all text-sm text-blue-300 transition hover:text-blue-200"
                        >
                          {lead.url}
                        </a>

                        {!!issueChips.length && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {issueChips.slice(0, 5).map((problem) => (
                              <span
                                key={problem}
                                className="rounded-full border border-rose-500/15 bg-rose-500/10 px-2.5 py-1 text-xs text-rose-200"
                              >
                                {problem}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="mt-4 rounded-2xl border border-white/[0.08] bg-[#223157]/55 p-4">
                          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                            Why this is a lead
                          </p>
                          <p className="text-sm leading-6 text-slate-300">
                            Possible website issues: {getWhyLeadText(lead)}
                          </p>
                        </div>

                        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                          <div>
                            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                              Notes
                            </label>
                            <textarea
                              rows={4}
                              value={record.notes}
                              onChange={(e) =>
                                updateLeadRecord(lead, {
                                  notes: e.target.value,
                                  saveState: 'idle',
                                })
                              }
                              onBlur={() => saveLeadToSupabase(lead)}
                              className="min-h-[140px] w-full rounded-2xl border border-white/[0.08] bg-slate-950/50 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
                              placeholder="Add notes here..."
                            />
                          </div>

                          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
                            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                              Lead Status
                            </label>

                            <select
                              value={record.status}
                              onChange={(e) => {
                                updateLeadRecord(lead, {
                                  status: e.target.value as LeadStatus,
                                  saveState: 'idle',
                                })
                                setTimeout(() => saveLeadToSupabase(lead), 0)
                              }}
                              className="w-full rounded-xl border border-white/[0.08] bg-slate-950/50 px-4 py-3 text-sm text-white outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
                            >
                              {LEAD_STATUSES.map((status) => (
                                <option key={status} value={status}>
                                  {status}
                                </option>
                              ))}
                            </select>

                            <div className="mt-3 min-h-[40px]">
                              {record.saveState === 'saving' && (
                                <p className="text-xs text-blue-300">Saving...</p>
                              )}
                              {record.saveState === 'saved' && (
                                <p className="text-xs text-emerald-300">
                                  Saved
                                  {record.lastSavedAt
                                    ? ` • ${formatLastSaved(record.lastSavedAt)}`
                                    : ''}
                                </p>
                              )}
                              {record.saveState === 'error' && (
                                <p className="text-xs text-rose-300">Save failed</p>
                              )}
                              {record.saveState === 'idle' && !saveLeadMessage[domain] && (
                                <p className="text-xs leading-5 text-slate-500">
                                  Notes auto-save on blur. Status saves immediately.
                                </p>
                              )}
                            </div>

                            <button
                              onClick={() => saveLeadToSupabase(lead)}
                              disabled={savingLeadDomain === domain}
                              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.10] bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/[0.08] disabled:opacity-50"
                            >
                              {savingLeadDomain === domain ? 'Saving...' : 'Save Lead'}
                            </button>
                          </div>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-3">
                          <button
                            onClick={() => onRunFullAudit?.(mapLeadToWorkspaceLead(lead))}
                            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
                          >
                            Audit Website
                          </button>

                          {onOpenManualOutreach && (
                            <button
                              onClick={() => onOpenManualOutreach(mapLeadToWorkspaceLead(lead))}
                              className="rounded-xl border border-white/[0.10] bg-white/[0.04] px-5 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/[0.08]"
                            >
                              Manual Outreach
                            </button>
                          )}

                          <button
                            onClick={() => addToCallList(lead)}
                            disabled={!!queuedUrls[lead.url]}
                            className={`rounded-xl border px-5 py-3 text-sm font-medium transition ${
                              queuedUrls[lead.url]
                                ? 'border-blue-400/30 bg-blue-500/10 text-blue-200'
                                : 'border-white/[0.10] bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]'
                            }`}
                          >
                            {queuedUrls[lead.url] ? '✓ Added to Call List' : 'Add to Call List'}
                          </button>

                          <a
                            href={lead.url}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-xl border border-white/[0.10] bg-white/[0.04] px-5 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/[0.08]"
                          >
                            Visit Website
                          </a>
                        </div>
                      </div>

                      <aside className="w-full">
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                          <div className="rounded-2xl border border-amber-400/15 bg-amber-500/[0.06] p-4">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-200/80">
                              Quick Health
                            </p>
                            <p className="mt-2 text-4xl font-semibold text-amber-200">
                              {getLeadOverallScore(lead)}
                              <span className="text-base text-amber-200/70">/100</span>
                            </p>
                          </div>

                          <div className="rounded-2xl border border-blue-400/15 bg-blue-500/[0.06] p-4">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-200/80">
                              Opportunity Score
                            </p>
                            <p className="mt-2 text-4xl font-semibold text-blue-200">
                              {lead.opportunityScore ?? 0}
                              <span className="text-base text-blue-200/70">/100</span>
                            </p>
                          </div>

                          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                              Estimated Value
                            </p>
                            <p className="mt-2 text-sm font-medium text-white">
                              {lead.estimatedValue || '\$1,500 - \$3,000'}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                              Signals
                            </p>
                            <div className="mt-3 space-y-2 text-xs text-slate-300">
                              <div>HTTPS: {lead.scores?.isHttps ? 'Yes' : 'No'}</div>
                              <div>
                                Meta description:{' '}
                                {lead.scores?.hasMetaDescription ? 'Yes' : 'No'}
                              </div>
                              <div>
                                Mobile viewport:{' '}
                                {lead.scores?.hasViewport ? 'Yes' : 'No'}
                              </div>
                              <div>Load time: {lead.scores?.loadTime || 'Unknown'}</div>
                            </div>
                          </div>
                        </div>
                      </aside>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        </>
      )}
    </div>
  )
}