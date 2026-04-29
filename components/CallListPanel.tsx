'use client'

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

interface Props {
  items: CallListItem[]
  loading?: boolean
  onRemove: (id: string) => void
  onStatusChange: (id: string, status: string) => void

  onRunFullAudit?: (lead: WorkspaceLead) => void
  onOpenManualOutreach?: (lead: WorkspaceLead) => void
  onUpdateReminder?: (id: string, followUpDate: string, reminderNote: string) => void
}

function getTempClasses(temp?: string) {
  const t = (temp || '').toLowerCase()
  if (t === 'hot') return 'border-red-400/20 bg-red-500/10 text-red-200'
  if (t === 'warm') return 'border-amber-400/20 bg-amber-500/10 text-amber-200'
  return 'border-white/[0.10] bg-white/[0.05] text-slate-300'
}

function getQueueStatusLabel(status: string) {
  const map: Record<string, string> = {
    queued: 'Queued',
    calling_now: 'Calling now',
    called: 'Called',
    voicemail: 'Voicemail',
    follow_up: 'Follow up',
  }

  return map[status] || status
}

function mapCallListLeadToWorkspaceLead(lead: CallListLead): WorkspaceLead {
  return {
    title: lead.business_name,
    url: lead.website_url,
    leadTemp: lead.lead_temperature?.toUpperCase(),
    opportunityScore: lead.opportunity_score,
    problems: lead.quick_issues || [],
    scores: {
      overall: lead.quick_health_score,
      mobile: {
        performance: lead.quick_health_score,
        seo: undefined,
        accessibility: undefined,
        bestPractices: undefined,
      },
      desktop: {
        performance: undefined,
      },
    },
  }
}

export default function CallListPanel({
  items,
  loading = false,
  onRemove,
  onStatusChange,
  onGeneratePitch,
  onRunFullAudit,
  onOpenManualOutreach,
  onUpdateReminder,
}: Props) {
  return (
    <section className="rounded-[26px] border border-white/[0.08] bg-[#1b2545]/90 shadow-[0_18px_60px_rgba(2,6,23,0.22)] backdrop-blur">
      <div className="flex flex-col gap-4 border-b border-white/[0.06] px-6 py-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
            <span>📞</span>
            Call Queue
          </div>
          <h3 className="text-2xl font-semibold text-white">Today’s Call List</h3>
          <p className="mt-1 text-sm text-slate-400">
            The leads you want to contact today and follow up with next.
          </p>
        </div>

        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-sm text-blue-200">
          {items.length} queued
        </div>
      </div>

      <div className="px-6 py-5">
        {loading ? (
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 text-sm text-slate-400">
            Loading call list...
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/[0.10] bg-white/[0.02] p-5 text-sm text-slate-500">
            No leads queued yet. Add leads from the search results above.
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => {
              const lead = item.leads
              if (!lead) return null

              const workspaceLead = mapCallListLeadToWorkspaceLead(lead)

              return (
                <article
                  key={item.id}
                  className="rounded-[22px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.02))] p-4 shadow-[0_16px_40px_rgba(2,6,23,0.14)]"
                >
                  <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_260px]">
                    <div className="min-w-0">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getTempClasses(
                            lead.lead_temperature
                          )}`}
                        >
                          {(lead.lead_temperature || 'new').toUpperCase()}
                        </span>

                        <span className="rounded-full border border-white/[0.10] bg-white/[0.05] px-2.5 py-1 text-xs text-slate-300">
                          {getQueueStatusLabel(item.status)}
                        </span>

                        {item.follow_up_date && (
                          <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs text-amber-200">
                            Follow-up: {item.follow_up_date}
                          </span>
                        )}

                        {lead.location && (
                          <span className="rounded-full border border-white/[0.10] bg-white/[0.05] px-2.5 py-1 text-xs text-slate-300">
                            {lead.location}
                          </span>
                        )}
                      </div>

                      <h4 className="text-lg font-semibold text-white">
                        {lead.business_name}
                      </h4>

                      <a
                        href={lead.website_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-block break-all text-sm text-blue-300 transition hover:text-blue-200"
                      >
                        {lead.website_url}
                      </a>

                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
                        <span className="rounded-full bg-white/[0.05] px-2.5 py-1">
                          Quick Health: {lead.quick_health_score ?? 0}
                        </span>
                        <span className="rounded-full bg-white/[0.05] px-2.5 py-1">
                          Opportunity: {lead.opportunity_score ?? 0}
                        </span>
                      </div>

                      {!!lead.quick_issues?.length && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {lead.quick_issues.slice(0, 4).map((issue) => (
                            <span
                              key={issue}
                              className="rounded-full border border-rose-400/15 bg-rose-500/10 px-2.5 py-1 text-xs text-rose-200"
                            >
                              {issue}
                            </span>
                          ))}
                        </div>
                      )}

                      {onUpdateReminder && (
                        <div className="mt-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
                          <div className="grid gap-3 md:grid-cols-2">
                            <div>
                              <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                Follow-up date
                              </label>
                              <input
                                type="date"
                                defaultValue={item.follow_up_date || ''}
                                onBlur={(e) =>
                                  onUpdateReminder(
                                    item.id,
                                    e.target.value,
                                    item.reminder_note || ''
                                  )
                                }
                                className="w-full rounded-xl border border-white/[0.10] bg-slate-950/50 px-3 py-2.5 text-xs text-white outline-none focus:border-blue-400"
                              />
                            </div>

                            <div>
                              <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                Reminder note
                              </label>
                              <textarea
                                rows={2}
                                defaultValue={item.reminder_note || ''}
                                onBlur={(e) =>
                                  onUpdateReminder(
                                    item.id,
                                    item.follow_up_date || '',
                                    e.target.value
                                  )
                                }
                                className="w-full rounded-xl border border-white/[0.10] bg-slate-950/50 px-3 py-2.5 text-xs text-white outline-none focus:border-blue-400"
                                placeholder="Call again Tuesday morning..."
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex w-full flex-col gap-2.5">
                      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3">
                        <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                          Queue status
                        </label>
                        <select
                          value={item.status}
                          onChange={(e) => onStatusChange(item.id, e.target.value)}
                          className="w-full rounded-xl border border-white/[0.10] bg-slate-950/50 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
                        >
                          <option value="queued">Queued</option>
                          <option value="calling_now">Calling now</option>
                          <option value="called">Called</option>
                          <option value="voicemail">Voicemail</option>
                          <option value="follow_up">Follow up</option>
                        </select>
                      </div>

                      {onRunFullAudit && (
                        <button
                          onClick={() => onRunFullAudit(workspaceLead)}
                          className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
                        >
                          Audit Website
                        </button>
                      )}

                      {onOpenManualOutreach && (
                        <button
                          onClick={() => onOpenManualOutreach(workspaceLead)}
                          className="rounded-xl border border-white/[0.10] bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/[0.08]"
                        >
                          Manual Outreach
                        </button>
                      )}

                      <a
                        href={lead.website_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center rounded-xl border border-white/[0.10] bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/[0.08]"
                      >
                        Visit Website
                      </a>

                      <button
                        onClick={() => onRemove(item.id)}
                        className="rounded-xl border border-white/[0.10] bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/[0.08]"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}