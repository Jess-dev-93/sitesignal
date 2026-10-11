'use client'

import { useMemo, useState } from 'react'
import type { UserProfile } from '../lib/profileStorage'
import { applyProfilePlaceholdersDeep } from '../lib/templateUtils'

type Device = 'mobile' | 'desktop'
type Tab = 'overview' | 'findings' | 'technical'

interface DeviceScores {
  performance: number
  seo: number
  accessibility: number
  bestPractices: number
}

interface TechnicalFinding {
  id?: string
  title: string
  categoryLabel?: string
  priority?: string
  displayValue?: string | null
}

interface Scores {
  mobile: DeviceScores
  desktop: DeviceScores
  details: Record<string, unknown>
  evidence?: {
    mobile?: { topFindings?: TechnicalFinding[] }
    desktop?: { topFindings?: TechnicalFinding[] }
  }
}

export interface EditableReport {
  executiveSummary: string
  keyIssues: string[]
  businessImpact: string[]
  recommendations: string[]
}

interface Props {
  url: string
  pageTitle?: string | null
  auditedAt: string
  scores: Scores
  report: EditableReport
  profile: UserProfile
  onSave: (report: EditableReport) => void
  onNewAudit: () => void
  onEditBranding: () => void
}

const primary =
  'rounded-lg bg-[#6135ad] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#50258f] disabled:opacity-50'

const secondary =
  'rounded-lg border border-[#ded6e5] bg-white px-4 py-2.5 text-sm font-medium text-[#6135ad] transition hover:bg-[#f1ebf8]'

const input =
  'w-full rounded-lg border border-[#ded6e5] bg-white px-3 py-3 text-sm leading-relaxed text-[#271436] outline-none focus:border-[#6135ad] focus:ring-2 focus:ring-[#eee7f8]'

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const replacements: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }

    return replacements[character]
  })
}

function websiteLabel(value: string) {
  try {
    const url = new URL(value)
    return `${url.hostname.replace(/^www\./, '')}${
      url.pathname === '/' ? '' : url.pathname
    }`
  } catch {
    return value
  }
}

function formatDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return 'Date unavailable'

  return date.toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function cleanReport(report: EditableReport): EditableReport {
  const cleanList = (items: string[]) =>
    items.map((item) => item.trim()).filter(Boolean)

  return {
    executiveSummary: report.executiveSummary.trim(),
    keyIssues: cleanList(report.keyIssues),
    businessImpact: cleanList(report.businessImpact),
    recommendations: cleanList(report.recommendations),
  }
}

function ListEditor({
  label,
  items,
  onChange,
}: {
  label: string
  items: string[]
  onChange: (items: string[]) => void
}) {
  return (
    <div className="space-y-3">
      <h3 className="font-medium">{label}</h3>

      {items.map((item, index) => (
        <div key={index} className="flex items-start gap-2">
          <textarea
            aria-label={`${label} ${index + 1}`}
            rows={3}
            value={item}
            onChange={(event) =>
              onChange(
                items.map((current, position) =>
                  position === index ? event.target.value : current
                )
              )
            }
            className={input}
          />

          <button
            type="button"
            aria-label={`Remove ${label.toLowerCase()} ${index + 1}`}
            onClick={() =>
              onChange(items.filter((_, position) => position !== index))
            }
            className="rounded-lg px-3 py-3 text-[#756b80] hover:bg-[#f1edf5]"
          >
            ×
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() => onChange([...items, ''])}
        className="text-sm font-medium text-[#6135ad] hover:underline"
      >
        + Add item
      </button>
    </div>
  )
}

function TextList({
  items,
  numbered = false,
}: {
  items: string[]
  numbered?: boolean
}) {
  if (!items.length) {
    return (
      <p className="text-sm text-[#756b80]">
        No items supplied for this section.
      </p>
    )
  }

  return (
    <ul className="divide-y divide-[#e5dfe9]">
      {items.map((item, index) => (
        <li key={index} className="flex items-start gap-4 py-5">
          {numbered ? (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#eee7f8] text-sm font-medium text-[#6135ad]">
              {String(index + 1).padStart(2, '0')}
            </span>
          ) : (
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#6135ad]" />
          )}

          <p className="whitespace-pre-wrap text-sm leading-7 text-[#493955]">
            {item}
          </p>
        </li>
      ))}
    </ul>
  )
}

function documentHtml({
  title,
  url,
  date,
  report,
  scores,
  device,
  profile,
}: {
  title: string
  url: string
  date: string
  report: EditableReport
  scores: DeviceScores
  device: Device
  profile: UserProfile
}) {
  const listSection = (heading: string, items: string[]) => {
    if (!items.length) return ''

    return `
      <section>
        <h2>${escapeHtml(heading)}</h2>
        <ol>
          ${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
        </ol>
      </section>
    `
  }

  const scoreRows = [
    ['Performance', scores.performance],
    ['SEO', scores.seo],
    ['Accessibility', scores.accessibility],
    ['Best practices', scores.bestPractices],
  ]
    .map(
      ([label, value]) =>
        `<tr><th>${escapeHtml(String(label))}</th><td>${value}/100</td></tr>`
    )
    .join('')

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)} - Website health check</title>
  <style>
    * { box-sizing: border-box; }
    html { color-scheme: light; }
    body {
      margin: 0;
      padding: 36px;
      background: #fff;
      color: #271436;
      font-family: Arial, sans-serif;
      font-size: 13px;
      line-height: 1.65;
    }
    main { max-width: 740px; margin: 0 auto; }
    header {
      border-bottom: 2px solid #6135ad;
      padding-bottom: 16px;
      margin-bottom: 30px;
    }
    .brand { font-family: Georgia, serif; font-size: 22px; }
    h1, h2 { font-family: Georgia, serif; font-weight: normal; }
    h1 { font-size: 32px; line-height: 1.2; margin: 0 0 10px; }
    h2 { font-size: 21px; margin: 0 0 12px; }
    .client { font-size: 17px; margin: 0 0 5px; }
    .muted { color: #756b80; font-size: 12px; }
    .url { overflow-wrap: anywhere; }
    section { margin-top: 28px; }
    p, li { white-space: pre-wrap; overflow-wrap: anywhere; }
    ol { margin: 0; padding-left: 22px; }
    li { padding: 5px 0 9px 5px; break-inside: avoid; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 8px 0; border-bottom: 1px solid #e5dfe9; }
    th { text-align: left; font-weight: normal; }
    td { text-align: right; }
    footer {
      margin-top: 36px;
      padding-top: 18px;
      border-top: 1px solid #e5dfe9;
      color: #756b80;
      font-size: 11px;
    }
    @page { size: A4; margin: 18mm; }
    @media print {
      body { padding: 0; }
      h1, h2 { break-after: avoid; }
      header, footer, table { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <main>
    <header>
      <div class="brand">${escapeHtml(profile.yourCompany || 'Website review')}</div>
    </header>

    <h1>Website health check</h1>
    <p class="client">${escapeHtml(title)}</p>
    <div class="muted url">${escapeHtml(url)}</div>
    <div class="muted">Audited ${escapeHtml(date)} · Single-page review</div>

    ${
      report.executiveSummary
        ? `<section><h2>Executive summary</h2><p>${escapeHtml(
            report.executiveSummary
          )}</p></section>`
        : ''
    }

    ${listSection('Key findings', report.keyIssues)}
    ${listSection('Potential business impact', report.businessImpact)}
    ${listSection('Recommended next steps', report.recommendations)}

    <section>
      <h2>${device === 'mobile' ? 'Mobile' : 'Desktop'} scores</h2>
      <table>${scoreRows}</table>
    </section>

    <footer>
      Prepared by ${escapeHtml(profile.yourName || 'Your consultant')}<br>
      ${escapeHtml(profile.yourCompany || '')}<br>
      ${escapeHtml(profile.yourWebsite || '')}
      <p>
        Scope: one page. Automated performance, SEO and accessibility
        checks support this review; they do not establish full website
        compliance, conversion performance or analytics accuracy.
        Scores reflect the conditions of the original test.
      </p>
    </footer>
  </main>
</body>
</html>`
}

export default function ReportWorkspace({
  url,
  pageTitle,
  auditedAt,
  scores,
  report,
  profile,
  onSave,
  onNewAudit,
  onEditBranding,
}: Props) {
  const [tab, setTab] = useState<Tab>('overview')
  const [device, setDevice] = useState<Device>('mobile')
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<EditableReport>(() =>
    applyProfilePlaceholdersDeep(report, profile)
  )
  const [message, setMessage] = useState<string | null>(null)

  const title = pageTitle?.trim() || websiteLabel(url)
  const activeScores = scores[device]

  const savedReport = applyProfilePlaceholdersDeep(report, profile)
  const dirty =
    JSON.stringify(cleanReport(draft)) !==
    JSON.stringify(cleanReport(savedReport))

  const preview = useMemo(
    () =>
      documentHtml({
        title,
        url,
        date: formatDate(auditedAt),
        report: cleanReport(draft),
        scores: activeScores,
        device,
        profile,
      }),
    [title, url, auditedAt, draft, activeScores, device, profile]
  )

  const findings = scores.evidence?.[device]?.topFindings ?? []

  const save = () => {
    try {
      const cleaned = cleanReport(draft)
      onSave(cleaned)
      setDraft(cleaned)
      setEditing(false)
      setMessage('Changes saved in this browser.')
    } catch {
      setMessage(
        'Changes could not be saved. Your draft is still here; export a copy before leaving.'
      )
    }
  }

  const openDocument = (print: boolean) => {
    if (dirty) {
      setMessage('Save your wording changes before previewing or exporting.')
      return
    }

    const popup = window.open('', '_blank')

    if (!popup) {
      setMessage('Allow pop-ups for localhost to open the report.')
      return
    }

    popup.opener = null
    popup.document.open()
    popup.document.write(preview)
    popup.document.close()
    popup.focus()

    if (print) {
      popup.setTimeout(() => popup.print(), 250)
    }
  }

  const leave = () => {
    if (
      dirty &&
      !window.confirm('Leave this report and discard unsaved wording changes?')
    ) {
      return
    }

    onNewAudit()
  }

  return (
    <section className="space-y-7">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <h1 className="font-serif text-3xl tracking-tight sm:text-4xl">
            Website health check
          </h1>

          <p className="mt-3 break-all text-sm text-[#756b80]">
            {websiteLabel(url)} · Audited {formatDate(auditedAt)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={leave} className={secondary}>
            New audit
          </button>

          <button
            type="button"
            onClick={() => openDocument(false)}
            disabled={dirty}
            className={secondary}
          >
            Preview report
          </button>

          <button
            type="button"
            onClick={() => openDocument(true)}
            disabled={dirty}
            className={primary}
          >
            Export PDF
          </button>
        </div>
      </div>

      {message && (
        <p role="status" className="rounded-lg bg-[#eee7f8] p-4 text-sm text-[#6135ad]">
          {message}
        </p>
      )}

      <div className="sitebrief-score-strip flex flex-wrap items-center gap-6 rounded-xl border border-[#e5dfe9] bg-white p-5">
        <span className="text-sm font-medium">Single-page audit</span>

        <div className="inline-flex rounded-lg bg-[#f4f0f7] p-1">
          {(['mobile', 'desktop'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setDevice(mode)}
              aria-pressed={device === mode}
              className={`rounded-md px-3 py-2 text-sm ${
                device === mode
                  ? 'bg-[#e9dff6] font-medium text-[#6135ad]'
                  : 'text-[#756b80]'
              }`}
            >
              {mode === 'mobile' ? 'Mobile' : 'Desktop'}
            </button>
          ))}
        </div>

        <div className="grid flex-1 grid-cols-2 gap-5 sm:grid-cols-4">
          {[
            ['Performance', activeScores.performance],
            ['SEO', activeScores.seo],
            ['Accessibility', activeScores.accessibility],
            ['Best practices', activeScores.bestPractices],
          ].map(([label, value]) => (
            <div key={String(label)}>
              <p className="text-xs text-[#756b80]">{label}</p>
              <p className="mt-1 font-serif text-2xl">
                {value}
                <span className="ml-1 font-sans text-xs text-[#756b80]">
                  /100
                </span>
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.8fr)]">
        <div className="min-w-0">
          <div className="flex gap-5 border-b border-[#e5dfe9]">
            {[
              ['overview', 'Overview'],
              ['findings', 'Findings'],
              ['technical', 'Technical details'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setTab(value as Tab)}
                aria-pressed={tab === value}
                className={`border-b-2 pb-3 text-sm ${
                  tab === value
                    ? 'border-[#6135ad] font-medium text-[#6135ad]'
                    : 'border-transparent text-[#756b80]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-[#756b80]">
              {dirty ? 'Unsaved wording changes' : 'Review the wording before sending'}
            </p>

            {editing ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDraft(savedReport)
                    setEditing(false)
                    setMessage(null)
                  }}
                  className={secondary}
                >
                  Cancel
                </button>

                <button type="button" onClick={save} className={primary}>
                  Save changes
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setEditing(true)
                  setMessage(null)
                }}
                className="text-sm font-medium text-[#6135ad] hover:underline"
              >
                ✎ Edit wording
              </button>
            )}
          </div>

          {editing && (
            <div className="mt-6 space-y-7 rounded-xl border border-[#e5dfe9] bg-white p-5">
              <label className="block">
                <span className="mb-3 block font-medium">
                  Executive summary
                </span>
                <textarea
                  rows={6}
                  value={draft.executiveSummary}
                  onChange={(event) =>
                    setDraft({ ...draft, executiveSummary: event.target.value })
                  }
                  className={input}
                />
              </label>

              <ListEditor
                label="Key findings"
                items={draft.keyIssues}
                onChange={(keyIssues) => setDraft({ ...draft, keyIssues })}
              />

              <ListEditor
                label="Potential business impact"
                items={draft.businessImpact}
                onChange={(businessImpact) =>
                  setDraft({ ...draft, businessImpact })
                }
              />

              <ListEditor
                label="Recommended next steps"
                items={draft.recommendations}
                onChange={(recommendations) =>
                  setDraft({ ...draft, recommendations })
                }
              />
            </div>
          )}

          {!editing && tab === 'overview' && (
            <div className="mt-8 space-y-8">
              <section>
                <h2 className="font-serif text-2xl">Executive summary</h2>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[#493955]">
                  {draft.executiveSummary || 'No summary supplied for this audit.'}
                </p>
              </section>

              <section>
                <h2 className="font-serif text-2xl">What matters most</h2>
                <TextList items={draft.keyIssues.slice(0, 3)} numbered />

                {draft.keyIssues.length > 3 && (
                  <button
                    type="button"
                    onClick={() => setTab('findings')}
                    className="text-sm font-medium text-[#6135ad] hover:underline"
                  >
                    View all {draft.keyIssues.length} findings →
                  </button>
                )}
              </section>

              <section>
                <h2 className="font-serif text-2xl">
                  Recommended next steps
                </h2>
                <TextList items={draft.recommendations} />
              </section>
            </div>
          )}

          {!editing && tab === 'findings' && (
            <div className="mt-8 space-y-8">
              <section>
                <h2 className="font-serif text-2xl">Key findings</h2>
                <TextList items={draft.keyIssues} numbered />
              </section>

              <section>
                <h2 className="font-serif text-2xl">
                  Potential business impact
                </h2>
                <TextList items={draft.businessImpact} />
              </section>
            </div>
          )}

          {!editing && tab === 'technical' && (
            <div className="mt-8 space-y-6">
              <div>
                <h2 className="font-serif text-2xl">Technical evidence</h2>
                <p className="mt-3 text-sm leading-6 text-[#756b80]">
                  Original {device} test findings. Editing your commentary
                  does not change these measurements.
                </p>
              </div>

              {findings.length ? (
                <div className="divide-y divide-[#e5dfe9]">
                  {findings.map((finding, index) => (
                    <div key={finding.id || index} className="py-5">
                      <p className="text-xs text-[#756b80]">
                        {finding.categoryLabel || 'Lighthouse finding'}
                      </p>
                      <h3 className="mt-2 font-medium">{finding.title}</h3>
                      {finding.displayValue && (
                        <p className="mt-2 text-sm text-[#756b80]">
                          {finding.displayValue}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#756b80]">
                  Detailed findings are not available in this saved record.
                </p>
              )}

              <details className="rounded-lg border border-[#e5dfe9] bg-white p-4">
                <summary className="cursor-pointer text-sm font-medium">
                  Original measurement details
                </summary>
                <pre className="mt-4 max-h-80 overflow-auto whitespace-pre-wrap break-all text-xs text-[#756b80]">
                  {JSON.stringify(scores.details, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>

        <aside className="sitebrief-preview min-w-0 rounded-xl border border-[#e5dfe9] bg-[#f4f1f6] p-4 xl:sticky xl:top-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-serif text-xl">Client report</h2>
            {dirty && (
              <span className="text-xs text-[#756b80]">Draft preview</span>
            )}
          </div>

          <iframe
            title="Client report preview"
            srcDoc={preview}
            sandbox=""
            className="h-[600px] w-full rounded-sm border border-[#e5dfe9] bg-white shadow-sm"
          />

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs leading-5 text-[#756b80]">
              <p>Prepared by {profile.yourName}</p>
              <p>{profile.yourCompany}</p>
            </div>

            <button
              type="button"
              onClick={onEditBranding}
              className={secondary}
            >
              Edit branding
            </button>
          </div>

          <p className="mt-4 text-xs leading-5 text-[#756b80]">
            The preview includes your current wording.
            Export uses your saved version and selected device scores.
          </p>
        </aside>
      </div>
    </section>
  )
}