'use client'

import { useMemo, useState } from 'react'
import { getStoredProfile } from '../lib/profileStorage'

const TABS = [
  { key: 'callScript', label: 'Call Script', icon: '📞', hint: 'Read this out loud when you call. Fully written — no blanks to fill.' },
  { key: 'coldEmail', label: 'Cold Email', icon: '📧', hint: 'Copy the subject + body straight into Gmail. Sign off is already filled in.' },
  { key: 'followUpEmail', label: 'Follow-up', icon: '🔁', hint: 'Send this 3–5 days after the cold email if you get no reply.' },
  { key: 'dm', label: 'Direct Message', icon: '💬', hint: 'LinkedIn or SMS. Short and human — no editing needed.' },
]

function normaliseOutreach(outreach) {
  if (!outreach) return null
  return {
    callScript: outreach.callScript || outreach.call_script || '',
    coldEmail: outreach.coldEmail
      ? outreach.coldEmail
      : outreach.email_subject || outreach.email_body
        ? `Subject: ${outreach.email_subject || ''}\n\n${outreach.email_body || ''}`.trim()
        : '',
    followUpEmail: outreach.followUpEmail || outreach.follow_up_body || '',
    dm: outreach.dm || outreach.linkedinDM || outreach.dm_body || '',
  }
}

function CopyButton({ text, label = 'Copy' }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={!text}
      className={`inline-flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-semibold transition ${
        copied
          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
          : 'border-white/[0.10] bg-white/[0.04] text-slate-200 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-40'
      }`}
    >
      {copied ? '✅ Copied!' : `📋 ${label}`}
    </button>
  )
}

export default function OutreachTabs({
  outreach,
  isLoading,
  error,
  onMarkUsed,
  usedFormats = {},
}) {
  const [activeTab, setActiveTab] = useState('callScript')

  const profile = useMemo(() => getStoredProfile(), [])
  const normalised = useMemo(() => normaliseOutreach(outreach), [outreach])

  const activeTabConfig = TABS.find((t) => t.key === activeTab)
  const currentText = normalised?.[activeTab] || ''

  const isEmailTab = activeTab === 'coldEmail' || activeTab === 'followUpEmail'
  const isUsed = usedFormats?.[activeTab] || false

  const handleMarkUsed = () => {
    if (onMarkUsed && !isUsed) onMarkUsed(activeTab)
  }

  return (
    <section
      aria-labelledby="outreach-kit-heading"
      className="overflow-hidden rounded-[28px] border border-white/[0.08] bg-white/[0.035] shadow-[0_24px_60px_rgba(0,0,0,0.18)] backdrop-blur-sm"
    >
      {/* Header */}
      <div className="relative overflow-hidden border-b border-border bg-white/[0.03] px-6 py-5 sm:px-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-blue-500/[0.10] blur-3xl"
        />
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl border border-white/[0.10] bg-white/[0.07] text-lg">
              ✉️
            </div>
            <div>
              <div className="mb-1 inline-flex items-center rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                Outreach Kit
              </div>
              <h2
                id="outreach-kit-heading"
                className="text-lg font-bold tracking-tight text-white sm:text-xl"
              >
                Your outreach — ready to use
              </h2>
              <p className="mt-0.5 text-sm text-slate-400">
                {profile?.yourName
                  ? `Signed off as ${profile.yourName}${profile.yourCompany ? ` · ${profile.yourCompany}` : ''} — no editing needed.`
                  : 'Complete your profile to auto-fill your name and company into every script.'}
              </p>
            </div>
          </div>

          {Object.values(usedFormats).some(Boolean) && (
            <div className="flex flex-wrap gap-1.5 self-start sm:self-center">
              {TABS.map((tab) =>
                usedFormats?.[tab.key] ? (
                  <span
                    key={tab.key}
                    className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300"
                  >
                    ✓ {tab.label} sent
                  </span>
                ) : null
              )}
            </div>
          )}
        </div>
      </div>

      <div className="px-6 py-6 sm:px-10">

        {/* Loading */}
        {isLoading && (
          <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/[0.04]">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/[0.08]">
                <svg aria-hidden="true" className="h-6 w-6 animate-spin text-blue-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-blue-300">Generating your outreach kit…</p>
              <p className="mt-1 text-xs text-slate-500">Writing all 4 formats from the audit findings. Takes 10–20 seconds.</p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && !isLoading && (
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.06] p-5">
            <p className="font-semibold text-rose-400">Could not generate outreach</p>
            <p className="mt-1 text-sm text-rose-400/70">{error}</p>
          </div>
        )}

        {/* Content */}
        {outreach && !isLoading && !error && (
          <div className="space-y-5">

            {/* Tab buttons */}
            <div className="flex flex-wrap gap-2">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition ${
                    activeTab === tab.key
                      ? 'border-blue-500/40 bg-blue-500/10 text-blue-300'
                      : 'border-white/[0.08] bg-white/[0.03] text-slate-400 hover:bg-white/[0.06] hover:text-foreground'
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                  {usedFormats?.[tab.key] && (
                    <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">
                      ✓
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Active tab content */}
            <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03]">

              {/* Tab toolbar */}
              <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{activeTabConfig?.icon}</span>
                    <span className="text-sm font-bold text-white">{activeTabConfig?.label}</span>
                    {isUsed && (
                      <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
                        ✓ Sent
                      </span>
                    )}
                  </div>
                  {activeTabConfig?.hint && (
                    <p className="mt-1 text-xs text-slate-500">{activeTabConfig.hint}</p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {isEmailTab && (
                    <p className="text-xs text-slate-500">
                      💡 Attach the{' '}
                      <span className="font-medium text-slate-400">PDF audit report</span>{' '}
                      when you send this email
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={handleMarkUsed}
                    disabled={isUsed}
                    className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                      isUsed
                        ? 'cursor-default border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                        : 'border-white/[0.10] bg-white/[0.04] text-slate-300 hover:border-emerald-500/30 hover:bg-emerald-500/[0.08] hover:text-emerald-300'
                    }`}
                  >
                    {isUsed ? '✅ Marked as sent' : '📤 Mark as sent'}
                  </button>

                  <CopyButton
                    text={currentText}
                    label={activeTab === 'callScript' ? 'Copy Script' : 'Copy'}
                  />
                </div>
              </div>

              {/* Script content */}
              <div className="p-5 sm:p-6">
                {currentText ? (
                  <>
                    {activeTab === 'callScript' && (
                      <div className="mb-4 flex items-start gap-3 rounded-xl border border-blue-500/20 bg-blue-500/[0.06] px-4 py-3">
                        <span className="mt-0.5 flex-shrink-0 text-blue-400">📞</span>
                        <div>
                          <p className="text-xs font-semibold text-blue-300">
                            How to use this script
                          </p>
                          <p className="mt-0.5 text-xs leading-relaxed text-slate-400">
                            Read it naturally — don't rush. You can pause, adjust on the fly, and skip sentences if the conversation goes a different way. The goal is to sound like a real person, not read a script.
                          </p>
                        </div>
                      </div>
                    )}

                    {isEmailTab && (
                      <div className="mb-4 flex items-start gap-3 rounded-xl border border-violet-500/20 bg-violet-500/[0.06] px-4 py-3">
                        <span className="mt-0.5 flex-shrink-0 text-violet-400">📧</span>
                        <div>
                          <p className="text-xs font-semibold text-violet-300">
                            Ready to send
                          </p>
                          <p className="mt-0.5 text-xs leading-relaxed text-slate-400">
                            Copy the full text, paste into Gmail. Attach the PDF audit report from the Audit page. The sign-off is already filled in with your details.
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="whitespace-pre-wrap rounded-xl border border-white/[0.06] bg-slate-950/40 p-5 text-sm leading-relaxed text-slate-200">
                      {currentText}
                    </div>

                    <div className="mt-4 flex justify-end">
                      <CopyButton
                        text={currentText}
                        label={activeTab === 'callScript' ? 'Copy Full Script' : 'Copy Full Email'}
                      />
                    </div>
                  </>
                ) : (
                  <div className="flex min-h-[200px] items-center justify-center text-sm text-slate-500">
                    No content generated for this format.
                  </div>
                )}
              </div>
            </div>

            <p className="text-xs text-slate-600">
              💡 Click <span className="font-medium text-slate-400">Mark as sent</span> after using a format — it saves alongside your audit history.
            </p>
          </div>
        )}

        {/* Empty state — no outreach yet */}
        {!outreach && !isLoading && !error && (
          <div className="flex min-h-[260px] items-center justify-center rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.02]">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04] text-xl">
                ✉️
              </div>
              <p className="text-sm font-semibold text-white">No outreach generated yet</p>
              <p className="mt-1 text-xs text-slate-500">
                Your call script, email, follow-up and DM will appear here once generated.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}