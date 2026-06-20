'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { applyProfilePlaceholdersDeep, getProfileFallbacks } from '../lib/templateUtils'
import { getScoreStyles } from '../lib/scoreColors'

const SECTION_CONFIG = {
  'Executive Summary': {
    icon: '📋',
    accent: 'border-blue-500/20 bg-blue-500/[0.04]',
    iconBg: 'bg-blue-500/10 text-blue-300',
    dot: 'bg-blue-400',
    tagColour: 'border-blue-500/20 bg-blue-500/[0.08] text-blue-300',
    tag: 'Overview',
    context:
      "Here's the short version — what we found, how serious it is, and why it matters for the business. Read this first.",
  },
  'Key Issues': {
    icon: '⚠️',
    accent: 'border-rose-500/20 bg-rose-500/[0.04]',
    iconBg: 'bg-rose-500/10 text-rose-300',
    dot: 'bg-rose-400',
    tagColour: 'border-rose-500/20 bg-rose-500/[0.08] text-rose-300',
    tag: 'Problems found',
    context:
      'These are the specific technical problems holding the site back. Each one is a real issue — not filler. They affect how fast the site loads, how Google ranks it, and how usable it is on a phone.',
  },
  'Business Impact': {
    icon: '💼',
    accent: 'border-amber-500/20 bg-amber-500/[0.04]',
    iconBg: 'bg-amber-500/10 text-amber-300',
    dot: 'bg-amber-400',
    tagColour: 'border-amber-500/20 bg-amber-500/[0.08] text-amber-300',
    tag: 'Why it costs you',
    context:
      'Technical problems have real commercial consequences. This section translates the issues above into what they actually mean for leads, conversions, and revenue.',
  },
  'Recommended Next Steps': {
    icon: '🚀',
    accent: 'border-emerald-500/20 bg-emerald-500/[0.04]',
    iconBg: 'bg-emerald-500/10 text-emerald-300',
    dot: 'bg-emerald-400',
    tagColour: 'border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-300',
    tag: 'Action plan',
    context:
      'A practical list of what should be fixed and roughly in what order. These are prioritised by impact — the things that will make the biggest difference to performance and enquiries.',
  },
}

function getScoreStyle(score) {
  return getScoreStyles(score).text
}

function getScoreBg(score) {
  return getScoreStyles(score).panel
}

function getScoreLabel(score) {
  const styles = getScoreStyles(score)

  return {
    text: styles.label,
    colour:
      styles.tone === 'strong'
        ? 'text-emerald-400'
        : styles.tone === 'warning'
          ? 'text-amber-400'
          : 'text-rose-400',
  }
}

function getScoreBar(score) {
  return getScoreStyles(score).bar
}

function getScoreColourHex(score) {
  return getScoreStyles(score).hex
}

function getScoreLabelText(score) {
  return getScoreStyles(score).label
}

function getModeScores(scores, auditMode = 'mobile') {
  if (!scores) return null
  return auditMode === 'desktop' ? scores.desktop : scores.mobile
}

function getModeLabel(auditMode = 'mobile') {
  return auditMode === 'desktop' ? 'Desktop' : 'Mobile'
}

function ReportSection({ title, config, index, content, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  const sectionConfig = config ?? {
    icon: '📄',
    accent: 'border-border bg-secondary/20',
    iconBg: 'bg-secondary text-secondary-foreground',
    dot: 'bg-muted-foreground',
    tagColour: 'border-border bg-secondary/50 text-muted-foreground',
    tag: 'Section',
    context: null,
  }

  const itemCount = Array.isArray(content) ? content.length : content ? 1 : 0

  return (
    <div className={`overflow-hidden rounded-2xl border ${sectionConfig.accent}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-4 p-5 text-left transition hover:bg-secondary/30 sm:p-6"
        aria-expanded={open}
      >
        <div className="flex min-w-0 items-start gap-3">
          <div className="relative flex-shrink-0">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg ${sectionConfig.iconBg}`}
            >
              {sectionConfig.icon}
            </div>
            <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full border border-border bg-card text-[9px] font-bold text-muted-foreground">
              {index + 1}
            </span>
          </div>

          <div className="min-w-0">
            <h4 className="text-base font-bold tracking-tight text-foreground sm:text-lg">
              {title}
            </h4>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {sectionConfig.tag && (
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${sectionConfig.tagColour}`}
                >
                  {sectionConfig.tag}
                </span>
              )}
              <span className="text-[10px] font-medium text-muted-foreground">
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </span>
            </div>
          </div>
        </div>

        <ChevronDown
          className={`mt-1 h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 ${
            open ? 'rotate-0' : '-rotate-90'
          }`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div className="border-t border-border/60 px-5 pb-5 sm:px-6 sm:pb-6">
          {sectionConfig.context && (
            <p className="mb-4 mt-4 border-l-2 border-border pl-3 text-xs italic leading-relaxed text-muted-foreground">
              {sectionConfig.context}
            </p>
          )}

          {Array.isArray(content) ? (
            <ul className="space-y-3">
              {content.map((item, i) => (
                <li key={i} className="flex items-start gap-3 rounded-xl border border-border/50 bg-card/50 px-3 py-2.5">
                  <span
                    className={`mt-[7px] h-1.5 w-1.5 flex-shrink-0 rounded-full ${sectionConfig.dot}`}
                  />
                  <span className="text-sm leading-relaxed text-secondary-foreground">{item}</span>
                </li>
              ))}
            </ul>
          ) : typeof content === 'string' ? (
            <p className="rounded-xl border border-border/50 bg-card/50 px-4 py-3 text-sm leading-relaxed text-secondary-foreground">
              {content}
            </p>
          ) : null}
        </div>
      )}
    </div>
  )
}

function buildScoreItems(scores, auditMode = 'mobile') {
  const modeScores = getModeScores(scores, auditMode)

  if (!modeScores) return []

  return [
    { label: 'Performance', value: modeScores.performance ?? 0 },
    { label: 'SEO', value: modeScores.seo ?? 0 },
    { label: 'Accessibility', value: modeScores.accessibility ?? 0 },
    { label: 'Best Practices', value: modeScores.bestPractices ?? 0 },
  ]
}

function exportToPDF(url, scores, report, profile, auditMode = 'mobile') {
  const profileValues = getProfileFallbacks(profile)
  const hydratedReport = applyProfilePlaceholdersDeep(report, profile)
  const scoreItems = buildScoreItems(scores, auditMode)
  const modeLabel = getModeLabel(auditMode)

  const sections = [
    { title: 'Executive Summary', content: hydratedReport.executiveSummary, emoji: '📋' },
    { title: 'Key Issues', content: hydratedReport.keyIssues, emoji: '⚠️' },
    { title: 'Business Impact', content: hydratedReport.businessImpact, emoji: '💼' },
    { title: 'Recommended Next Steps', content: hydratedReport.recommendations, emoji: '🚀' },
  ].filter((s) => s.content)

  const scoresHtml = scoreItems
    .map(
      (item) => `
    <div class="score-card">
      <div class="score-label">${item.label}</div>
      <div class="score-number" style="color:${getScoreColourHex(item.value)}">${item.value}</div>
      <div class="score-tag" style="color:${getScoreColourHex(item.value)}">${getScoreLabelText(item.value)}</div>
    </div>
  `
    )
    .join('')

  const sectionsHtml = sections
    .map((section, index) => {
      const contentHtml = Array.isArray(section.content)
        ? `<ul>${section.content.map((item) => `<li>${item}</li>`).join('')}</ul>`
        : `<p>${section.content}</p>`

      return `
      <div class="section">
        <div class="section-header">
          <span class="section-number">${index + 1}</span>
          <span class="section-emoji">${section.emoji}</span>
          <h3>${section.title}</h3>
        </div>
        ${contentHtml}
      </div>
    `
    })
    .join('')

  const date = new Date().toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Website Audit Report — ${url}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #1e293b;
      background: #fff;
      padding: 40px;
      max-width: 860px;
      margin: 0 auto;
      font-size: 14px;
      line-height: 1.6;
    }

    .header {
      border-bottom: 3px solid #2563eb;
      padding-bottom: 24px;
      margin-bottom: 32px;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 20px;
    }

    .brand-icon {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #3b82f6, #06b6d4);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    }

    .brand-name {
      font-size: 16px;
      font-weight: 700;
      color: #1e293b;
    }

    .brand-sub {
      font-size: 11px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    h1 {
      font-size: 28px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 6px;
      line-height: 1.2;
    }

    .prepared-for {
      font-size: 13px;
      color: #64748b;
      margin-bottom: 4px;
    }

    .url-link {
      color: #2563eb;
      font-weight: 600;
      font-size: 14px;
      text-decoration: none;
    }

    .report-date {
      font-size: 12px;
      color: #94a3b8;
      margin-top: 4px;
    }

    .overall-banner {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px 24px;
      margin-bottom: 28px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }

    .overall-left h2 {
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 4px;
    }

    .overall-left p {
      font-size: 12px;
      color: #64748b;
    }

    .overall-score-circle {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      border: 4px solid;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .overall-score-number {
      font-size: 26px;
      font-weight: 800;
      line-height: 1;
    }

    .overall-score-sub {
      font-size: 9px;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-top: 2px;
    }

    .scores-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 32px;
    }

    .score-card {
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 14px;
      text-align: center;
      background: #f8fafc;
    }

    .score-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: #94a3b8;
      margin-bottom: 8px;
    }

    .score-number {
      font-size: 28px;
      font-weight: 800;
      line-height: 1;
      margin-bottom: 4px;
    }

    .score-tag {
      font-size: 11px;
      font-weight: 600;
    }

    .section {
      margin-bottom: 24px;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px 24px;
      page-break-inside: avoid;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 14px;
      padding-bottom: 12px;
      border-bottom: 1px solid #f1f5f9;
    }

    .section-number {
      width: 22px;
      height: 22px;
      background: #2563eb;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
      flex-shrink: 0;
    }

    .section-emoji {
      font-size: 18px;
    }

    .section h3 {
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
    }

    .section p {
      color: #475569;
      font-size: 13px;
      line-height: 1.7;
    }

    .section ul {
      list-style: none;
      padding: 0;
    }

    .section ul li {
      position: relative;
      padding-left: 16px;
      color: #475569;
      font-size: 13px;
      line-height: 1.7;
      margin-bottom: 8px;
    }

    .section ul li::before {
      content: '•';
      position: absolute;
      left: 0;
      color: #2563eb;
      font-weight: 700;
    }

    .perf-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 32px;
    }

    .perf-card {
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 16px;
      background: #f8fafc;
    }

    .perf-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: #94a3b8;
      margin-bottom: 6px;
    }

    .perf-score {
      font-size: 24px;
      font-weight: 800;
    }

    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .footer p {
      font-size: 11px;
      color: #94a3b8;
    }

    .footer-brand {
      font-weight: 700;
      color: #2563eb;
    }

    .next-steps-banner {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 12px;
      padding: 20px 24px;
      margin-top: 24px;
    }

    .next-steps-banner h4 {
      font-size: 15px;
      font-weight: 700;
      color: #1e40af;
      margin-bottom: 6px;
    }

    .next-steps-banner p {
      font-size: 13px;
      color: #3b82f6;
      line-height: 1.6;
    }

    @media print {
      body { padding: 20px; }
      .no-print { display: none !important; }
      @page { margin: 1cm; size: A4; }
    }
  </style>
</head>
<body>

  <div class="header">
    <div class="brand">
      <div class="brand-icon">🎯</div>
      <div>
        <div class="brand-name">SiteSignal</div>
        <div class="brand-sub">Website Audit Report</div>
      </div>
    </div>
    <h1>Website Audit Report</h1>
    <p class="prepared-for">Prepared by ${profileValues.yourName}${profileValues.yourCompany !== 'Your Company' ? ` · ${profileValues.yourCompany}` : ''}</p>
    <a class="url-link" href="${url}" target="_blank">${url}</a>
    <p class="report-date">Generated on ${date}</p>
  </div>

  <div class="overall-banner">
    <div class="overall-left">
      <h2>Overall Quick Health</h2>
      <p>Based on Google Lighthouse mobile audit — the overall score uses the mobile benchmark, while the score cards below reflect the selected ${modeLabel.toLowerCase()} view.</p>
    </div>
    <div class="overall-score-circle" style="border-color:${getScoreColourHex(scores?.overallScore ?? 0)}">
      <span class="overall-score-number" style="color:${getScoreColourHex(scores?.overallScore ?? 0)}">
        ${scores?.overallScore ?? 0}
      </span>
      <span class="overall-score-sub">/100</span>
    </div>
  </div>

  <div class="scores-grid">
    ${scoresHtml}
  </div>

  <div class="perf-row">
    <div class="perf-card">
      <div class="perf-label">📱 Mobile Performance</div>
      <div class="perf-score" style="color:${getScoreColourHex(scores?.mobile?.performance ?? 0)}">
        ${scores?.mobile?.performance ?? 0}<span style="font-size:14px;color:#94a3b8">/100</span>
      </div>
    </div>
    <div class="perf-card">
      <div class="perf-label">🖥️ Desktop Performance</div>
      <div class="perf-score" style="color:${getScoreColourHex(scores?.desktop?.performance ?? 0)}">
        ${scores?.desktop?.performance ?? 0}<span style="font-size:14px;color:#94a3b8">/100</span>
      </div>
    </div>
  </div>

  ${sectionsHtml}

  <div class="next-steps-banner">
    <h4>💬 What happens next?</h4>
    <p>
      This report gives you everything you need to start a conversation.
      The issues are real, the impact is commercial, and the fixes are straightforward
      for an experienced developer. If you'd like to talk through what a project would
      look like — scope, timeline, and cost — get in touch and we can take it from there.
    </p>
  </div>

  <div class="footer">
    <p>
      Generated by <span class="footer-brand">${profileValues.yourCompany !== 'Your Company' ? profileValues.yourCompany : 'SiteSignal'}</span>
      ${profileValues.yourName !== 'Your Name' ? ` · ${profileValues.yourName}` : ''}
      ${profileValues.yourLocation !== 'Sydney' ? ` · ${profileValues.yourLocation}` : ''}
    </p>
    <p>${url} · ${date}</p>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print()
      }, 500)
    }
  </script>

</body>
</html>
`

  const blob = new Blob([html], { type: 'text/html;charset=utf-8;' })
  const printUrl = URL.createObjectURL(blob)
  window.open(printUrl, '_blank')
}

function exportToExcel(url, scores, report, profile, auditMode = 'mobile') {
  const profileValues = getProfileFallbacks(profile)
  const hydratedReport = applyProfilePlaceholdersDeep(report, profile)
  const scoreItems = buildScoreItems(scores, auditMode)
  const modeLabel = getModeLabel(auditMode)

  const date = new Date().toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const esc = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`
  const rows = []

  rows.push([esc('WEBSITE AUDIT REPORT'), '', '', ''])
  rows.push([esc(`URL: ${url}`), '', '', ''])
  rows.push([esc(`Generated: ${date}`), '', '', ''])
  rows.push([esc(`Selected mode: ${modeLabel}`), '', '', ''])
  rows.push(['', '', '', ''])

  rows.push([esc('OVERALL SCORE'), esc('STATUS'), '', ''])
  rows.push([
    esc(scores?.overallScore ?? 0),
    esc(getScoreLabelText(scores?.overallScore ?? 0)),
    '',
    '',
  ])
  rows.push(['', '', '', ''])

  rows.push([esc(`SCORE BREAKDOWN (${modeLabel.toUpperCase()})`), '', '', ''])
  rows.push([esc('Category'), esc('Score'), esc('Status'), esc('Source')])
  scoreItems.forEach((item) => {
    rows.push([
      esc(`${item.label} (${modeLabel})`),
      esc(item.value ?? 0),
      esc(getScoreLabelText(item.value ?? 0)),
      esc('Google Lighthouse'),
    ])
  })

  rows.push([
    esc('Performance (Mobile)'),
    esc(scores?.mobile?.performance ?? 0),
    esc(getScoreLabelText(scores?.mobile?.performance ?? 0)),
    esc('Google Lighthouse'),
  ])
  rows.push([
    esc('Performance (Desktop)'),
    esc(scores?.desktop?.performance ?? 0),
    esc(getScoreLabelText(scores?.desktop?.performance ?? 0)),
    esc('Google Lighthouse'),
  ])
  rows.push(['', '', '', ''])

  rows.push([esc('EXECUTIVE SUMMARY'), '', '', ''])
  if (typeof hydratedReport.executiveSummary === 'string') {
    rows.push([esc(hydratedReport.executiveSummary), '', '', ''])
  }
  rows.push(['', '', '', ''])

  rows.push([esc('KEY ISSUES'), '', '', ''])
  if (Array.isArray(hydratedReport.keyIssues)) {
    hydratedReport.keyIssues.forEach((item, i) => {
      rows.push([esc(`${i + 1}. ${item}`), '', '', ''])
    })
  }
  rows.push(['', '', '', ''])

  rows.push([esc('BUSINESS IMPACT'), '', '', ''])
  if (Array.isArray(hydratedReport.businessImpact)) {
    hydratedReport.businessImpact.forEach((item, i) => {
      rows.push([esc(`${i + 1}. ${item}`), '', '', ''])
    })
  }
  rows.push(['', '', '', ''])

  rows.push([esc('RECOMMENDED NEXT STEPS'), '', '', ''])
  if (Array.isArray(hydratedReport.recommendations)) {
    hydratedReport.recommendations.forEach((item, i) => {
      rows.push([esc(`${i + 1}. ${item}`), '', '', ''])
    })
  }
  rows.push(['', '', '', ''])

  rows.push([
    esc(
      `Generated by ${
        profileValues.yourCompany !== 'Your Company'
          ? profileValues.yourCompany
          : 'SiteSignal'
      }${profileValues.yourName !== 'Your Name' ? ` — ${profileValues.yourName}` : ''}`
    ),
    '',
    '',
    '',
  ])

  const csv = rows.map((r) => r.join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const hostname = url.replace(/https?:\/\//, '').replace(/\/$/, '').replace(/\./g, '-')
  link.href = URL.createObjectURL(blob)
  link.download = `audit-report-${hostname}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export default function AuditReport({
  report,
  url,
  scores,
  profile,
  auditMode = 'mobile',
}) {
  const [scoresOpen, setScoresOpen] = useState(true)
  const [techOpen, setTechOpen] = useState(false)

  if (!report) return null

  const hydratedReport = applyProfilePlaceholdersDeep(report, profile)
  const profileValues = getProfileFallbacks(profile)
  const scoreItems = buildScoreItems(scores, auditMode)
  const modeLabel = getModeLabel(auditMode)
  const overallScore = scores?.overallScore ?? 0
  const mobilePerf = scores?.mobile?.performance ?? 0

  const techOptions = [
    {
      tier: 'Option 1 — Upgrade (keep the current platform)',
      badge: 'Fastest',
      accent: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
      items: [
        'Fix the biggest Lighthouse blockers (image compression, unused JS/CSS, caching).',
        'Tighten mobile UX: tap targets, sticky CTA, clearer contact paths.',
        'Add basic technical SEO: metadata, headings, indexation checks, sitemap/robots.',
      ],
    },
    {
      tier: 'Option 2 — Modernise (move to a better stack)',
      badge: 'Best value',
      accent: 'border-blue-500/20 bg-blue-500/10 text-blue-300',
      items: [
        'Migrate to a faster hosting/CDN setup (and reduce third‑party script bloat).',
        'If currently on Webflow: optimise + reduce heavy interactions, or consider Framer for simpler sites.',
        'If currently on WordPress: consider a lightweight theme + performance plugin stack, or a headless setup.',
      ],
    },
    {
      tier: 'Option 3 — Full rebuild (highest outcome)',
      badge: 'Premium',
      accent: 'border-violet-500/20 bg-violet-500/10 text-violet-300',
      items: [
        'Rebuild on a modern framework (Next.js / Astro) for speed, SEO and maintainability.',
        'Design system + components for consistent UX and easier iteration.',
        'Analytics + conversion tracking baked in (forms, calls, booking, funnels).',
      ],
    },
  ]

  const shouldNudgeRebuild = overallScore < 50 || mobilePerf < 50

  const sections = [
    { title: 'Executive Summary', content: hydratedReport.executiveSummary },
    { title: 'Key Issues', content: hydratedReport.keyIssues },
    { title: 'Business Impact', content: hydratedReport.businessImpact },
    { title: 'Recommended Next Steps', content: hydratedReport.recommendations },
  ].filter((s) => s.content)

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center rounded-full border border-border bg-secondary/50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Full audit report
          </div>
          <h3 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Client-ready audit findings
          </h3>

          <p className="mt-1 text-sm text-muted-foreground">
            Prepared by <span className="font-medium text-foreground">{profileValues.yourName}</span>
            {profileValues.yourCompany !== 'Your Company' && (
              <>
                {' '}
                · <span className="text-secondary-foreground">{profileValues.yourCompany}</span>
              </>
            )}
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            Audit target:{' '}
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-blue-400 transition hover:text-blue-300"
            >
              {url}
            </a>
          </p>

          <p className="mt-2 text-xs text-muted-foreground">
            Viewing <span className="font-semibold text-secondary-foreground">{modeLabel}</span> score
            view inside the report. Overall quick health remains based on mobile.
          </p>
        </div>

        {scoreItems.length > 0 && (
          <div className="hidden flex-shrink-0 flex-wrap gap-2 sm:flex">
            {scoreItems.map((item) => (
              <div
                key={item.label}
                className={`min-w-[72px] rounded-xl border px-3 py-2 text-center ${getScoreBg(item.value)}`}
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {item.label}
                </p>
                <p className={`mt-1 text-xl font-bold leading-none ${getScoreStyle(item.value)}`}>
                  {item.value}
                </p>
                <p className={`mt-0.5 text-[10px] font-medium ${getScoreLabel(item.value).colour}`}>
                  {getScoreLabel(item.value).text}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-secondary/20 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <p className="text-sm font-semibold text-foreground">Download this report</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Save as PDF to send to your client, or export to Excel/CSV for your records.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-shrink-0">
          <button
            onClick={() => exportToPDF(url, scores, hydratedReport, profile, auditMode)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_6px_20px_rgba(37,99,235,0.22)] transition hover:-translate-y-0.5 hover:bg-blue-500 active:translate-y-0"
          >
            <span aria-hidden="true">📄</span>
            Download PDF
          </button>

          <button
            onClick={() => exportToExcel(url, scores, hydratedReport, profile, auditMode)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-secondary/60 px-4 py-2.5 text-sm font-semibold text-foreground transition hover:-translate-y-0.5 hover:bg-secondary active:translate-y-0"
          >
            <span aria-hidden="true">📊</span>
            Export to Excel
          </button>
        </div>
      </div>

      <p className="max-w-2xl rounded-xl border border-border bg-secondary/20 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
        💡 <span className="font-medium text-secondary-foreground">How to use this report:</span> Each
        section below breaks down a different part of the site audit — from the headline
        findings through to specific issues and a clear action plan. Tap a section to expand.
      </p>

      <div className="grid grid-cols-1 gap-4">
        {sections.map((section, index) => (
          <ReportSection
            key={section.title}
            title={section.title}
            config={SECTION_CONFIG[section.title]}
            index={index}
            content={section.content}
            defaultOpen={index === 0}
          />
        ))}
      </div>

      {scoreItems.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-border bg-secondary/20">
          <button
            type="button"
            onClick={() => setScoresOpen((v) => !v)}
            className="flex w-full items-center justify-between gap-4 p-5 text-left sm:p-6"
            aria-expanded={scoresOpen}
          >
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Score breakdown
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {modeLabel} Lighthouse scores
              </p>
            </div>
            <ChevronDown
              className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 ${
                scoresOpen ? 'rotate-0' : '-rotate-90'
              }`}
              aria-hidden="true"
            />
          </button>

          {scoresOpen && (
            <div className="border-t border-border px-5 pb-5 sm:px-6 sm:pb-6">
              <div className="mb-4 flex flex-col gap-1 pt-4 sm:flex-row sm:items-end sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  Matched to your selected score view.
                </p>
                <p className="text-[11px] text-muted-foreground/70">
                  Source: Google Lighthouse ({modeLabel.toLowerCase()})
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {scoreItems.map((item) => {
                  const label = getScoreLabel(item.value)
                  return (
                    <div key={item.label} className={`rounded-xl border p-4 ${getScoreBg(item.value)}`}>
                      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        {item.label}
                      </p>
                      <p className={`text-3xl font-bold leading-none tabular-nums ${getScoreStyle(item.value)}`}>
                        {item.value}
                      </p>
                      <p className={`mt-1 text-[11px] font-semibold ${label.colour}`}>{label.text}</p>
                      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-border/60">
                        <div
                          className={`h-2 rounded-full transition-all duration-700 ${getScoreBar(item.value)}`}
                          style={{ width: `${item.value}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="mt-4 rounded-xl border border-border bg-card/50 px-4 py-3">
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  <span className="font-semibold text-secondary-foreground">What these scores mean: </span>
                  <span className="font-medium text-emerald-400">70–100</span> is strong.{' '}
                  <span className="font-medium text-amber-400">50–69</span> means noticeable
                  issues.{' '}
                  <span className="font-medium text-rose-400">0–49</span> is poor — likely losing
                  leads because of it.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <div
        className={`overflow-hidden rounded-2xl border ${
          shouldNudgeRebuild
            ? 'border-violet-500/25 bg-violet-500/[0.06]'
            : 'border-border bg-secondary/20'
        }`}
      >
        <button
          type="button"
          onClick={() => setTechOpen((v) => !v)}
          className="flex w-full items-start justify-between gap-4 p-5 text-left sm:p-6"
          aria-expanded={techOpen}
        >
          <div className="flex items-start gap-4">
            <div
              className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-lg ${
                shouldNudgeRebuild ? 'bg-violet-500/10 text-violet-300' : 'bg-secondary text-secondary-foreground'
              }`}
            >
              🧱
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Tech options
              </p>
              <h4 className="mt-1 text-base font-bold text-foreground">
                Could this site run on better tech?
              </h4>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Three sensible paths: improve the existing setup, modernise, or rebuild.
              </p>
            </div>
          </div>
          <ChevronDown
            className={`mt-1 h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 ${
              techOpen ? 'rotate-0' : '-rotate-90'
            }`}
            aria-hidden="true"
          />
        </button>

        {techOpen && (
          <div className="border-t border-border px-5 pb-5 sm:px-6 sm:pb-6">
            <div className="grid gap-3 pt-4 md:grid-cols-3">
              {techOptions.map((opt) => (
                <div key={opt.tier} className="rounded-xl border border-border bg-card/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-foreground">{opt.tier}</p>
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${opt.accent}`}>
                      {opt.badge}
                    </span>
                  </div>
                  <ul className="mt-3 space-y-2">
                    {opt.items.map((t) => (
                      <li key={t} className="flex items-start gap-2 text-sm text-secondary-foreground">
                        <span className="mt-[7px] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-muted-foreground" />
                        <span className="leading-relaxed">{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {shouldNudgeRebuild && (
              <p className="mt-4 rounded-xl border border-violet-500/20 bg-violet-500/10 px-4 py-3 text-xs leading-relaxed text-violet-200">
                This site is scoring poorly on mobile/overall. A modern rebuild often delivers the
                fastest, most reliable improvement.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.04] p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-lg text-blue-300">
            💬
          </div>
          <div>
            <h4 className="mb-1 text-base font-bold text-foreground">What happens next?</h4>
            <p className="text-sm leading-relaxed text-muted-foreground">
              This report gives you everything you need to start a conversation. The
              issues are real, the impact is commercial, and the fixes are straightforward
              for an experienced developer.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}