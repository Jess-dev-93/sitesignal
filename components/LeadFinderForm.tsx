'use client'

import { useState } from 'react'

export type LeadPreferences = {
  preferLowReview: boolean
  preferOuterMetro: boolean
  excludePolishedSites: boolean
  prioritizeContactMobileIssues: boolean
}

const EXAMPLE_SEARCHES = [
  'Plumbers Sydney',
  'Dentists Melbourne',
  'Cafes Brisbane',
  'Lawyers Perth',
  'Electricians Sydney',
  'Gyms Sydney',
]

interface Props {
  onSubmit: (query: string, preferences: LeadPreferences) => void
  isLoading: boolean
  initialQuery?: string
  initialPreferences?: LeadPreferences
}

export default function LeadFinderForm({
  onSubmit,
  isLoading,
  initialQuery = '',
  initialPreferences,
}: Props) {
  const [query, setQuery] = useState(initialQuery)
  const [preferences, setPreferences] = useState<LeadPreferences>(
    initialPreferences || {
      preferLowReview: true,
      preferOuterMetro: false,
      excludePolishedSites: true,
      prioritizeContactMobileIssues: true,
    }
  )

  const handleSubmit = () => {
    if (!query.trim()) return
    onSubmit(query, preferences)
  }

  return (
    <div>
      {/* Label — matches "WEBSITE URL" in AuditForm */}
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Industry &amp; Location
      </p>

      {/* Input row */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <span
            aria-hidden="true"
            className="absolute -translate-y-1/2 pointer-events-none left-4 top-1/2 text-muted-foreground"
          >
            🔎
          </span>

          <label htmlFor="lead-search" className="sr-only">
            Search by industry and location
          </label>

          <input
            id="lead-search"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="e.g. plumbers Sydney, dentists Melbourne..."
            disabled={isLoading}
            autoComplete="off"
            className="w-full rounded-xl border border-border bg-input py-3 pl-11 pr-4 text-sm text-white shadow-sm outline-none transition placeholder:text-muted-foreground focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 disabled:opacity-50"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={isLoading || !query.trim()}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(37,99,235,0.22)] transition hover:bg-blue-500 hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 sm:w-auto"
        >
          {isLoading ? (
            <>
              <svg aria-hidden="true" className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Searching...
            </>
          ) : (
            <>
              <span aria-hidden="true">🎯</span>
              Find Leads
            </>
          )}
        </button>
      </div>

      {/* Preferences */}
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {(
          [
            {
              key: 'preferLowReview',
              label: 'Prefer low-review businesses',
              help: 'Surfaces businesses with weaker online proof (often easier wins).',
            },
            {
              key: 'excludePolishedSites',
              label: 'Exclude polished websites',
              help: 'Focus on underperforming sites (better opportunity).',
            },
            {
              key: 'prioritizeContactMobileIssues',
              label: 'Prioritise contact + mobile issues',
              help: 'Weight leads with conversion blockers higher.',
            },
            {
              key: 'preferOuterMetro',
              label: 'Prefer outer-metro / regional',
              help: 'Often less competition and older tech stacks.',
            },
          ] as const
        ).map((pref) => (
          <label
            key={pref.key}
            className="flex items-start gap-3 rounded-xl border border-border bg-secondary/30 px-4 py-3 text-left text-sm text-secondary-foreground transition hover:bg-secondary/40"
          >
            <input
              type="checkbox"
              checked={preferences[pref.key]}
              onChange={(e) =>
                setPreferences((prev) => ({ ...prev, [pref.key]: e.target.checked }))
              }
              disabled={isLoading}
              className="mt-1 h-4 w-4 accent-blue-500"
            />
            <span className="min-w-0">
              <span className="block font-semibold text-white">{pref.label}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">{pref.help}</span>
            </span>
          </label>
        ))}
      </div>

      {/* Try a search — properly left aligned, matches "TRY AN EXAMPLE" */}
      <div className="mt-3">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Try a search
        </p>
        <div className="flex flex-wrap gap-1.5">
          {EXAMPLE_SEARCHES.map((s) => (
            <button
              key={s}
              onClick={() => setQuery(s)}
              disabled={isLoading}
              className="rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs font-medium text-secondary-foreground transition hover:border-blue-400/30 hover:bg-blue-500/10 hover:text-blue-200 disabled:opacity-40"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}