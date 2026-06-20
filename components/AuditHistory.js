'use client'

import { useEffect, useState } from 'react'
import { getScoreStyles } from '../lib/scoreColors'

const STORAGE_KEY = 'siteSignalAuditHistory'
const MAX_HISTORY_ITEMS = 50

const STATUS_OPTIONS = ['Saved', 'Outreach Sent', 'Follow Up', 'Meeting Booked', 'Won', 'Lost']

const STATUS_STYLES = {
  Saved: 'bg-slate-500/10 text-secondary-foreground border-slate-500/20',
  'Outreach Sent': 'bg-blue-500/10 text-blue-300 border-blue-500/20',
  'Follow Up': 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  'Meeting Booked': 'bg-purple-500/10 text-purple-300 border-purple-500/20',
  Won: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  Lost: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
}

function getScoreColour(score) {
  return getScoreStyles(score).text
}

function getScoreBg(score) {
  return getScoreStyles(score).panel
}

function getScoreColourHex(score) {
  return getScoreStyles(score).hex
}

function getScoreLabelText(score) {
  return getScoreStyles(score).label
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDateLong(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function safeReadHistory() {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    console.error('Failed to read audit history:', error)
    return []
  }
}

function safeWriteHistory(history) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
  } catch (error) {
    console.error('Failed to write audit history:', error)
  }
}

function getFormatLabel(key) {
  if (key === 'coldEmail') return 'Cold Email'
  if (key === 'followUpEmail') return 'Follow-up'
  if (key === 'callScript') return 'Call Script'
  if (key === 'directMessage') return 'Direct Message'
  return key
}

function normaliseAuditEntry(entry, index = 0) {
  const isNestedAuditShape = entry?.scores && entry?.aiReport

  if (isNestedAuditShape) {
    return {
      id: entry?.id || `audit_${Date.now()}_${index}`,
      savedAt: entry?.date || entry?.savedAt || new Date().toISOString(),
      url: entry?.url || '',
      scores: entry?.scores ?? null,
      overallScore: entry?.scores?.overallScore ?? 0,
      performance: entry?.scores?.mobile?.performance ?? 0,
      seo: entry?.scores?.mobile?.seo ?? 0,
      accessibility: entry?.scores?.mobile?.accessibility ?? 0,
      bestPractices: entry?.scores?.mobile?.bestPractices ?? 0,
      mobilePerformance: entry?.scores?.mobile?.performance ?? 0,
      desktopPerformance: entry?.scores?.desktop?.performance ?? 0,
      report: entry?.aiReport ?? null,
      outreach: entry?.outreach ?? null,
      usedFormats: entry?.usedFormats ?? {},
      status: entry?.status ?? 'Saved',
      notes: entry?.notes ?? '',
    }
  }

  return {
    id: entry?.id || `audit_${Date.now()}_${index}`,
    savedAt: entry?.savedAt || entry?.date || new Date().toISOString(),
    url: entry?.url || '',
    scores: entry?.scores ?? null,
    overallScore: entry?.overallScore ?? entry?.scores?.overallScore ?? 0,
    performance:
      entry?.performance ??
      entry?.mobilePerformance ??
      entry?.scores?.mobile?.performance ??
      0,
    seo: entry?.seo ?? entry?.scores?.mobile?.seo ?? 0,
    accessibility:
      entry?.accessibility ??
      entry?.scores?.mobile?.accessibility ??
      0,
    bestPractices:
      entry?.bestPractices ??
      entry?.scores?.mobile?.bestPractices ??
      0,
    mobilePerformance:
      entry?.mobilePerformance ??
      entry?.performance ??
      entry?.scores?.mobile?.performance ??
      0,
    desktopPerformance:
      entry?.desktopPerformance ??
      entry?.scores?.desktop?.performance ??
      0,
    report: entry?.report ?? entry?.aiReport ?? null,
    outreach: entry?.outreach ?? null,
    usedFormats: entry?.usedFormats ?? {},
    status: entry?.status ?? 'Saved',
    notes: entry?.notes ?? '',
  }
}

function exportEntryToPDF(entry) {
  const url = entry.url ?? ''
  const date = formatDateLong(entry.savedAt)
  const overall = entry.overallScore ?? 0
  const report = entry.report ?? {}

  const scoreItems = [
    { label: 'Performance', value: entry.performance ?? 0 },
    { label: 'SEO', value: entry.seo ?? 0 },
    { label: 'Accessibility', value: entry.accessibility ?? 0 },
    { label: 'Best Practices', value: entry.bestPractices ?? 0 },
  ]

  const sections = [
    { title: 'Executive Summary', content: report.executiveSummary, emoji: '📋' },
    { title: 'Key Issues', content: report.keyIssues, emoji: '⚠️' },
    { title: 'Business Impact', content: report.businessImpact, emoji: '💼' },
    { title: 'Recommended Next Steps', content: report.recommendations, emoji: '🚀' },
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

  const sectionsHtml =
    sections.length > 0
      ? sections
          .map((section, index) => {
            const contentHtml = Array.isArray(section.content)
              ? `<ul>${section.content.map((item) => `<li>${item}</li>`).join('')}</ul>`
              : typeof section.content === 'string'
                ? `<p>${section.content}</p>`
                : ''

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
      : `<div class="section"><p>Full report data not available. Reopen the report and download from there.</p></div>`

  const notesHtml = entry.notes
    ? `<div class="notes-block"><h4>📝 Notes</h4><p>${entry.notes}</p></div>`
    : ''

  const html = buildPDFShell({
    title: `Website Audit Report — ${url}`,
    coverHtml: `
      <div class="header">
        <div class="brand">
          <div class="brand-icon">🎯</div>
          <div>
            <div class="brand-name">SiteSignal</div>
            <div class="brand-sub">Website Audit Report</div>
          </div>
        </div>
        <h1>Website Audit Report</h1>
        <p class="prepared-for">Prepared for audit history export</p>
        <a class="url-link" href="${url}" target="_blank">${url}</a>
        <p class="report-date-single">Generated on ${date}</p>
        <span class="status-badge">${entry.status ?? 'Saved'}</span>
      </div>

      <div class="overall-banner">
        <div class="overall-left">
          <h2>Overall Quick Health</h2>
          <p>Based on Google Lighthouse mobile audit.</p>
        </div>
        <div class="overall-score-circle" style="border-color:${getScoreColourHex(overall)}">
          <span class="overall-score-number" style="color:${getScoreColourHex(overall)}">${overall}</span>
          <span class="overall-score-sub">/100</span>
        </div>
      </div>

      <div class="scores-grid">${scoresHtml}</div>

      <div class="perf-row">
        <div class="perf-card">
          <div class="perf-label">📱 Mobile Performance</div>
          <div class="perf-score" style="color:${getScoreColourHex(entry.mobilePerformance ?? 0)}">
            ${entry.mobilePerformance ?? 0}<span style="font-size:14px;color:#94a3b8">/100</span>
          </div>
        </div>
        <div class="perf-card">
          <div class="perf-label">🖥️ Desktop Performance</div>
          <div class="perf-score" style="color:${getScoreColourHex(entry.desktopPerformance ?? 0)}">
            ${entry.desktopPerformance ?? 0}<span style="font-size:14px;color:#94a3b8">/100</span>
          </div>
        </div>
      </div>

      ${notesHtml}
      ${sectionsHtml}

      <div class="next-steps-banner">
        <h4>💬 What happens next?</h4>
        <p>This report gives you everything you need to start a conversation. The issues are real, the impact is commercial, and the fixes are straightforward for an experienced developer.</p>
      </div>

      <div class="footer">
        <p>Generated by <span class="footer-brand">SiteSignal</span> · Website Audit Tool</p>
        <p>${url} · ${date}</p>
      </div>
    `,
  })

  const blob = new Blob([html], { type: 'text/html;charset=utf-8;' })
  window.open(URL.createObjectURL(blob), '_blank')
}

function exportAllToPDF(history) {
  if (!history.length) return

  const date = new Date().toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const summaryRows = history
    .map(
      (entry, i) => `
    <tr>
      <td>${i + 1}</td>
      <td class="tbl-url">${entry.url}</td>
      <td class="tbl-score" style="color:${getScoreColourHex(entry.overallScore ?? 0)}">${entry.overallScore ?? 0}</td>
      <td style="color:${getScoreColourHex(entry.performance ?? 0)}">${entry.performance ?? 0}</td>
      <td style="color:${getScoreColourHex(entry.seo ?? 0)}">${entry.seo ?? 0}</td>
      <td style="color:${getScoreColourHex(entry.accessibility ?? 0)}">${entry.accessibility ?? 0}</td>
      <td style="color:${getScoreColourHex(entry.bestPractices ?? 0)}">${entry.bestPractices ?? 0}</td>
      <td><span class="tbl-status">${entry.status ?? 'Saved'}</span></td>
      <td>${formatDateLong(entry.savedAt)}</td>
    </tr>
  `
    )
    .join('')

  const reportPages = history
    .map((entry, index) => {
      const overall = entry.overallScore ?? 0
      const report = entry.report ?? {}

      const scoreItems = [
        { label: 'Performance', value: entry.performance ?? 0 },
        { label: 'SEO', value: entry.seo ?? 0 },
        { label: 'Accessibility', value: entry.accessibility ?? 0 },
        { label: 'Best Practices', value: entry.bestPractices ?? 0 },
      ]

      const sections = [
        { title: 'Executive Summary', content: report.executiveSummary, emoji: '📋' },
        { title: 'Key Issues', content: report.keyIssues, emoji: '⚠️' },
        { title: 'Business Impact', content: report.businessImpact, emoji: '💼' },
        { title: 'Recommended Next Steps', content: report.recommendations, emoji: '🚀' },
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

      const sectionsHtml =
        sections.length > 0
          ? sections
              .map((section, i) => {
                const contentHtml = Array.isArray(section.content)
                  ? `<ul>${section.content.map((item) => `<li>${item}</li>`).join('')}</ul>`
                  : typeof section.content === 'string'
                    ? `<p>${section.content}</p>`
                    : ''

                return `
            <div class="section">
              <div class="section-header">
                <span class="section-number">${i + 1}</span>
                <span class="section-emoji">${section.emoji}</span>
                <h3>${section.title}</h3>
              </div>
              ${contentHtml}
            </div>
          `
              })
              .join('')
          : `<div class="section"><p>Full report data not available for this entry.</p></div>`

      const notesHtml = entry.notes
        ? `<div class="notes-block"><h4>📝 Notes</h4><p>${entry.notes}</p></div>`
        : ''

      return `
      <div class="page-break">
        <div class="report-header">
          <div class="report-meta">
            <div class="report-number">Report ${index + 1} of ${history.length}</div>
            <h2 class="report-url">${entry.url}</h2>
            <p class="report-date">Audited: ${formatDateLong(entry.savedAt)}</p>
            <span class="status-badge">${entry.status ?? 'Saved'}</span>
          </div>
          <div class="overall-score-circle" style="border-color:${getScoreColourHex(overall)}">
            <span class="overall-score-number" style="color:${getScoreColourHex(overall)}">${overall}</span>
            <span class="overall-score-sub">/100</span>
          </div>
        </div>

        <div class="scores-grid">${scoresHtml}</div>

        <div class="perf-row">
          <div class="perf-card">
            <div class="perf-label">📱 Mobile</div>
            <div class="perf-score" style="color:${getScoreColourHex(entry.mobilePerformance ?? 0)}">
              ${entry.mobilePerformance ?? 0}<span style="font-size:13px;color:#94a3b8">/100</span>
            </div>
          </div>
          <div class="perf-card">
            <div class="perf-label">🖥️ Desktop</div>
            <div class="perf-score" style="color:${getScoreColourHex(entry.desktopPerformance ?? 0)}">
              ${entry.desktopPerformance ?? 0}<span style="font-size:13px;color:#94a3b8">/100</span>
            </div>
          </div>
        </div>

        ${notesHtml}
        ${sectionsHtml}
      </div>
    `
    })
    .join('')

  const html = buildPDFShell({
    title: 'All Audit Reports — SiteSignal',
    coverHtml: `
      <div class="cover">
        <div class="brand">
          <div class="brand-icon">🎯</div>
          <div>
            <div class="brand-name">SiteSignal</div>
            <div class="brand-sub">Website Audit Reports</div>
          </div>
        </div>
        <h1>Full Audit Report Bundle</h1>
        <p class="cover-sub">${history.length} website audit${history.length !== 1 ? 's' : ''} — all reports in one document</p>
        <p class="cover-date">Generated on ${date}</p>
      </div>

      <div class="summary-section">
        <h2>📋 Summary — All ${history.length} Audits</h2>
        <table class="summary-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Website</th>
              <th>Overall</th>
              <th>Perf</th>
              <th>SEO</th>
              <th>A11y</th>
              <th>BP</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>${summaryRows}</tbody>
        </table>
      </div>

      ${reportPages}

      <div class="doc-footer">
        <p>Generated by <span class="doc-footer-brand">SiteSignal</span> · Website Audit Tool</p>
        <p>${history.length} reports · ${date}</p>
      </div>
    `,
  })

  const blob = new Blob([html], { type: 'text/html;charset=utf-8;' })
  window.open(URL.createObjectURL(blob), '_blank')
}

function buildPDFShell({ title, coverHtml }) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
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

    .cover {
      border-bottom: 3px solid #2563eb;
      padding-bottom: 28px;
      margin-bottom: 36px;
    }

    .cover h1 {
      font-size: 32px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 8px;
      line-height: 1.15;
    }

    .cover-sub { font-size: 14px; color: #64748b; margin-bottom: 4px; }
    .cover-date { font-size: 12px; color: #94a3b8; }

    .summary-section { margin-bottom: 40px; }

    .summary-section h2 {
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e2e8f0;
    }

    .summary-table { width: 100%; border-collapse: collapse; font-size: 12px; }

    .summary-table th {
      text-align: left;
      padding: 8px 10px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #64748b;
    }

    .summary-table td {
      padding: 8px 10px;
      border: 1px solid #e2e8f0;
      color: #475569;
      vertical-align: middle;
    }

    .summary-table tr:nth-child(even) td { background: #f8fafc; }
    .tbl-url { font-weight: 600; color: #0f172a; max-width: 260px; }
    .tbl-score { font-weight: 800; font-size: 14px; }
    .tbl-status {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 10px;
      font-weight: 700;
      background: #eff6ff;
      color: #2563eb;
    }

    .header {
      border-bottom: 3px solid #2563eb;
      padding-bottom: 24px;
      margin-bottom: 32px;
    }

    .report-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 20px;
      margin-bottom: 24px;
    }

    .report-number {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      color: #2563eb;
      margin-bottom: 4px;
    }

    .report-url {
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 4px;
      word-break: break-all;
    }

    .report-date { font-size: 12px; color: #94a3b8; margin-bottom: 6px; }

    .brand { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }

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

    .brand-name { font-size: 16px; font-weight: 700; color: #1e293b; }

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

    .prepared-for { font-size: 13px; color: #64748b; margin-bottom: 4px; }
    .url-link { color: #2563eb; font-weight: 600; font-size: 14px; text-decoration: none; }
    .report-date-single { font-size: 12px; color: #94a3b8; margin-top: 4px; }

    .status-badge {
      display: inline-block;
      margin-top: 8px;
      padding: 4px 12px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      background: #eff6ff;
      color: #2563eb;
      border: 1px solid #bfdbfe;
      text-transform: uppercase;
      letter-spacing: 0.08em;
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

    .overall-left h2 { font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
    .overall-left p { font-size: 12px; color: #64748b; }

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

    .overall-score-number { font-size: 26px; font-weight: 800; line-height: 1; }
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
      margin-bottom: 16px;
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

    .score-number { font-size: 28px; font-weight: 800; line-height: 1; margin-bottom: 4px; }
    .score-tag { font-size: 11px; font-weight: 600; }

    .perf-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 16px;
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

    .perf-score { font-size: 24px; font-weight: 800; }

    .notes-block {
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 12px;
      padding: 16px 20px;
      margin-bottom: 16px;
    }

    .notes-block h4 { font-size: 13px; font-weight: 700; color: #92400e; margin-bottom: 6px; }
    .notes-block p { font-size: 13px; color: #78350f; line-height: 1.6; }

    .section {
      margin-bottom: 16px;
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

    .section-emoji { font-size: 18px; }
    .section h3 { font-size: 16px; font-weight: 700; color: #0f172a; }
    .section p { color: #475569; font-size: 13px; line-height: 1.7; }
    .section ul { list-style: none; padding: 0; }

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

    .next-steps-banner {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 12px;
      padding: 20px 24px;
      margin-top: 24px;
    }

    .next-steps-banner h4 { font-size: 15px; font-weight: 700; color: #1e40af; margin-bottom: 6px; }
    .next-steps-banner p { font-size: 13px; color: #3b82f6; line-height: 1.6; }

    .page-break { page-break-before: always; padding-top: 32px; }

    .footer, .doc-footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .footer p, .doc-footer p { font-size: 11px; color: #94a3b8; }
    .footer-brand, .doc-footer-brand { font-weight: 700; color: #2563eb; }

    @media print {
      body { padding: 20px; }
      .page-break { page-break-before: always; padding-top: 20px; }
      @page { margin: 1cm; size: A4; }
    }
  </style>
</head>
<body>
  ${coverHtml}
  <script>
    window.onload = function () {
      setTimeout(function () { window.print() }, 600)
    }
  </script>
</body>
</html>
`
}

function exportEntryToExcel(entry) {
  const url = entry.url ?? ''
  const date = formatDateLong(entry.savedAt)
  const report = entry.report ?? {}
  const esc = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`
  const rows = []

  rows.push([esc('WEBSITE AUDIT REPORT'), '', '', ''])
  rows.push([esc(`URL: ${url}`), '', '', ''])
  rows.push([esc(`Generated: ${date}`), '', '', ''])
  rows.push([esc(`Status: ${entry.status ?? 'Saved'}`), '', '', ''])
  rows.push(['', '', '', ''])

  rows.push([esc('OVERALL SCORE'), esc('STATUS'), '', ''])
  rows.push([esc(entry.overallScore ?? 0), esc(getScoreLabelText(entry.overallScore ?? 0)), '', ''])
  rows.push(['', '', '', ''])

  rows.push([esc('SCORE BREAKDOWN'), '', '', ''])
  rows.push([esc('Category'), esc('Score'), esc('Status'), esc('Source')])
  rows.push([
    esc('Performance (Mobile)'),
    esc(entry.performance ?? 0),
    esc(getScoreLabelText(entry.performance ?? 0)),
    esc('Google Lighthouse'),
  ])
  rows.push([
    esc('SEO (Mobile)'),
    esc(entry.seo ?? 0),
    esc(getScoreLabelText(entry.seo ?? 0)),
    esc('Google Lighthouse'),
  ])
  rows.push([
    esc('Accessibility (Mobile)'),
    esc(entry.accessibility ?? 0),
    esc(getScoreLabelText(entry.accessibility ?? 0)),
    esc('Google Lighthouse'),
  ])
  rows.push([
    esc('Best Practices (Mobile)'),
    esc(entry.bestPractices ?? 0),
    esc(getScoreLabelText(entry.bestPractices ?? 0)),
    esc('Google Lighthouse'),
  ])
  rows.push([
    esc('Performance (Mobile)'),
    esc(entry.mobilePerformance ?? 0),
    esc(getScoreLabelText(entry.mobilePerformance ?? 0)),
    esc('Google Lighthouse'),
  ])
  rows.push([
    esc('Performance (Desktop)'),
    esc(entry.desktopPerformance ?? 0),
    esc(getScoreLabelText(entry.desktopPerformance ?? 0)),
    esc('Google Lighthouse'),
  ])
  rows.push(['', '', '', ''])

  if (entry.notes) {
    rows.push([esc('NOTES'), '', '', ''])
    rows.push([esc(entry.notes), '', '', ''])
    rows.push(['', '', '', ''])
  }

  if (report.executiveSummary) {
    rows.push([esc('EXECUTIVE SUMMARY'), '', '', ''])
    rows.push([esc(report.executiveSummary), '', '', ''])
    rows.push(['', '', '', ''])
  }

  if (Array.isArray(report.keyIssues)) {
    rows.push([esc('KEY ISSUES'), '', '', ''])
    report.keyIssues.forEach((item, i) => rows.push([esc(`${i + 1}. ${item}`), '', '', '']))
    rows.push(['', '', '', ''])
  }

  if (Array.isArray(report.businessImpact)) {
    rows.push([esc('BUSINESS IMPACT'), '', '', ''])
    report.businessImpact.forEach((item, i) => rows.push([esc(`${i + 1}. ${item}`), '', '', '']))
    rows.push(['', '', '', ''])
  }

  if (Array.isArray(report.recommendations)) {
    rows.push([esc('RECOMMENDED NEXT STEPS'), '', '', ''])
    report.recommendations.forEach((item, i) => rows.push([esc(`${i + 1}. ${item}`), '', '', '']))
    rows.push(['', '', '', ''])
  }

  rows.push([esc('Generated by SiteSignal — Website Audit Tool'), '', '', ''])

  const csv = rows.map((r) => r.join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const hostname = url.replace(/https?:\/\//, '').replace(/\/$/, '').replace(/\./g, '-')
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `audit-report-${hostname}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function exportAllCSV(history) {
  if (!history.length) return

  const headers = [
    'URL',
    'Date',
    'Overall',
    'Performance',
    'SEO',
    'Accessibility',
    'Best Practices',
    'Mobile',
    'Desktop',
    'Status',
    'Notes',
  ]

  const rows = history.map((h) => [
    h.url,
    formatDate(h.savedAt),
    h.overallScore,
    h.performance,
    h.seo,
    h.accessibility,
    h.bestPractices,
    h.mobilePerformance,
    h.desktopPerformance,
    h.status,
    h.notes,
  ])

  const csv = [headers, ...rows]
    .map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = 'audit-history.csv'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function saveAuditToHistory(auditData) {
  try {
    const existing = safeReadHistory().map((entry, index) => normaliseAuditEntry(entry, index))

    const entry = normaliseAuditEntry({
      id: `audit_${Date.now()}`,
      savedAt: new Date().toISOString(),
      url: auditData?.url,
      scores: auditData?.scores ?? null,
      overallScore: auditData?.scores?.overallScore ?? 0,
      performance: auditData?.scores?.mobile?.performance ?? 0,
      seo: auditData?.scores?.mobile?.seo ?? 0,
      accessibility: auditData?.scores?.mobile?.accessibility ?? 0,
      bestPractices: auditData?.scores?.mobile?.bestPractices ?? 0,
      mobilePerformance: auditData?.scores?.mobile?.performance ?? 0,
      desktopPerformance: auditData?.scores?.desktop?.performance ?? 0,
      report: auditData?.aiReport ?? null,
      outreach: auditData?.outreach || null,
      usedFormats: {},
      status: 'Saved',
      notes: '',
    })

    const updated = [entry, ...existing].slice(0, MAX_HISTORY_ITEMS)
    safeWriteHistory(updated)
    return entry.id
  } catch (error) {
    console.error('Failed to save audit to history:', error)
    return null
  }
}

export function updateOutreachInHistory(entryId, outreach) {
  try {
    const existing = safeReadHistory().map((entry, index) => normaliseAuditEntry(entry, index))
    const updated = existing.map((e) => (e.id === entryId ? { ...e, outreach } : e))
    safeWriteHistory(updated)
  } catch (error) {
    console.error('Failed to update outreach in history:', error)
  }
}

export function markFormatUsedInHistory(entryId, formatKey) {
  try {
    const existing = safeReadHistory().map((entry, index) => normaliseAuditEntry(entry, index))
    const updated = existing.map((e) =>
      e.id === entryId
        ? { ...e, usedFormats: { ...(e.usedFormats || {}), [formatKey]: true } }
        : e
    )
    safeWriteHistory(updated)
  } catch (error) {
    console.error('Failed to mark format used in history:', error)
  }
}

export default function AuditHistory({ onReopen, refreshKey = 0 }) {
  const [history, setHistory] = useState([])
  const [expanded, setExpanded] = useState(null)
  const [search, setSearch] = useState('')
  const [collapsed, setCollapsed] = useState(false)

  const loadHistory = () => {
    const saved = safeReadHistory()
    const normalised = saved.map((entry, index) => normaliseAuditEntry(entry, index))
    setHistory(normalised)
    safeWriteHistory(normalised)
  }

  useEffect(() => {
    loadHistory()
  }, [refreshKey])

  const persist = (updated) => {
    const trimmed = updated.slice(0, MAX_HISTORY_ITEMS)
    setHistory(trimmed)
    safeWriteHistory(trimmed)
  }

  const updateEntry = (id, changes) => {
    persist(history.map((h) => (h.id === id ? { ...h, ...changes } : h)))
  }

  const deleteEntry = (id) => {
    if (confirm('Delete this audit from history?')) {
      persist(history.filter((h) => h.id !== id))
      if (expanded === id) setExpanded(null)
    }
  }

  const filtered = history.filter((h) =>
    h.url?.toLowerCase().includes(search.toLowerCase())
  )

  if (!history.length) return null

  return (
    <section
      id="audit-history-section"
      aria-labelledby="history-heading"
      className="overflow-hidden ss-panel-elevated"
    >
      <div className="relative overflow-hidden border-b border-white/[0.07] bg-secondary/30 px-5 py-5 sm:px-8 sm:py-6 md:px-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-purple-500/[0.10] blur-3xl"
        />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border border-border bg-secondary text-xl shadow-sm">
              🗂️
            </div>
            <div>
              <div className="mb-2 inline-flex items-center rounded-full border border-border bg-secondary/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-secondary-foreground">
                Audit History
              </div>
              <h2
                id="history-heading"
                className="text-xl font-bold tracking-tight text-foreground sm:text-2xl md:text-3xl"
              >
                Your saved audit reports
              </h2>
              {!collapsed && (
                <p className="mt-1 max-w-lg text-sm leading-relaxed text-muted-foreground">
                  Every audit you run is saved here. Download, track status, add notes, and
                  reopen any report.
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
            <span className="rounded-2xl border border-border bg-secondary/40 px-4 py-2 text-sm text-secondary-foreground">
              <span className="font-bold text-foreground">{history.length}</span> saved
            </span>

            {!collapsed && (
              <>
                <button
                  onClick={() => exportAllToPDF(history)}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_6px_16px_rgba(37,99,235,0.22)] transition hover:-translate-y-0.5 hover:bg-blue-500 active:translate-y-0"
                >
                  <span aria-hidden="true">📄</span>
                  All Reports PDF
                </button>

                <button
                  onClick={() => exportAllCSV(history)}
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary px-4 py-2 text-sm font-semibold text-foreground transition hover:-translate-y-0.5 hover:bg-white/[0.10] active:translate-y-0"
                >
                  <span aria-hidden="true">📊</span>
                  All Reports CSV
                </button>
              </>
            )}

            <button
              onClick={() => setCollapsed((prev) => !prev)}
              aria-label={collapsed ? 'Expand audit history' : 'Collapse audit history'}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground transition hover:bg-white/[0.10]"
            >
              {collapsed ? (
                <>
                  <span aria-hidden="true">▼</span>
                  Show
                </>
              ) : (
                <>
                  <span aria-hidden="true">▲</span>
                  Hide
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {!collapsed && (
        <div className="px-5 py-5 sm:px-8 sm:py-6 md:px-10 md:py-6">
          <div className="mb-5">
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                🔎
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by URL..."
                className="w-full rounded-xl border border-border bg-input py-3 pl-11 pr-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-white/[0.02] px-4 py-8 text-center">
              <p className="text-sm font-medium text-foreground">No audits match your search.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try a different domain or clear the search.
              </p>
            </div>
          ) : (
            <div className="space-y-3" role="list">
              {filtered.map((entry) => {
                const isOpen = expanded === entry.id
                const statusStyle = STATUS_STYLES[entry.status] ?? STATUS_STYLES.Saved
                const hasReport =
                  entry.report && (entry.report.executiveSummary || entry.report.keyIssues)

                return (
                  <article
                    key={entry.id}
                    role="listitem"
                    className="overflow-hidden rounded-2xl border border-border bg-secondary/30 transition-all duration-200 hover:border-white/[0.12] hover:bg-secondary/50"
                  >
                    <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1.5 flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusStyle}`}
                          >
                            {entry.status}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(entry.savedAt)}
                          </span>
                        </div>

                        <p className="truncate text-sm font-semibold text-foreground sm:text-base">
                          {entry.url || 'Untitled audit'}
                        </p>

                        {entry.usedFormats && Object.keys(entry.usedFormats).length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {Object.entries(entry.usedFormats).map(([key, used]) =>
                              used ? (
                                <span
                                  key={key}
                                  className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/[0.08] px-2.5 py-0.5 text-[10px] font-semibold text-emerald-300"
                                >
                                  ✓ {getFormatLabel(key)} sent
                                </span>
                              ) : null
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <div
                          className={`min-w-[64px] rounded-xl border px-3 py-2 text-center ${getScoreBg(entry.overallScore)}`}
                        >
                          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                            Overall
                          </p>
                          <p
                            className={`mt-0.5 text-xl font-bold leading-none ${getScoreColour(entry.overallScore)}`}
                          >
                            {entry.overallScore}
                          </p>
                        </div>

                        <div className="hidden grid-cols-2 gap-1.5 sm:grid">
                          {[
                            { l: 'Perf', v: entry.performance },
                            { l: 'SEO', v: entry.seo },
                            { l: 'A11y', v: entry.accessibility },
                            { l: 'BP', v: entry.bestPractices },
                          ].map(({ l, v }) => (
                            <div
                              key={l}
                              className="rounded-lg border border-white/[0.07] bg-secondary/30 px-2 py-1 text-center"
                            >
                              <p className="text-[10px] text-muted-foreground">{l}</p>
                              <p className={`text-sm font-bold ${getScoreColour(v)}`}>{v}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {hasReport && onReopen && (
                          <button
                            onClick={() => onReopen(entry)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-[0_6px_16px_rgba(37,99,235,0.22)] transition hover:bg-blue-500"
                          >
                            <span aria-hidden="true">📊</span>
                            Reopen
                          </button>
                        )}

                        <button
                          onClick={() => exportEntryToPDF(entry)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-blue-500/20 bg-blue-500/[0.08] px-3 py-2 text-xs font-semibold text-blue-300 transition hover:bg-blue-500/[0.14]"
                        >
                          <span aria-hidden="true">📄</span>
                          PDF
                        </button>

                        <button
                          onClick={() => exportEntryToExcel(entry)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.08] px-3 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/[0.14]"
                        >
                          <span aria-hidden="true">📊</span>
                          Excel
                        </button>

                        <button
                          onClick={() => setExpanded(isOpen ? null : entry.id)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-secondary/50 px-3 py-2 text-xs font-semibold text-secondary-foreground transition hover:bg-secondary"
                        >
                          {isOpen ? '▲ Less' : '▼ More'}
                        </button>

                        <button
                          onClick={() => deleteEntry(entry.id)}
                          aria-label="Delete audit"
                          className="flex h-8 w-8 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/[0.06] text-rose-400 transition hover:bg-rose-500/[0.12]"
                        >
                          🗑
                        </button>
                      </div>
                    </div>

                    {isOpen && (
                      <div className="border-t border-white/[0.07] bg-white/[0.02] px-4 py-4 sm:px-5">
                        <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
                          <div>
                            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                              Status
                            </label>
                            <select
                              value={entry.status}
                              onChange={(e) => updateEntry(entry.id, { status: e.target.value })}
                              className="w-full rounded-xl border border-border bg-slate-950/60 px-3 py-2.5 text-sm text-foreground outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10"
                            >
                              {STATUS_OPTIONS.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                              Notes
                            </label>
                            <textarea
                              value={entry.notes}
                              onChange={(e) => updateEntry(entry.id, { notes: e.target.value })}
                              placeholder="Add notes about this audit..."
                              rows={3}
                              className="w-full resize-y rounded-xl border border-border bg-slate-950/60 px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10"
                            />
                          </div>
                        </div>

                        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                          {[
                            { l: 'Performance', v: entry.performance },
                            { l: 'SEO', v: entry.seo },
                            { l: 'Accessibility', v: entry.accessibility },
                            { l: 'Best Practices', v: entry.bestPractices },
                          ].map(({ l, v }) => (
                            <div
                              key={l}
                              className={`rounded-xl border p-3 text-center ${getScoreBg(v)}`}
                            >
                              <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                                {l}
                              </p>
                              <p className={`mt-1 text-lg font-bold ${getScoreColour(v)}`}>
                                {v}
                              </p>
                            </div>
                          ))}
                        </div>

                        <div className="mt-4 flex flex-col gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-xs text-muted-foreground">
                            📁{' '}
                            <span className="font-medium text-secondary-foreground">
                              Download this report
                            </span>{' '}
                            — PDF to send to the client, Excel for your records.
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => exportEntryToPDF(entry)}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-[0_4px_12px_rgba(37,99,235,0.22)] transition hover:bg-blue-500"
                            >
                              <span aria-hidden="true">📄</span>
                              Download PDF
                            </button>
                            <button
                              onClick={() => exportEntryToExcel(entry)}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-secondary px-4 py-2 text-xs font-semibold text-foreground transition hover:bg-white/[0.10]"
                            >
                              <span aria-hidden="true">📊</span>
                              Export Excel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          )}
        </div>
      )}
    </section>
  )
}