'use client'

import { useEffect, useMemo, useState } from 'react'

const EXAMPLE_SITES = [
  { label: 'Plumber Website', url: 'https://joesplumbing.com.au' },
  { label: 'Law Firm Website', url: 'https://smithlegal.com.au' },
  { label: 'Dental Website', url: 'https://brightsmiledental.com.au' },
]

const SCAN_MODES = [
  {
    id: 'quick',
    label: 'Quick Scan',
    description: 'Faster · high-level scores and top issues',
  },
  {
    id: 'full',
    label: 'Full Audit',
    description: 'Lighthouse · AI recommendations · outreach-ready insights',
  },
]

function normaliseUrl(value) {
  const trimmed = value.trim()
  if (!trimmed) return ''

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed
  }

  return `https://${trimmed}`
}

function isLikelyValidUrl(value) {
  try {
    const url = new URL(normaliseUrl(value))
    return !!url.hostname && url.hostname.includes('.')
  } catch {
    return false
  }
}

export default function AuditForm({
  onSubmit,
  isLoading,
  initialUrl = '',
  scanMode = 'full',
  onScanModeChange,
}) {
  const [inputValue, setInputValue] = useState(initialUrl || '')
  const [error, setError] = useState('')

  useEffect(() => {
    setInputValue(initialUrl || '')
    setError('')
  }, [initialUrl])

  const canSubmit = useMemo(() => {
    return inputValue.trim().length > 0 && isLikelyValidUrl(inputValue)
  }, [inputValue])

  const handleSubmit = (e) => {
    e.preventDefault()

    const finalUrl = normaliseUrl(inputValue)

    if (!finalUrl) {
      setError('Please enter a website URL.')
      return
    }

    if (!isLikelyValidUrl(finalUrl)) {
      setError('Please enter a valid URL like business.com.au')
      return
    }

    setError('')
    setInputValue(finalUrl)
    onSubmit(finalUrl, scanMode)
  }

  const handleBlur = () => {
    if (!inputValue.trim()) {
      setError('')
      return
    }

    const finalUrl = normaliseUrl(inputValue)
    setInputValue(finalUrl)

    if (!isLikelyValidUrl(finalUrl)) {
      setError('Please enter a valid URL like business.com.au')
    } else {
      setError('')
    }
  }

  const isQuickScan = scanMode === 'quick'

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="mb-4">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          Scan mode
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {SCAN_MODES.map((mode) => {
            const selected = scanMode === mode.id
            return (
              <button
                key={mode.id}
                type="button"
                disabled={isLoading}
                onClick={() => onScanModeChange?.(mode.id)}
                className={`rounded-2xl border p-4 text-left transition disabled:opacity-50 ${
                  selected
                    ? 'border-success-border bg-success-muted/40 ring-1 ring-success-border/40'
                    : 'border-white/[0.10] bg-white/[0.03] hover:border-white/[0.16] hover:bg-white/[0.05]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                      selected ? 'border-success bg-success/20' : 'border-white/20'
                    }`}
                    aria-hidden="true"
                  >
                    {selected ? (
                      <span className="h-2 w-2 rounded-full bg-success" />
                    ) : null}
                  </span>
                  <span className="text-sm font-semibold text-white">{mode.label}</span>
                </div>
                <p className="mt-2 pl-6 text-xs leading-relaxed text-slate-400">
                  {mode.description}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      <div className="mb-2 flex items-center justify-between gap-3">
        <label
          htmlFor="audit-url"
          className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400"
        >
          Website URL
        </label>

        {inputValue && !isLoading && (
          <button
            type="button"
            onClick={() => {
              setInputValue('')
              setError('')
            }}
            className="text-xs font-medium text-slate-500 transition hover:text-slate-300"
          >
            Clear
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          >
            🌐
          </span>

          <input
            id="audit-url"
            type="text"
            inputMode="url"
            autoComplete="off"
            spellCheck="false"
            autoFocus={!initialUrl}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value)
              if (error) setError('')
            }}
            onBlur={handleBlur}
            placeholder="Enter a website URL, e.g. business.com.au"
            disabled={isLoading}
            className={`w-full rounded-2xl border bg-slate-950/50 py-3.5 pl-12 pr-4 text-sm text-white shadow-sm outline-none transition placeholder:text-slate-500 focus:ring-4 disabled:cursor-not-allowed disabled:opacity-50 sm:text-base ${
              error
                ? 'border-rose-400/40 focus:border-rose-400 focus:ring-rose-500/10'
                : 'border-white/[0.10] focus:border-blue-400 focus:ring-blue-500/10'
            }`}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !canSubmit}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(37,99,235,0.24)] transition hover:-translate-y-0.5 hover:bg-blue-500 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 lg:w-auto"
        >
          {isLoading ? (
            <>
              <svg
                aria-hidden="true"
                className="h-4 w-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                />
              </svg>
              {isQuickScan ? 'Running quick scan…' : 'Running full audit…'}
            </>
          ) : (
            <>
              <span aria-hidden="true">{isQuickScan ? '⚡' : '📊'}</span>
              {isQuickScan ? 'Run Quick Scan' : 'Run Full Audit'}
            </>
          )}
        </button>
      </div>

      <div className="mt-2 flex flex-col gap-1">
        {error ? (
          <p className="text-xs text-rose-300">{error}</p>
        ) : (
          <p className="text-xs text-slate-500">
            {isQuickScan
              ? 'Quick scan checks mobile performance and surfaces the biggest issues fast.'
              : 'Full audit checks mobile and desktop, then generates outreach-ready AI insights.'}
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 sm:flex-shrink-0">
          Try an example
        </p>

        <div className="flex flex-wrap gap-1.5">
          {EXAMPLE_SITES.map((site) => (
            <button
              key={site.label}
              type="button"
              onClick={() => {
                setInputValue(site.url)
                setError('')
              }}
              disabled={isLoading}
              className="rounded-full border border-white/[0.10] bg-white/[0.04] px-3 py-1 text-xs font-medium text-slate-300 transition hover:border-blue-400/30 hover:bg-blue-500/10 hover:text-blue-200 disabled:opacity-40"
            >
              {site.label}
            </button>
          ))}
        </div>
      </div>
    </form>
  )
}
