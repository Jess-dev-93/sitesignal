'use client'

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
        <div class="brand-name">sitesignal</div>
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
      Generated by <span class="footer-brand">${profileValues.yourCompany !== 'Your Company' ? profileValues.yourCompany : 'sitesignal'}</span>
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
          : 'sitesignal'
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
  if (!report) return null

  const hydratedReport = applyProfilePlaceholdersDeep(report, profile)
  const profileValues = getProfileFallbacks(profile)
  const scoreItems = buildScoreItems(scores, auditMode)
  const modeLabel = getModeLabel(auditMode)

  const sections = [
    { title: 'Executive Summary', content: hydratedReport.executiveSummary },
    { title: 'Key Issues', content: hydratedReport.keyIssues },
    { title: 'Business Impact', content: hydratedReport.businessImpact },
    { title: 'Recommended Next Steps', content: hydratedReport.recommendations },
  ].filter((s) => s.content)

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
            Full Audit Report
          </div>
          <h3 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
            Client-ready audit findings
          </h3>

          <p className="mt-1 text-sm text-slate-400">
            Prepared by <span className="font-medium text-white">{profileValues.yourName}</span>
            {profileValues.yourCompany !== 'Your Company' && (
              <>
                {' '}
                · <span className="text-slate-300">{profileValues.yourCompany}</span>
              </>
            )}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Audit target:{' '}
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-blue-300 transition hover:text-blue-200"
            >
              {url}
            </a>
          </p>

          <p className="mt-2 text-xs text-slate-500">
            Viewing <span className="font-semibold text-slate-300">{modeLabel}</span> score view
            inside the report. Overall Quick Health remains based on mobile.
          </p>
        </div>

        {scoreItems.length > 0 && (
          <div className="hidden flex-shrink-0 flex-wrap gap-2 sm:flex">
            {scoreItems.map((item) => (
              <div
                key={item.label}
                className={`min-w-[72px] rounded-xl border px-3 py-2 text-center ${getScoreBg(item.value)}`}
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
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

      <div className="flex flex-col gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <p className="text-sm font-semibold text-white">Download this report</p>
          <p className="mt-0.5 text-xs text-slate-400">
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
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.10] bg-white/[0.06] px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/[0.10] active:translate-y-0"
          >
            <span aria-hidden="true">📊</span>
            Export to Excel
          </button>
        </div>
      </div>

      <p className="max-w-2xl rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm leading-relaxed text-slate-400">
        💡 <span className="font-medium text-slate-300">How to use this report:</span> Each
        section below breaks down a different part of the site audit — from the headline
        findings through to specific issues and a clear action plan. Use this to brief a
        client, support a proposal, or prioritise your own work.
      </p>

      <div className="grid grid-cols-1 gap-4">
        {sections.map((section, index) => {
          const config = SECTION_CONFIG[section.title] ?? {
            icon: '📄',
            accent: 'border-white/[0.08] bg-white/[0.03]',
            iconBg: 'bg-white/[0.07] text-slate-300',
            dot: 'bg-slate-400',
            tagColour: 'border-white/10 bg-white/[0.05] text-slate-300',
            tag: 'Section',
            context: null,
          }

          return (
            <div key={section.title} className={`rounded-2xl border p-5 sm:p-6 ${config.accent}`}>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg ${config.iconBg}`}
                    >
                      {config.icon}
                    </div>
                    <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full border border-white/10 bg-slate-800 text-[9px] font-bold text-slate-300">
                      {index + 1}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-bold tracking-tight text-white sm:text-lg">
                      {section.title}
                    </h4>
                    {config.tag && (
                      <span
                        className={`mt-0.5 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${config.tagColour}`}
                      >
                        {config.tag}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {config.context && (
                <p className="mb-4 border-l-2 border-white/10 pl-3 text-xs italic leading-relaxed text-slate-500">
                  {config.context}
                </p>
              )}

              <div className="mb-4 h-px w-full bg-white/[0.06]" />

              {Array.isArray(section.content) ? (
                <ul className="space-y-3">
                  {section.content.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span
                        className={`mt-[7px] h-1.5 w-1.5 flex-shrink-0 rounded-full ${config.dot}`}
                      />
                      <span className="text-sm leading-relaxed text-slate-300">{item}</span>
                    </li>
                  ))}
                </ul>
              ) : typeof section.content === 'string' ? (
                <p className="text-sm leading-relaxed text-slate-300">{section.content}</p>
              ) : null}
            </div>
          )
        })}
      </div>

      {scoreItems.length > 0 && (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 sm:p-6">
          <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Score recap
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {modeLabel} scores — matched to your selected Score view.
              </p>
            </div>
            <p className="text-[11px] text-slate-600">
              Source: Google Lighthouse ({modeLabel.toLowerCase()})
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {scoreItems.map((item) => {
              const label = getScoreLabel(item.value)
              return (
                <div key={item.label} className={`rounded-xl border p-4 ${getScoreBg(item.value)}`}>
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {item.label}
                  </p>
                  <p className={`text-3xl font-bold leading-none tabular-nums ${getScoreStyle(item.value)}`}>
                    {item.value}
                  </p>
                  <p className={`mt-1 text-[11px] font-semibold ${label.colour}`}>{label.text}</p>
                  <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className={`h-1 rounded-full transition-all duration-700 ${getScoreBar(item.value)}`}
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
            <p className="text-[11px] leading-relaxed text-slate-500">
              <span className="font-semibold text-slate-400">What these scores mean: </span>
              <span className="font-medium text-emerald-400">70–100</span> is strong.{' '}
              <span className="font-medium text-amber-400">50–69</span> means noticeable
              issues that affect user experience and rankings.{' '}
              <span className="font-medium text-rose-400">0–49</span> is poor — the site is
              likely losing leads because of it. The recap above reflects your selected{' '}
              <span className="font-medium text-slate-300">{modeLabel.toLowerCase()}</span> mode,
              while the overall quick health score remains mobile-based.
            </p>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.04] p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-lg text-blue-300">
            💬
          </div>
          <div>
            <h4 className="mb-1 text-base font-bold text-white">What happens next?</h4>
            <p className="text-sm leading-relaxed text-slate-400">
              This report gives you everything you need to start a conversation. The
              issues are real, the impact is commercial, and the fixes are straightforward
              for an experienced developer. If you'd like to talk through what a project
              would look like — scope, timeline, and cost — get in touch and we can take
              it from there.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}