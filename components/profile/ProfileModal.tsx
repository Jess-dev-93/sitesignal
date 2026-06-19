'use client'

import { useEffect, useState } from 'react'
import { DEFAULT_PROFILE, UserProfile } from '../../lib/profileStorage'

type ProfileModalProps = {
  open: boolean
  initialProfile?: UserProfile
  sessionEmail?: string | null
  onClose: () => void
  onSave: (profile: UserProfile) => void
}

export default function ProfileModal({
  open,
  initialProfile,
  sessionEmail,
  onClose,
  onSave,
}: ProfileModalProps) {
  const [form, setForm] = useState<UserProfile>(initialProfile || DEFAULT_PROFILE)

  useEffect(() => {
    if (open) {
      setForm(initialProfile || DEFAULT_PROFILE)
    }
  }, [open, initialProfile])

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }

    if (open) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  const updateField = (key: keyof UserProfile, value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(form)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
      <div
        className="w-full max-w-2xl rounded-[28px] border border-white/[0.08] bg-[#131c36] shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-modal-heading"
      >
        <div className="border-b border-white/[0.07] px-6 py-5 sm:px-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-2 inline-flex items-center rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                Profile
              </div>
              <h2
                id="profile-modal-heading"
                className="text-2xl font-bold tracking-tight text-white"
              >
                Your professional details
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                This information will be used across your app experience, outreach, and
                future report branding.
              </p>
              {sessionEmail && (
                <p className="mt-2 text-xs text-slate-500">
                  Signed in as <span className="text-slate-300">{sessionEmail}</span>
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/[0.10] bg-white/[0.04] text-slate-400 transition hover:border-rose-500/30 hover:bg-rose-500/[0.08] hover:text-rose-300"
              aria-label="Close profile modal"
            >
              ✕
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 sm:px-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Your Name
              </label>
              <input
                type="text"
                value={form.yourName}
                onChange={(e) => updateField('yourName', e.target.value)}
                className="w-full rounded-xl border border-white/[0.10] bg-slate-950/50 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
                placeholder="Jessica Manning"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Title
              </label>
              <input
                type="text"
                value={form.yourTitle}
                onChange={(e) => updateField('yourTitle', e.target.value)}
                className="w-full rounded-xl border border-white/[0.10] bg-slate-950/50 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
                placeholder="Founder / Web Developer"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Company
              </label>
              <input
                type="text"
                value={form.yourCompany}
                onChange={(e) => updateField('yourCompany', e.target.value)}
                className="w-full rounded-xl border border-white/[0.10] bg-slate-950/50 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
                placeholder="Manning Web Studio"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Location
              </label>
              <input
                type="text"
                value={form.yourLocation}
                onChange={(e) => updateField('yourLocation', e.target.value)}
                className="w-full rounded-xl border border-white/[0.10] bg-slate-950/50 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
                placeholder="Sydney"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Specialty
            </label>
            <select
              value={form.yourSpecialty}
              onChange={(e) => updateField('yourSpecialty', e.target.value)}
              className="w-full rounded-xl border border-white/[0.10] bg-slate-950/50 px-4 py-3 text-sm text-white outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
            >
              <option value="">Select your specialty</option>
              <option value="Web Developer">Web Developer</option>
              <option value="Agency">Agency</option>
              <option value="Freelancer">Freelancer</option>
              <option value="SEO Consultant">SEO Consultant</option>
              <option value="Digital Studio">Digital Studio</option>
            </select>
          </div>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-white/[0.10] bg-white/[0.04] px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08]"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(37,99,235,0.28)] transition hover:bg-blue-500"
            >
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
