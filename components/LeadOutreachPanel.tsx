'use client'

import { useMemo, useState } from 'react'
import { getStoredProfile } from '../lib/profileStorage'
import { applyProfilePlaceholders } from '../lib/templateUtils'

interface OutreachContent {
  call_script?: string
  email_subject?: string
  email_body?: string
  follow_up_body?: string
  dm_body?: string
}

interface Props {
  outreach: OutreachContent
  onClose: () => void
}

type TabKey = 'call' | 'email' | 'followup' | 'dm'

const tabs: { key: TabKey; label: string; icon: string }[] = [
  { key: 'call', label: 'Call Script', icon: '📞' },
  { key: 'email', label: 'Cold Email', icon: '📧' },
  { key: 'followup', label: 'Follow-up', icon: '🔁' },
  { key: 'dm', label: 'Direct Message', icon: '💬' },
]

export default function LeadOutreachPanel({ outreach, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>('call')
  const [copied, setCopied] = useState(false)

  const profile = useMemo(() => getStoredProfile(), [])

  const rawCurrentContent = useMemo(() => {
    switch (activeTab) {
      case 'call':
        return outreach.call_script || ''
      case 'email':
        return `Subject: ${outreach.email_subject || ''}\n\n${outreach.email_body || ''}`
      case 'followup':
        return outreach.follow_up_body || ''
      case 'dm':
        return outreach.dm_body || ''
      default:
        return ''
    }
  }, [activeTab, outreach])

  const currentContent = useMemo(() => {
    return applyProfilePlaceholders(rawCurrentContent, profile)
  }, [rawCurrentContent, profile])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentContent)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch (error) {
      console.error('Copy failed', error)
    }
  }

  return (
    <div className="mt-5 rounded-[22px] border border-border bg-[#182241]/95 shadow-[0_18px_50px_rgba(2,6,23,0.18)]">
      <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-secondary-foreground">
            <span>✉️</span>
            Outreach Kit
          </div>
          <h4 className="text-lg font-semibold text-white">Generated pitch</h4>
          <p className="mt-1 text-sm text-muted-foreground">
            Copy and use the format that fits the lead best.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="rounded-xl border border-border bg-secondary/50 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-secondary"
          >
            {copied ? 'Copied' : 'Copy'}
          </button>

          <button
            onClick={onClose}
            className="rounded-xl border border-border bg-secondary/50 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-secondary"
          >
            Close
          </button>
        </div>
      </div>

      <div className="px-5 py-4">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const active = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key)
                  setCopied(false)
                }}
                className={`rounded-xl px-3.5 py-2 text-sm font-medium transition ${
                  active
                    ? 'bg-blue-600 text-white shadow-[0_10px_30px_rgba(37,99,235,0.25)]'
                    : 'border border-border bg-secondary/50 text-secondary-foreground hover:bg-secondary'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            )
          })}
        </div>

        <div className="mt-4 rounded-2xl border border-border bg-input p-4">
          <pre className="whitespace-pre-wrap font-sans text-sm leading-6 text-slate-200">
            {currentContent || 'No content generated yet.'}
          </pre>
        </div>
      </div>
    </div>
  )
}