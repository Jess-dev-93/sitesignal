'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import {
  applyProfilePlaceholdersDeep,
  getProfileFallbacks,
} from '../lib/templateUtils'
import { getScoreStyles } from '../lib/scoreColors'
import { getDisplayAuditUrl } from '../lib/normaliseAuditUrl'

const SECTION_CONFIG = {
  'Executive Summary': {
    icon: '📋',
    accent: 'border-blue-500/20 bg-blue-500/[0.04]',
    iconBg: 'bg-blue-500/10 text-blue-300',
    dot: 'bg-blue-400',
    tagColour:
      'border-blue-500/20 bg-blue-500/[0.08] text-blue-300',
    tag: 'Overview',
    context:
      'A concise summary of the automated findings from this audit run.',
  },

  'Key Issues': {
    icon: '⚠️',
    accent: 'border-rose-500/20 bg-rose-500/[0.04]',
    iconBg: 'bg-rose-500/10 text-rose-300',
    dot: 'bg-rose-400',
    tagColour:
      'border-rose-500/20 bg-rose-500/[0.08] text-rose-300',
    tag: 'Findings',
    context:
      'These findings come from the available Lighthouse checks. Each should be validated before remediation decisions are made.',
  },

  'Business Impact': {
    icon: '💼',
    accent: 'border-amber-500/20 bg-amber-500/[0.04]',
    iconBg: 'bg-amber-500/10 text-amber-300',
    dot: 'bg-amber-400',
    tagColour:
      'border-amber-500/20 bg-amber-500/[0.08] text-amber-300',
    tag: 'Potential impact',
    context:
      'Potential user and business implications of the automated findings. These are considerations rather than confirmed outcomes.',
  },

  'Recommended Next Steps': {
    icon: '🚀',
    accent:
      'border-emerald-500/20 bg-emerald-500/[0.04]',
    iconBg: 'bg-emerald-500/10 text-emerald-300',
    dot: 'bg-emerald-400',
    tagColour:
      'border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-300',
    tag: 'Validation plan',
    context:
      'Proportionate next steps for validating the findings and identifying the right remediation priorities.',
  },
}

/* =====================================================
   SCORE HELPERS
===================================================== */

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

function getModeScores(
  scores,
  auditMode = 'mobile'
) {
  if (!scores) return null

  return auditMode === 'desktop'
    ? scores.desktop
    : scores.mobile
}

function getModeEvidence(
  scores,
  auditMode = 'mobile'
) {
  if (!scores?.evidence) {
    return null
  }

  return auditMode === 'desktop'
    ? scores.evidence.desktop
    : scores.evidence.mobile
}

function getModeLabel(
  auditMode = 'mobile'
) {
  return auditMode === 'desktop'
    ? 'Desktop'
    : 'Mobile'
}

/* =====================================================
   PROFILE / EXPORT HELPERS
===================================================== */

function getPreparedBy(profileValues) {
  const name =
    profileValues?.yourName &&
    profileValues.yourName !== 'Your Name'
      ? profileValues.yourName.trim()
      : ''

  const company =
    profileValues?.yourCompany &&
    profileValues.yourCompany !== 'Your Company'
      ? profileValues.yourCompany.trim()
      : ''

  return {
    name,
    company,
    label: [name, company]
      .filter(Boolean)
      .join(' · '),
  }
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function createExportHostname(url) {
  try {
    return new URL(url).hostname
      .replace(/^www\./, '')
      .replace(/\./g, '-')
  } catch {
    return 'website'
  }
}

/* =====================================================
   TECHNICAL FINDING HELPERS
===================================================== */

function getPriorityLabel(priority) {
  if (priority === 'high') {
    return 'High priority'
  }

  if (priority === 'medium') {
    return 'Medium priority'
  }

  return 'Low priority'
}

function getPriorityClasses(priority) {
  if (priority === 'high') {
    return {
      badge:
        'border-rose-500/30 bg-rose-500/10 text-rose-300',
      panel:
        'border-rose-500/20 bg-rose-500/[0.035]',
      dot: 'bg-rose-400',
    }
  }

  if (priority === 'medium') {
    return {
      badge:
        'border-amber-500/30 bg-amber-500/10 text-amber-300',
      panel:
        'border-amber-500/20 bg-amber-500/[0.035]',
      dot: 'bg-amber-400',
    }
  }

  return {
    badge:
      'border-blue-500/30 bg-blue-500/10 text-blue-300',
    panel:
      'border-blue-500/20 bg-blue-500/[0.035]',
    dot: 'bg-blue-400',
  }
}

function getPriorityHex(priority) {
  if (priority === 'high') {
    return '#e11d48'
  }

  if (priority === 'medium') {
    return '#d97706'
  }

  return '#2563eb'
}

function formatBytes(bytes) {
  if (
    typeof bytes !== 'number' ||
    !Number.isFinite(bytes) ||
    bytes <= 0
  ) {
    return null
  }

  if (bytes >= 1024 * 1024) {
    const mb =
      bytes / (1024 * 1024)

    return `${mb.toFixed(
      mb >= 10 ? 0 : 1
    )} MiB`
  }

  return `${Math.round(
    bytes / 1024
  )} KiB`
}

function formatMilliseconds(ms) {
  if (
    typeof ms !== 'number' ||
    !Number.isFinite(ms) ||
    ms <= 0
  ) {
    return null
  }

  if (ms >= 1000) {
    return `${(
      ms / 1000
    ).toFixed(2)} s`
  }

  return `${Math.round(ms)} ms`
}

function displayValueContainsBytes(
  displayValue
) {
  if (!displayValue) return false

  return /\b(?:KiB|MiB|KB|MB|bytes?)\b/i.test(
    String(displayValue)
  )
}

function displayValueContainsTime(
  displayValue
) {
  if (!displayValue) return false

  return /\b(?:ms|milliseconds?|seconds?|sec|s)\b/i.test(
    String(displayValue)
  )
}

function buildFindingEvidence(
  finding
) {
  const parts = []

  if (finding?.displayValue) {
    parts.push({
      label: 'Measured',
      value:
        finding.displayValue,
    })
  }

  const timeSaving =
    formatMilliseconds(
      finding?.savingsMs
    )

  if (
    timeSaving &&
    !displayValueContainsTime(
      finding?.displayValue
    )
  ) {
    parts.push({
      label: 'Potential time saving',
      value: timeSaving,
    })
  }

  const byteSaving =
    formatBytes(
      finding?.savingsBytes
    )

  if (
    byteSaving &&
    !displayValueContainsBytes(
      finding?.displayValue
    )
  ) {
    parts.push({
      label: 'Potential transfer saving',
      value: byteSaving,
    })
  }

  if (
    typeof finding?.affectedItemCount ===
      'number' &&
    finding.affectedItemCount > 0
  ) {
    parts.push({
      label: 'Affected items',
      value:
        String(
          finding.affectedItemCount
        ),
    })
  }

  return parts
}

function getFindingResources(finding) {
  const items =
    Array.isArray(
      finding?.items
    )
      ? finding.items
      : []

  const resources = []

  items.forEach((item) => {
    if (
      resources.length >= 3
    ) {
      return
    }

    if (
      typeof item?.url ===
        'string' &&
      item.url
    ) {
      resources.push({
        type: 'resource',
        value: item.url,
      })

      return
    }

    if (
      typeof item?.node?.selector ===
        'string' &&
      item.node.selector
    ) {
      resources.push({
        type: 'element',
        value:
          item.node.selector,
      })

      return
    }

    if (
      typeof item?.node?.nodeLabel ===
        'string' &&
      item.node.nodeLabel
    ) {
      resources.push({
        type: 'element',
        value:
          item.node.nodeLabel,
      })

      return
    }

    if (
      typeof item?.node?.snippet ===
        'string' &&
      item.node.snippet
    ) {
      resources.push({
        type: 'element',
        value:
          item.node.snippet,
      })
    }
  })

  return resources
}

function getTechnicalFindings(
  scores,
  auditMode = 'mobile',
  limit = 6
) {
  const evidence =
    getModeEvidence(
      scores,
      auditMode
    )

  const findings =
    Array.isArray(
      evidence?.topFindings
    )
      ? evidence.topFindings
      : []

  return findings.slice(
    0,
    limit
  )
}

/* =====================================================
   REPORT SECTION
===================================================== */

function ReportSection({
  title,
  config,
  index,
  content,
  defaultOpen = false,
}) {
  const [open, setOpen] =
    useState(defaultOpen)

  const sectionConfig =
    config ?? {
      icon: '📄',
      accent:
        'border-border bg-secondary/20',
      iconBg:
        'bg-secondary text-secondary-foreground',
      dot: 'bg-muted-foreground',
      tagColour:
        'border-border bg-secondary/50 text-muted-foreground',
      tag: 'Section',
      context: null,
    }

  const itemCount =
    Array.isArray(content)
      ? content.length
      : content
        ? 1
        : 0

  return (
    <div
      className={`overflow-hidden rounded-2xl border ${sectionConfig.accent}`}
    >
      <button
        type="button"
        onClick={() =>
          setOpen(
            (current) =>
              !current
          )
        }
        className="flex w-full items-start justify-between gap-4 p-5 text-left transition hover:bg-secondary/30 sm:p-6"
        aria-expanded={open}
      >
        <div className="flex min-w-0 items-start gap-3">
          <div className="relative flex-shrink-0">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg ${sectionConfig.iconBg}`}
            >
              {
                sectionConfig.icon
              }
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
                  {
                    sectionConfig.tag
                  }
                </span>
              )}

              <span className="text-[10px] font-medium text-muted-foreground">
                {itemCount}{' '}
                {itemCount === 1
                  ? 'item'
                  : 'items'}
              </span>
            </div>
          </div>
        </div>

        <ChevronDown
          className={`mt-1 h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 ${
            open
              ? 'rotate-0'
              : '-rotate-90'
          }`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div className="border-t border-border/60 px-5 pb-5 sm:px-6 sm:pb-6">
          {sectionConfig.context && (
            <p className="mb-4 mt-4 border-l-2 border-border pl-3 text-xs italic leading-relaxed text-muted-foreground">
              {
                sectionConfig.context
              }
            </p>
          )}

          {Array.isArray(
            content
          ) ? (
            <ul className="space-y-3">
              {content.map(
                (
                  item,
                  itemIndex
                ) => (
                  <li
                    key={`${title}-${itemIndex}`}
                    className="flex items-start gap-3 rounded-xl border border-border/50 bg-card/50 px-3 py-2.5"
                  >
                    <span
                      className={`mt-[7px] h-1.5 w-1.5 flex-shrink-0 rounded-full ${sectionConfig.dot}`}
                    />

                    <span className="text-sm leading-relaxed text-secondary-foreground">
                      {item}
                    </span>
                  </li>
                )
              )}
            </ul>
          ) : typeof content ===
            'string' ? (
            <p className="rounded-xl border border-border/50 bg-card/50 px-4 py-3 text-sm leading-relaxed text-secondary-foreground">
              {content}
            </p>
          ) : null}
        </div>
      )}
    </div>
  )
}

/* =====================================================
   TECHNICAL FINDINGS COMPONENT
===================================================== */

function TechnicalFindings({
  scores,
  auditMode = 'mobile',
}) {
  const [open, setOpen] =
    useState(true)

  const modeLabel =
    getModeLabel(auditMode)

  const findings =
    getTechnicalFindings(
      scores,
      auditMode,
      6
    )

  if (
    findings.length === 0
  ) {
    return null
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-violet-500/20 bg-violet-500/[0.035]">
      <button
        type="button"
        onClick={() =>
          setOpen(
            (current) =>
              !current
          )
        }
        className="flex w-full items-start justify-between gap-4 p-5 text-left transition hover:bg-secondary/20 sm:p-6"
        aria-expanded={open}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-lg">
            🧪
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-300">
              Lighthouse evidence
            </p>

            <h4 className="mt-1 text-base font-bold text-foreground sm:text-lg">
              Technical Findings
            </h4>

            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Prioritised automated
              findings from the{' '}
              {modeLabel.toLowerCase()}{' '}
              Lighthouse run. Priority
              labels are SiteSignal
              classifications, not
              official Lighthouse
              severity ratings.
            </p>
          </div>
        </div>

        <ChevronDown
          className={`mt-1 h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 ${
            open
              ? 'rotate-0'
              : '-rotate-90'
          }`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div className="space-y-4 border-t border-border/60 p-5 sm:p-6">
          {findings.map(
            (
              finding,
              index
            ) => {
              const priority =
                getPriorityClasses(
                  finding.priority
                )

              const evidence =
                buildFindingEvidence(
                  finding
                )

              const resources =
                getFindingResources(
                  finding
                )

              return (
                <article
                  key={`${finding.id}-${index}`}
                  className={`rounded-2xl border p-4 sm:p-5 ${priority.panel}`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${priority.badge}`}
                        >
                          {getPriorityLabel(
                            finding.priority
                          )}
                        </span>

                        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          {
                            finding.categoryLabel
                          }
                        </span>
                      </div>

                      <h5 className="mt-3 text-sm font-bold leading-snug text-foreground sm:text-base">
                        {finding.title}
                      </h5>

                      {finding.description && (
                        <p className="mt-2 max-w-3xl text-xs leading-relaxed text-muted-foreground">
                          {
                            finding.description
                          }
                        </p>
                      )}
                    </div>

                    <div className="flex-shrink-0 text-[10px] font-medium text-muted-foreground">
                      Google Lighthouse ·{' '}
                      {modeLabel}
                    </div>
                  </div>

                  {evidence.length >
                    0 && (
                    <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                      {evidence.map(
                        (
                          item,
                          evidenceIndex
                        ) => (
                          <div
                            key={`${finding.id}-evidence-${evidenceIndex}`}
                            className="rounded-xl border border-border/60 bg-card/50 px-3 py-2.5"
                          >
                            <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                              {
                                item.label
                              }
                            </p>

                            <p className="mt-1 text-xs font-semibold text-secondary-foreground">
                              {
                                item.value
                              }
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  )}

                  {resources.length >
                    0 && (
                    <div className="mt-4 rounded-xl border border-border/60 bg-card/40 p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        Sample affected
                        resources / elements
                      </p>

                      <ul className="mt-2 space-y-2">
                        {resources.map(
                          (
                            resource,
                            resourceIndex
                          ) => (
                            <li
                              key={`${finding.id}-resource-${resourceIndex}`}
                              className="break-all font-mono text-[10px] leading-relaxed text-secondary-foreground"
                            >
                              <span className="mr-2 text-muted-foreground">
                                {resource.type ===
                                'resource'
                                  ? 'URL'
                                  : 'DOM'}
                                :
                              </span>

                              {
                                resource.value
                              }
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}
                </article>
              )
            }
          )}

          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Automated evidence should
            be validated manually before
            remediation decisions are
            made. Performance results may
            also vary between Lighthouse
            runs due to network,
            third-party and production
            conditions.
          </p>
        </div>
      )}
    </div>
  )
}

/* =====================================================
   SCORE ITEMS
===================================================== */

function buildScoreItems(
  scores,
  auditMode = 'mobile'
) {
  const modeScores =
    getModeScores(
      scores,
      auditMode
    )

  if (!modeScores) {
    return []
  }

  return [
    {
      label: 'Performance',
      value:
        modeScores.performance ??
        0,
    },
    {
      label: 'SEO',
      value:
        modeScores.seo ?? 0,
    },
    {
      label: 'Accessibility',
      value:
        modeScores.accessibility ??
        0,
    },
    {
      label: 'Best Practices',
      value:
        modeScores.bestPractices ??
        0,
    },
  ]
}

/* =====================================================
   PDF EXPORT
===================================================== */

function exportToPDF(
  url,
  scores,
  report,
  profile,
  auditMode = 'mobile'
) {
  const profileValues =
    getProfileFallbacks(
      profile
    )

  const preparedBy =
    getPreparedBy(
      profileValues
    )

  const hydratedReport =
    applyProfilePlaceholdersDeep(
      report,
      profile
    )

  const scoreItems =
    buildScoreItems(
      scores,
      auditMode
    )

  const findings =
    getTechnicalFindings(
      scores,
      auditMode,
      6
    )

  const modeLabel =
    getModeLabel(
      auditMode
    )

  const displayUrl =
    getDisplayAuditUrl(url)

  const date =
    new Date().toLocaleDateString(
      'en-AU',
      {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }
    )

  const sections = [
    {
      title:
        'Executive Summary',
      content:
        hydratedReport.executiveSummary,
      emoji: '📋',
    },
    {
      title:
        'Key Issues',
      content:
        hydratedReport.keyIssues,
      emoji: '⚠️',
    },
    {
      title:
        'Business Impact',
      content:
        hydratedReport.businessImpact,
      emoji: '💼',
    },
    {
      title:
        'Recommended Next Steps',
      content:
        hydratedReport.recommendations,
      emoji: '🚀',
    },
  ].filter((section) => {
    if (
      Array.isArray(
        section.content
      )
    ) {
      return (
        section.content.length >
        0
      )
    }

    return Boolean(
      section.content
    )
  })

  const scoresHtml =
    scoreItems
      .map(
        (item) => `
          <div class="score-card">
            <div class="score-label">
              ${escapeHtml(item.label)}
            </div>

            <div
              class="score-number"
              style="color:${getScoreColourHex(
                item.value
              )}"
            >
              ${item.value}
            </div>

            <div
              class="score-tag"
              style="color:${getScoreColourHex(
                item.value
              )}"
            >
              ${escapeHtml(
                getScoreLabelText(
                  item.value
                )
              )}
            </div>
          </div>
        `
      )
      .join('')

  const findingsHtml =
    findings.length > 0
      ? `
        <section class="technical-section">
          <div class="technical-heading">
            <div>
              <div class="technical-kicker">
                LIGHTHOUSE EVIDENCE
              </div>

              <h2>
                Technical Findings
              </h2>
            </div>

            <div class="technical-source">
              ${escapeHtml(modeLabel)} · Google Lighthouse
            </div>
          </div>

          <p class="technical-intro">
            Prioritised automated findings from the selected
            Lighthouse run. Priority labels are SiteSignal
            classifications rather than official Lighthouse
            severity ratings.
          </p>

          <div class="finding-list">
            ${findings
              .map(
                (
                  finding,
                  index
                ) => {
                  const evidence =
                    buildFindingEvidence(
                      finding
                    )

                  const resources =
                    getFindingResources(
                      finding
                    )

                  const evidenceHtml =
                    evidence.length >
                    0
                      ? `
                        <div class="evidence-grid">
                          ${evidence
                            .map(
                              (
                                item
                              ) => `
                                <div class="evidence-cell">
                                  <div class="evidence-label">
                                    ${escapeHtml(
                                      item.label
                                    )}
                                  </div>

                                  <div class="evidence-value">
                                    ${escapeHtml(
                                      item.value
                                    )}
                                  </div>
                                </div>
                              `
                            )
                            .join('')}
                        </div>
                      `
                      : ''

                  const resourcesHtml =
                    resources.length >
                    0
                      ? `
                        <div class="resource-box">
                          <div class="resource-heading">
                            Sample affected resources / elements
                          </div>

                          ${resources
                            .map(
                              (
                                resource
                              ) => `
                                <div class="resource-row">
                                  <strong>
                                    ${
                                      resource.type ===
                                      'resource'
                                        ? 'URL'
                                        : 'DOM'
                                    }:
                                  </strong>

                                  ${escapeHtml(
                                    resource.value
                                  )}
                                </div>
                              `
                            )
                            .join('')}
                        </div>
                      `
                      : ''

                  return `
                    <article class="finding-card">
                      <div class="finding-top">
                        <div>
                          <span
                            class="priority-badge"
                            style="
                              color:${getPriorityHex(
                                finding.priority
                              )};
                              border-color:${getPriorityHex(
                                finding.priority
                              )}55;
                              background:${getPriorityHex(
                                finding.priority
                              )}0D;
                            "
                          >
                            ${escapeHtml(
                              getPriorityLabel(
                                finding.priority
                              )
                            )}
                          </span>

                          <span class="finding-category">
                            ${escapeHtml(
                              finding.categoryLabel
                            )}
                          </span>
                        </div>

                        <span class="finding-number">
                          #${index + 1}
                        </span>
                      </div>

                      <h3 class="finding-title">
                        ${escapeHtml(
                          finding.title
                        )}
                      </h3>

                      ${
                        finding.description
                          ? `
                            <p class="finding-description">
                              ${escapeHtml(
                                finding.description
                              )}
                            </p>
                          `
                          : ''
                      }

                      ${evidenceHtml}
                      ${resourcesHtml}
                    </article>
                  `
                }
              )
              .join('')}
          </div>
        </section>
      `
      : ''

  const sectionsHtml =
    sections
      .map(
        (
          section,
          index
        ) => {
          const contentHtml =
            Array.isArray(
              section.content
            )
              ? `
                <ul>
                  ${section.content
                    .map(
                      (
                        item
                      ) =>
                        `<li>${escapeHtml(
                          item
                        )}</li>`
                    )
                    .join('')}
                </ul>
              `
              : `
                <p>
                  ${escapeHtml(
                    section.content
                  )}
                </p>
              `

          return `
            <section class="report-section">
              <div class="section-header">
                <span class="section-number">
                  ${index + 1}
                </span>

                <span class="section-emoji">
                  ${section.emoji}
                </span>

                <h3>
                  ${escapeHtml(
                    section.title
                  )}
                </h3>
              </div>

              ${contentHtml}
            </section>
          `
        }
      )
      .join('')

  const preparedByHtml =
    preparedBy.label
      ? `
        <p class="prepared-for">
          Prepared by ${escapeHtml(
            preparedBy.label
          )}
        </p>
      `
      : ''

  const generatedBy =
    preparedBy.company ||
    'SiteSignal'

  const generatedName =
    preparedBy.name
      ? ` · ${escapeHtml(
          preparedBy.name
        )}`
      : ''

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />

  <title>
    Website Audit Report - ${escapeHtml(displayUrl)}
  </title>

  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      max-width: 860px;
      margin: 0 auto;
      padding: 40px;
      background: #ffffff;
      color: #1e293b;
      font-family:
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        Roboto,
        sans-serif;
      font-size: 14px;
      line-height: 1.6;
    }

    .header {
      margin-bottom: 30px;
      padding-bottom: 24px;
      border-bottom: 3px solid #2563eb;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 20px;
    }

    .brand-icon {
      display: flex;
      width: 40px;
      height: 40px;
      align-items: center;
      justify-content: center;
      border-radius: 10px;
      background:
        linear-gradient(
          135deg,
          #3b82f6,
          #06b6d4
        );
      font-size: 20px;
    }

    .brand-name {
      color: #1e293b;
      font-size: 16px;
      font-weight: 700;
    }

    .brand-sub {
      color: #64748b;
      font-size: 11px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }

    h1 {
      margin-bottom: 6px;
      color: #0f172a;
      font-size: 28px;
      font-weight: 800;
      line-height: 1.2;
    }

    .prepared-for {
      margin-bottom: 4px;
      color: #64748b;
      font-size: 13px;
    }

    .url-link {
      overflow-wrap: anywhere;
      color: #2563eb;
      font-size: 14px;
      font-weight: 600;
      text-decoration: none;
    }

    .report-date {
      margin-top: 4px;
      color: #94a3b8;
      font-size: 12px;
    }

    .overall-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 28px;
      padding: 20px 24px;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      background: #f8fafc;
    }

    .overall-left h2 {
      margin-bottom: 4px;
      color: #0f172a;
      font-size: 15px;
      font-weight: 700;
    }

    .overall-left p {
      max-width: 590px;
      color: #64748b;
      font-size: 12px;
    }

    .indicator-note {
      margin-top: 6px;
      color: #475569;
      font-size: 10px;
      font-weight: 600;
    }

    .overall-score-circle {
      display: flex;
      width: 80px;
      height: 80px;
      flex-shrink: 0;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border: 4px solid;
      border-radius: 50%;
    }

    .overall-score-number {
      font-size: 26px;
      font-weight: 800;
      line-height: 1;
    }

    .overall-score-sub {
      margin-top: 2px;
      color: #94a3b8;
      font-size: 9px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }

    .scores-grid {
      display: grid;
      grid-template-columns:
        repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 28px;
    }

    .score-card {
      padding: 14px;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      background: #f8fafc;
      text-align: center;
    }

    .score-label {
      margin-bottom: 8px;
      color: #94a3b8;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    .score-number {
      margin-bottom: 4px;
      font-size: 28px;
      font-weight: 800;
      line-height: 1;
    }

    .score-tag {
      font-size: 11px;
      font-weight: 600;
    }

    .perf-row {
      display: grid;
      grid-template-columns:
        1fr 1fr;
      gap: 12px;
      margin-bottom: 30px;
    }

    .perf-card {
      padding: 16px;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      background: #f8fafc;
    }

    .perf-label {
      margin-bottom: 6px;
      color: #64748b;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    .perf-score {
      font-size: 24px;
      font-weight: 800;
    }

    .technical-section {
      margin-bottom: 30px;
      padding: 20px 24px;
      border: 1px solid #ddd6fe;
      border-radius: 12px;
      background: #faf8ff;
    }

    .technical-heading {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 20px;
      margin-bottom: 6px;
    }

    .technical-kicker {
      margin-bottom: 3px;
      color: #7c3aed;
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 0.15em;
    }

    .technical-heading h2 {
      color: #0f172a;
      font-size: 18px;
      font-weight: 800;
    }

    .technical-source {
      color: #64748b;
      font-size: 10px;
    }

    .technical-intro {
      margin-bottom: 16px;
      color: #64748b;
      font-size: 11px;
      line-height: 1.6;
    }

    .finding-list {
      display: grid;
      gap: 12px;
    }

    .finding-card {
      padding: 16px;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      background: #ffffff;
      page-break-inside: avoid;
    }

    .finding-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 9px;
    }

    .priority-badge {
      display: inline-block;
      margin-right: 8px;
      padding: 3px 7px;
      border: 1px solid;
      border-radius: 999px;
      font-size: 8px;
      font-weight: 800;
      letter-spacing: 0.09em;
      text-transform: uppercase;
    }

    .finding-category {
      color: #64748b;
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }

    .finding-number {
      color: #94a3b8;
      font-size: 9px;
      font-weight: 700;
    }

    .finding-title {
      color: #0f172a;
      font-size: 14px;
      font-weight: 800;
      line-height: 1.35;
    }

    .finding-description {
      margin-top: 6px;
      color: #64748b;
      font-size: 10px;
      line-height: 1.55;
    }

    .evidence-grid {
      display: grid;
      grid-template-columns:
        repeat(4, 1fr);
      gap: 7px;
      margin-top: 12px;
    }

    .evidence-cell {
      padding: 8px;
      border: 1px solid #e2e8f0;
      border-radius: 7px;
      background: #f8fafc;
    }

    .evidence-label {
      color: #94a3b8;
      font-size: 7px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .evidence-value {
      margin-top: 3px;
      color: #334155;
      font-size: 9px;
      font-weight: 700;
    }

    .resource-box {
      margin-top: 10px;
      padding: 9px 10px;
      border: 1px solid #e2e8f0;
      border-radius: 7px;
      background: #f8fafc;
    }

    .resource-heading {
      margin-bottom: 5px;
      color: #64748b;
      font-size: 7px;
      font-weight: 800;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }

    .resource-row {
      margin-top: 3px;
      overflow-wrap: anywhere;
      color: #475569;
      font-family:
        SFMono-Regular,
        Consolas,
        "Liberation Mono",
        monospace;
      font-size: 7px;
      line-height: 1.4;
    }

    .report-section {
      margin-bottom: 24px;
      padding: 20px 24px;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
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
      display: flex;
      width: 22px;
      height: 22px;
      flex-shrink: 0;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: #2563eb;
      color: #ffffff;
      font-size: 11px;
      font-weight: 700;
    }

    .section-emoji {
      font-size: 18px;
    }

    .report-section h3 {
      color: #0f172a;
      font-size: 16px;
      font-weight: 700;
    }

    .report-section p {
      color: #475569;
      font-size: 13px;
      line-height: 1.7;
    }

    .report-section ul {
      padding: 0;
      list-style: none;
    }

    .report-section li {
      position: relative;
      margin-bottom: 8px;
      padding-left: 16px;
      color: #475569;
      font-size: 13px;
      line-height: 1.7;
    }

    .report-section li::before {
      position: absolute;
      left: 0;
      color: #2563eb;
      content: "•";
      font-weight: 700;
    }

    .scope-banner {
      margin-top: 24px;
      padding: 20px 24px;
      border: 1px solid #bfdbfe;
      border-radius: 12px;
      background: #eff6ff;
      page-break-inside: avoid;
    }

    .scope-banner h4 {
      margin-bottom: 6px;
      color: #1e40af;
      font-size: 15px;
      font-weight: 700;
    }

    .scope-banner p {
      color: #3b5f9f;
      font-size: 13px;
      line-height: 1.6;
    }

    .footer {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 20px;
      margin-top: 36px;
      padding-top: 18px;
      border-top: 1px solid #e2e8f0;
    }

    .footer p {
      max-width: 48%;
      overflow-wrap: anywhere;
      color: #94a3b8;
      font-size: 10px;
    }

    .footer-brand {
      color: #2563eb;
      font-weight: 700;
    }

    @media print {
      body {
        padding: 18px;
      }

      @page {
        size: A4;
        margin: 1cm;
      }
    }
  </style>
</head>

<body>
  <header class="header">
    <div class="brand">
      <div class="brand-icon">
        🎯
      </div>

      <div>
        <div class="brand-name">
          SiteSignal
        </div>

        <div class="brand-sub">
          Preliminary Website Audit
        </div>
      </div>
    </div>

    <h1>
      Website Audit Report
    </h1>

    ${preparedByHtml}

    <a
      class="url-link"
      href="${escapeHtml(url)}"
      target="_blank"
      rel="noopener noreferrer"
    >
      ${escapeHtml(displayUrl)}
    </a>

    <p class="report-date">
      Generated on ${escapeHtml(date)}
    </p>
  </header>

  <div class="overall-banner">
    <div class="overall-left">
      <h2>
        SiteSignal Composite Indicator
      </h2>

      <p>
        Calculated from the four mobile Lighthouse category
        scores. The score cards below show the selected
        ${escapeHtml(modeLabel.toLowerCase())} view.
      </p>

      <p class="indicator-note">
        SiteSignal-derived summary indicator. Not an official
        Google Lighthouse score.
      </p>
    </div>

    <div
      class="overall-score-circle"
      style="border-color:${getScoreColourHex(
        scores?.overallScore ?? 0
      )}"
    >
      <span
        class="overall-score-number"
        style="color:${getScoreColourHex(
          scores?.overallScore ?? 0
        )}"
      >
        ${scores?.overallScore ?? 0}
      </span>

      <span class="overall-score-sub">
        /100
      </span>
    </div>
  </div>

  <div class="scores-grid">
    ${scoresHtml}
  </div>

  <div class="perf-row">
    <div class="perf-card">
      <div class="perf-label">
        📱 Mobile Performance
      </div>

      <div
        class="perf-score"
        style="color:${getScoreColourHex(
          scores?.mobile?.performance ?? 0
        )}"
      >
        ${scores?.mobile?.performance ?? 0}

        <span
          style="
            font-size:14px;
            color:#94a3b8;
          "
        >
          /100
        </span>
      </div>
    </div>

    <div class="perf-card">
      <div class="perf-label">
        🖥️ Desktop Performance
      </div>

      <div
        class="perf-score"
        style="color:${getScoreColourHex(
          scores?.desktop?.performance ?? 0
        )}"
      >
        ${scores?.desktop?.performance ?? 0}

        <span
          style="
            font-size:14px;
            color:#94a3b8;
          "
        >
          /100
        </span>
      </div>
    </div>
  </div>

  ${findingsHtml}

  ${sectionsHtml}

  <div class="scope-banner">
    <h4>
      Scope and interpretation
    </h4>

    <p>
      This preliminary report reflects an automated
      Lighthouse assessment of one public page at a
      specific point in time. Results may be influenced
      by network conditions, third-party scripts, consent
      tooling and temporary production behaviour.
      Findings should be validated across representative
      templates and with manual testing before remediation
      decisions are made.
    </p>
  </div>

  <footer class="footer">
    <p>
      Generated by
      <span class="footer-brand">
        ${escapeHtml(generatedBy)}
      </span>
      ${generatedName}
    </p>

    <p>
      ${escapeHtml(displayUrl)}
      ·
      ${escapeHtml(date)}
    </p>
  </footer>

  <script>
    window.onload = function () {
      setTimeout(function () {
        window.print()
      }, 500)
    }
  </script>
</body>
</html>
`

  const blob =
    new Blob(
      [html],
      {
        type: 'text/html;charset=utf-8;',
      }
    )

  const printUrl =
    URL.createObjectURL(
      blob
    )

  window.open(
    printUrl,
    '_blank',
    'noopener,noreferrer'
  )

  window.setTimeout(
    () => {
      URL.revokeObjectURL(
        printUrl
      )
    },
    60000
  )
}

/* =====================================================
   CSV EXPORT
===================================================== */

function exportToExcel(
  url,
  scores,
  report,
  profile,
  auditMode = 'mobile'
) {
  const profileValues =
    getProfileFallbacks(
      profile
    )

  const preparedBy =
    getPreparedBy(
      profileValues
    )

  const hydratedReport =
    applyProfilePlaceholdersDeep(
      report,
      profile
    )

  const scoreItems =
    buildScoreItems(
      scores,
      auditMode
    )

  const findings =
    getTechnicalFindings(
      scores,
      auditMode,
      10
    )

  const modeLabel =
    getModeLabel(
      auditMode
    )

  const displayUrl =
    getDisplayAuditUrl(url)

  const date =
    new Date().toLocaleDateString(
      'en-AU',
      {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }
    )

  const escapeCsv = (
    value
  ) =>
    `"${String(
      value ?? ''
    ).replace(/"/g, '""')}"`

  const rows = []

  rows.push([
    escapeCsv(
      'WEBSITE AUDIT REPORT'
    ),
    '',
    '',
    '',
  ])

  rows.push([
    escapeCsv(
      `URL: ${displayUrl}`
    ),
    '',
    '',
    '',
  ])

  if (
    preparedBy.label
  ) {
    rows.push([
      escapeCsv(
        `Prepared by: ${preparedBy.label}`
      ),
      '',
      '',
      '',
    ])
  }

  rows.push([
    escapeCsv(
      `Generated: ${date}`
    ),
    '',
    '',
    '',
  ])

  rows.push([
    escapeCsv(
      `Selected view: ${modeLabel}`
    ),
    '',
    '',
    '',
  ])

  rows.push([
    '',
    '',
    '',
    '',
  ])

  rows.push([
    escapeCsv(
      'SITESIGNAL COMPOSITE INDICATOR'
    ),
    escapeCsv(
      'STATUS'
    ),
    '',
    '',
  ])

  rows.push([
    escapeCsv(
      scores?.overallScore ??
        0
    ),
    escapeCsv(
      getScoreLabelText(
        scores?.overallScore ??
          0
      )
    ),
    escapeCsv(
      'SiteSignal-derived summary indicator'
    ),
    escapeCsv(
      'Not an official Google Lighthouse score'
    ),
  ])

  rows.push([
    '',
    '',
    '',
    '',
  ])

  rows.push([
    escapeCsv(
      `LIGHTHOUSE SCORE BREAKDOWN (${modeLabel.toUpperCase()})`
    ),
    '',
    '',
    '',
  ])

  rows.push([
    escapeCsv(
      'Category'
    ),
    escapeCsv(
      'Score'
    ),
    escapeCsv(
      'Status'
    ),
    escapeCsv(
      'Source'
    ),
  ])

  scoreItems.forEach(
    (item) => {
      rows.push([
        escapeCsv(
          item.label
        ),
        escapeCsv(
          item.value
        ),
        escapeCsv(
          getScoreLabelText(
            item.value
          )
        ),
        escapeCsv(
          `Google Lighthouse ${modeLabel}`
        ),
      ])
    }
  )

  rows.push([
    '',
    '',
    '',
    '',
  ])

  rows.push([
    escapeCsv(
      'MOBILE PERFORMANCE'
    ),
    escapeCsv(
      scores?.mobile
        ?.performance ?? 0
    ),
    escapeCsv(
      getScoreLabelText(
        scores?.mobile
          ?.performance ?? 0
      )
    ),
    escapeCsv(
      'Google Lighthouse'
    ),
  ])

  rows.push([
    escapeCsv(
      'DESKTOP PERFORMANCE'
    ),
    escapeCsv(
      scores?.desktop
        ?.performance ?? 0
    ),
    escapeCsv(
      getScoreLabelText(
        scores?.desktop
          ?.performance ?? 0
      )
    ),
    escapeCsv(
      'Google Lighthouse'
    ),
  ])

  rows.push([
    '',
    '',
    '',
    '',
  ])

  if (
    findings.length > 0
  ) {
    rows.push([
      escapeCsv(
        `TECHNICAL FINDINGS - ${modeLabel.toUpperCase()}`
      ),
      '',
      '',
      '',
    ])

    rows.push([
      escapeCsv(
        'Finding'
      ),
      escapeCsv(
        'Priority'
      ),
      escapeCsv(
        'Evidence'
      ),
      escapeCsv(
        'Category'
      ),
    ])

    findings.forEach(
      (finding) => {
        const evidence =
          buildFindingEvidence(
            finding
          )
            .map(
              (item) =>
                `${item.label}: ${item.value}`
            )
            .join(' | ')

        rows.push([
          escapeCsv(
            finding.title
          ),

          escapeCsv(
            getPriorityLabel(
              finding.priority
            )
          ),

          escapeCsv(
            evidence
          ),

          escapeCsv(
            finding.categoryLabel
          ),
        ])
      }
    )

    rows.push([
      '',
      '',
      '',
      '',
    ])
  }

  const reportSections = [
    {
      heading:
        'EXECUTIVE SUMMARY',

      content:
        hydratedReport.executiveSummary,
    },
    {
      heading:
        'KEY ISSUES',

      content:
        hydratedReport.keyIssues,
    },
    {
      heading:
        'BUSINESS IMPACT',

      content:
        hydratedReport.businessImpact,
    },
    {
      heading:
        'RECOMMENDED NEXT STEPS',

      content:
        hydratedReport.recommendations,
    },
  ]

  reportSections.forEach(
    (section) => {
      rows.push([
        escapeCsv(
          section.heading
        ),
        '',
        '',
        '',
      ])

      if (
        Array.isArray(
          section.content
        )
      ) {
        section.content.forEach(
          (
            item,
            index
          ) => {
            rows.push([
              escapeCsv(
                `${index + 1}. ${item}`
              ),
              '',
              '',
              '',
            ])
          }
        )
      } else if (
        typeof section.content ===
        'string'
      ) {
        rows.push([
          escapeCsv(
            section.content
          ),
          '',
          '',
          '',
        ])
      }

      rows.push([
        '',
        '',
        '',
        '',
      ])
    }
  )

  rows.push([
    escapeCsv(
      'SCOPE AND INTERPRETATION'
    ),
    '',
    '',
    '',
  ])

  rows.push([
    escapeCsv(
      'This preliminary report reflects an automated assessment of one public page at a specific point in time. Validate findings across representative templates and with manual testing before making remediation decisions.'
    ),
    '',
    '',
    '',
  ])

  rows.push([
    '',
    '',
    '',
    '',
  ])

  rows.push([
    escapeCsv(
      `Generated by ${
        preparedBy.company ||
        'SiteSignal'
      }${
        preparedBy.name
          ? ` - ${preparedBy.name}`
          : ''
      }`
    ),
    '',
    '',
    '',
  ])

  const csv =
    rows
      .map(
        (row) =>
          row.join(',')
      )
      .join('\n')

  const blob =
    new Blob(
      [
        '\uFEFF' +
          csv,
      ],
      {
        type: 'text/csv;charset=utf-8;',
      }
    )

  const downloadUrl =
    URL.createObjectURL(
      blob
    )

  const link =
    document.createElement(
      'a'
    )

  link.href =
    downloadUrl

  link.download =
    `audit-report-${createExportHostname(
      displayUrl
    )}.csv`

  document.body.appendChild(
    link
  )

  link.click()

  document.body.removeChild(
    link
  )

  URL.revokeObjectURL(
    downloadUrl
  )
}

/* =====================================================
   MAIN COMPONENT
===================================================== */

export default function AuditReport({
  report,
  url,
  scores,
  profile,
  auditMode = 'mobile',
}) {
  const [
    scoresOpen,
    setScoresOpen,
  ] = useState(true)

  if (!report) {
    return null
  }

  const hydratedReport =
    applyProfilePlaceholdersDeep(
      report,
      profile
    )

  const profileValues =
    getProfileFallbacks(
      profile
    )

  const preparedBy =
    getPreparedBy(
      profileValues
    )

  const scoreItems =
    buildScoreItems(
      scores,
      auditMode
    )

  const modeLabel =
    getModeLabel(
      auditMode
    )

  const displayUrl =
    getDisplayAuditUrl(
      url
    )

  const sections = [
    {
      title:
        'Executive Summary',

      content:
        hydratedReport.executiveSummary,
    },
    {
      title:
        'Key Issues',

      content:
        hydratedReport.keyIssues,
    },
    {
      title:
        'Business Impact',

      content:
        hydratedReport.businessImpact,
    },
    {
      title:
        'Recommended Next Steps',

      content:
        hydratedReport.recommendations,
    },
  ].filter(
    (section) => {
      if (
        Array.isArray(
          section.content
        )
      ) {
        return (
          section.content
            .length > 0
        )
      }

      return Boolean(
        section.content
      )
    }
  )

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center rounded-full border border-border bg-secondary/50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Preliminary audit
            report
          </div>

          <h3 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Evidence-led audit
            findings
          </h3>

          {preparedBy.label && (
            <p className="mt-1 text-sm text-muted-foreground">
              Prepared by{' '}
              <span className="font-medium text-foreground">
                {
                  preparedBy.label
                }
              </span>
            </p>
          )}

          <p className="mt-1 text-sm text-muted-foreground">
            Audit target:{' '}

            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all font-medium text-blue-400 transition hover:text-blue-300"
            >
              {displayUrl}
            </a>
          </p>

          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Viewing the{' '}

            <span className="font-semibold text-secondary-foreground">
              {modeLabel}
            </span>{' '}

            Lighthouse score and
            evidence view. Mobile
            and desktop results were
            collected separately.
          </p>
        </div>

        {scoreItems.length >
          0 && (
          <div className="hidden flex-shrink-0 flex-wrap gap-2 sm:flex">
            {scoreItems.map(
              (item) => {
                const label =
                  getScoreLabel(
                    item.value
                  )

                return (
                  <div
                    key={
                      item.label
                    }
                    className={`min-w-[72px] rounded-xl border px-3 py-2 text-center ${getScoreBg(
                      item.value
                    )}`}
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      {
                        item.label
                      }
                    </p>

                    <p
                      className={`mt-1 text-xl font-bold leading-none ${getScoreStyle(
                        item.value
                      )}`}
                    >
                      {
                        item.value
                      }
                    </p>

                    <p
                      className={`mt-0.5 text-[10px] font-medium ${label.colour}`}
                    >
                      {
                        label.text
                      }
                    </p>
                  </div>
                )
              }
            )}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.04] px-4 py-3">
        <p className="text-xs leading-relaxed text-muted-foreground">
          <span className="font-semibold text-secondary-foreground">
            SiteSignal
            Composite
            Indicator:{' '}
          </span>

          {scores?.overallScore ??
            0}
          /100. This is a
          SiteSignal-derived summary
          indicator calculated from
          the four mobile Lighthouse
          category scores. It is not
          an official standalone
          Google Lighthouse score.
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-secondary/20 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <p className="text-sm font-semibold text-foreground">
            Export this report
          </p>

          <p className="mt-0.5 text-xs text-muted-foreground">
            Save a client-ready
            PDF or export the
            findings to CSV for
            further analysis.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-shrink-0">
          <button
            type="button"
            onClick={() =>
              exportToPDF(
                url,
                scores,
                report,
                profile,
                auditMode
              )
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_6px_20px_rgba(37,99,235,0.22)] transition hover:-translate-y-0.5 hover:bg-blue-500 active:translate-y-0"
          >
            <span aria-hidden="true">
              📄
            </span>

            Download PDF
          </button>

          <button
            type="button"
            onClick={() =>
              exportToExcel(
                url,
                scores,
                report,
                profile,
                auditMode
              )
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-secondary/60 px-4 py-2.5 text-sm font-semibold text-foreground transition hover:-translate-y-0.5 hover:bg-secondary active:translate-y-0"
          >
            <span aria-hidden="true">
              📊
            </span>

            Export to CSV
          </button>
        </div>
      </div>

      <div className="max-w-2xl rounded-xl border border-border bg-secondary/20 px-4 py-3">
        <p className="text-sm leading-relaxed text-muted-foreground">
          <span aria-hidden="true">
            💡
          </span>{' '}

          <span className="font-medium text-secondary-foreground">
            How to read this
            report:
          </span>{' '}

          Start with the technical
          evidence, then review the
          summary, potential impact
          and recommended validation
          steps.
        </p>
      </div>

      <TechnicalFindings
        scores={scores}
        auditMode={auditMode}
      />

      <div className="grid grid-cols-1 gap-4">
        {sections.map(
          (
            section,
            index
          ) => (
            <ReportSection
              key={
                section.title
              }
              title={
                section.title
              }
              config={
                SECTION_CONFIG[
                  section.title
                ]
              }
              index={index}
              content={
                section.content
              }
              defaultOpen={
                index === 0
              }
            />
          )
        )}
      </div>

      {scoreItems.length >
        0 && (
        <div className="overflow-hidden rounded-2xl border border-border bg-secondary/20">
          <button
            type="button"
            onClick={() =>
              setScoresOpen(
                (current) =>
                  !current
              )
            }
            className="flex w-full items-center justify-between gap-4 p-5 text-left sm:p-6"
            aria-expanded={
              scoresOpen
            }
          >
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Score breakdown
              </p>

              <p className="mt-1 text-sm font-semibold text-foreground">
                {modeLabel}{' '}
                Lighthouse scores
              </p>
            </div>

            <ChevronDown
              className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 ${
                scoresOpen
                  ? 'rotate-0'
                  : '-rotate-90'
              }`}
              aria-hidden="true"
            />
          </button>

          {scoresOpen && (
            <div className="border-t border-border px-5 pb-5 sm:px-6 sm:pb-6">
              <div className="mb-4 flex flex-col gap-1 pt-4 sm:flex-row sm:items-end sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  Matched to the
                  selected score
                  and evidence view.
                </p>

                <p className="text-[11px] text-muted-foreground/70">
                  Source: Google
                  Lighthouse (
                  {modeLabel.toLowerCase()}
                  )
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {scoreItems.map(
                  (item) => {
                    const label =
                      getScoreLabel(
                        item.value
                      )

                    return (
                      <div
                        key={
                          item.label
                        }
                        className={`rounded-xl border p-4 ${getScoreBg(
                          item.value
                        )}`}
                      >
                        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          {
                            item.label
                          }
                        </p>

                        <p
                          className={`text-3xl font-bold leading-none tabular-nums ${getScoreStyle(
                            item.value
                          )}`}
                        >
                          {
                            item.value
                          }
                        </p>

                        <p
                          className={`mt-1 text-[11px] font-semibold ${label.colour}`}
                        >
                          {
                            label.text
                          }
                        </p>

                        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-border/60">
                          <div
                            className={`h-2 rounded-full transition-all duration-700 ${getScoreBar(
                              item.value
                            )}`}
                            style={{
                              width: `${item.value}%`,
                            }}
                          />
                        </div>
                      </div>
                    )
                  }
                )}
              </div>

              <div className="mt-4 rounded-xl border border-border bg-card/50 px-4 py-3">
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  <span className="font-semibold text-secondary-foreground">
                    Score guide:{' '}
                  </span>

                  <span className="font-medium text-emerald-400">
                    70–100
                  </span>{' '}
                  is strong.{' '}

                  <span className="font-medium text-amber-400">
                    50–69
                  </span>{' '}
                  suggests improvement
                  opportunities.{' '}

                  <span className="font-medium text-rose-400">
                    0–49
                  </span>{' '}
                  requires
                  investigation.
                  Scores are
                  diagnostic
                  indicators rather
                  than proof of
                  business impact.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.04] p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-lg text-blue-300">
            🔎
          </div>

          <div>
            <h4 className="mb-1 text-base font-bold text-foreground">
              Scope and
              interpretation
            </h4>

            <p className="text-sm leading-relaxed text-muted-foreground">
              This preliminary
              report reflects an
              automated Lighthouse
              assessment of one
              public page at a
              specific point in
              time. Results may be
              influenced by network
              conditions,
              third-party scripts,
              consent tooling and
              temporary production
              behaviour. Validate
              findings across
              representative
              templates and with
              manual testing before
              making remediation
              decisions.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}