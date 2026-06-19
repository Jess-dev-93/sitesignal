'use client'

import React, { useEffect, useState } from 'react'
import {
  getStoredProfile,
  saveStoredProfile,
  UserProfile,
} from '../lib/profileStorage'

// ─── Constants ────────────────────────────────────────────────────────────────

const ONBOARDING_KEY = 'clientFinderOnboardingComplete'

const SPECIALTIES = [
  'Web Design',
  'Web Development',
  'SEO & Performance',
  'Digital Marketing',
  'E-commerce',
  'WordPress',
  'Shopify',
  'Full-Stack Dev',
  'UI/UX Design',
  'Other',
]

// ─── Types ────────────────────────────────────────────────────────────────────

interface OnboardingModalProps {
  onComplete: () => void
}

type Step = 'name' | 'company' | 'specialty' | 'done'

const STEPS: Step[] = ['name', 'company', 'specialty', 'done']

function getStepIndex(step: Step) {
  return STEPS.indexOf(step)
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState<Step>('name')
  const [form, setForm] = useState({
    yourName: '',
    yourTitle: '',
    yourCompany: '',
    yourLocation: '',
    yourSpecialty: '',
  })
  const [customSpecialty, setCustomSpecialty] = useState('')
  const [saving, setSaving] = useState(false)
  const [visible, setVisible] = useState(false)

  // Fade in on mount
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50)
    return () => clearTimeout(t)
  }, [])

  // ✅ REMOVED — the bad useEffect that referenced authChecked,
  //    sessionUserId and setShowOnboarding (page-level variables
  //    that don't exist here). The parent page handles show/hide logic.

  // ── Handlers ──────────────────────────────────────────────────────────────

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function nextStep() {
    const idx = getStepIndex(step)
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1])
  }

  function prevStep() {
    const idx = getStepIndex(step)
    if (idx > 0) setStep(STEPS[idx - 1])
  }

  function handleSkip() {
    localStorage.setItem(ONBOARDING_KEY, 'true')
    onComplete()
  }

  async function handleFinish() {
    setSaving(true)

    const existing = getStoredProfile()
    const finalSpecialty =
      form.yourSpecialty === 'Other' ? customSpecialty : form.yourSpecialty

    const updated: UserProfile = {
      ...existing,
      yourName:      form.yourName.trim()     || existing.yourName,
      yourTitle:     form.yourTitle.trim()    || existing.yourTitle,
      yourCompany:   form.yourCompany.trim()  || existing.yourCompany,
      yourLocation:  form.yourLocation.trim() || existing.yourLocation,
      yourSpecialty: finalSpecialty.trim()    || existing.yourSpecialty,
    }

    saveStoredProfile(updated)
    localStorage.setItem(ONBOARDING_KEY, 'true')

    await new Promise((r) => setTimeout(r, 600))
    setSaving(false)
    onComplete()
  }

  // ── Derived ───────────────────────────────────────────────────────────────

  const stepIndex   = getStepIndex(step)
  const progressPct = step === 'done' ? 100 : Math.round((stepIndex / 3) * 100)

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className={`
        fixed inset-0 z-[9999] flex items-center justify-center p-4
        bg-black/70 backdrop-blur-sm
        transition-opacity duration-300
        ${visible ? 'opacity-100' : 'opacity-0'}
      `}
    >
      <div
        className={`
          relative w-full max-w-md
          bg-[#0d1424] border border-white/[0.09]
          rounded-[28px] shadow-[0_32px_80px_rgba(0,0,0,0.5)]
          overflow-hidden
          transition-all duration-300
          ${visible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}
        `}
      >
        {/* Glow accents */}
        <div className="pointer-events-none absolute -top-20 -left-20 w-72 h-72 rounded-full bg-blue-600/[0.08] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 w-72 h-72 rounded-full bg-indigo-600/[0.08] blur-3xl" />

        {/* Skip / close */}
        <button
          onClick={handleSkip}
          aria-label="Skip onboarding"
          className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-xl text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-all"
        >
          ✕
        </button>

        {/* Progress bar */}
        <div className="h-1 w-full bg-white/[0.06]">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Content */}
        <div className="px-8 py-10">

          {/* STEP: name */}
          {step === 'name' && (
            <StepWrapper
              emoji="👋"
              heading="Welcome to sitesignal"
              sub="Let's personalise your workspace. What's your name?"
            >
              <label className="block text-sm text-white/50 mb-1.5">Your name</label>
              <input
                autoFocus
                type="text"
                placeholder="e.g. Alex Johnson"
                value={form.yourName}
                onChange={(e) => update('yourName', e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && form.yourName.trim() && nextStep()}
                className={inputClass}
              />

              <label className="block text-sm text-white/50 mb-1.5 mt-5">
                Your title <span className="text-white/30">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Web Developer, Freelancer"
                value={form.yourTitle}
                onChange={(e) => update('yourTitle', e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && form.yourName.trim() && nextStep()}
                className={inputClass}
              />

              <div className="mt-8 flex justify-end">
                <NextButton disabled={!form.yourName.trim()} onClick={nextStep} />
              </div>
            </StepWrapper>
          )}

          {/* STEP: company */}
          {step === 'company' && (
            <StepWrapper
              emoji="🏢"
              heading="Your Business"
              sub="This fills in your company name across audits and outreach."
            >
              <label className="block text-sm text-white/50 mb-1.5">
                Company / business name
              </label>
              <input
                autoFocus
                type="text"
                placeholder="e.g. Bright Web Studio"
                value={form.yourCompany}
                onChange={(e) => update('yourCompany', e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && nextStep()}
                className={inputClass}
              />

              <label className="block text-sm text-white/50 mb-1.5 mt-5">
                Your location <span className="text-white/30">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Melbourne, VIC"
                value={form.yourLocation}
                onChange={(e) => update('yourLocation', e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && nextStep()}
                className={inputClass}
              />

              <div className="mt-8 flex justify-between">
                <BackButton onClick={prevStep} />
                <NextButton onClick={nextStep} />
              </div>
            </StepWrapper>
          )}

          {/* STEP: specialty */}
          {step === 'specialty' && (
            <StepWrapper
              emoji="🎯"
              heading="Your Specialty"
              sub="We'll use this to tailor your outreach and audit reports."
            >
              <div className="grid grid-cols-2 gap-2 mt-1">
                {SPECIALTIES.map((s) => (
                  <button
                    key={s}
                    onClick={() => update('yourSpecialty', s)}
                    className={`
                      px-3 py-2.5 rounded-xl text-sm font-medium text-left
                      border transition-all duration-150
                      ${
                        form.yourSpecialty === s
                          ? 'border-blue-500 bg-blue-500/[0.15] text-blue-300'
                          : 'border-white/[0.08] bg-white/[0.03] text-white/60 hover:border-white/20 hover:text-white/80'
                      }
                    `}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {form.yourSpecialty === 'Other' && (
                <div className="mt-4">
                  <input
                    autoFocus
                    type="text"
                    placeholder="e.g. Mobile App Development"
                    value={customSpecialty}
                    onChange={(e) => setCustomSpecialty(e.target.value)}
                    className={inputClass}
                  />
                </div>
              )}

              <div className="mt-8 flex justify-between">
                <BackButton onClick={prevStep} />
                <NextButton label="Almost done →" onClick={nextStep} />
              </div>
            </StepWrapper>
          )}

          {/* STEP: done */}
          {step === 'done' && (
            <StepWrapper
              emoji="🎉"
              heading={`You're all set${form.yourName ? `, ${form.yourName.split(' ')[0]}` : ''}!`}
              sub="Your workspace is ready. Here's what you can do first:"
            >
              <ul className="space-y-3 mt-2">
                {[
                  { icon: '🔍', text: 'Find local businesses that need a new website' },
                  { icon: '⚡', text: 'Audit any site — speed, SEO, accessibility' },
                  { icon: '✉️', text: 'Generate personalised outreach in one click' },
                  { icon: '📞', text: 'Build your call list and track leads' },
                ].map((item) => (
                  <li key={item.text} className="flex items-start gap-3 text-sm text-white/60">
                    <span className="mt-0.5 text-base">{item.icon}</span>
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={handleFinish}
                disabled={saving}
                className="
                  mt-8 w-full py-3.5 rounded-2xl font-semibold text-sm
                  bg-gradient-to-r from-blue-600 to-indigo-600
                  hover:from-blue-500 hover:to-indigo-500
                  text-white shadow-lg shadow-blue-900/30
                  disabled:opacity-60 disabled:cursor-not-allowed
                  transition-all duration-200
                "
              >
                {saving ? 'Setting up your workspace…' : 'Start finding clients →'}
              </button>
            </StepWrapper>
          )}

        </div>

        {/* Step dots */}
        {step !== 'done' && (
          <div className="pb-6 flex justify-center gap-2">
            {(['name', 'company', 'specialty'] as Step[]).map((s, i) => (
              <div
                key={s}
                className={`
                  rounded-full transition-all duration-300
                  ${
                    i === stepIndex
                      ? 'w-6 h-2 bg-blue-500'
                      : i < stepIndex
                      ? 'w-2 h-2 bg-blue-500/50'
                      : 'w-2 h-2 bg-white/[0.12]'
                  }
                `}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepWrapper({
  emoji,
  heading,
  sub,
  children,
}: {
  emoji: string
  heading: string
  sub: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="text-4xl mb-4">{emoji}</div>
      <h2 className="text-xl font-bold text-white mb-2">{heading}</h2>
      <p className="text-sm text-white/50 mb-6 leading-relaxed">{sub}</p>
      {children}
    </div>
  )
}

function NextButton({
  onClick,
  disabled = false,
  label = 'Continue →',
}: {
  onClick: () => void
  disabled?: boolean
  label?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="
        px-6 py-2.5 rounded-xl text-sm font-semibold
        bg-gradient-to-r from-blue-600 to-indigo-600
        hover:from-blue-500 hover:to-indigo-500
        text-white shadow-md shadow-blue-900/30
        disabled:opacity-40 disabled:cursor-not-allowed
        transition-all duration-200
      "
    >
      {label}
    </button>
  )
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="
        px-4 py-2.5 rounded-xl text-sm font-medium
        text-white/40 hover:text-white/70
        transition-colors duration-200
      "
    >
      ← Back
    </button>
  )
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const inputClass = [
  'w-full px-4 py-3 rounded-xl text-sm text-white',
  'bg-white/[0.05] border border-white/[0.09]',
  'placeholder:text-white/25',
  'focus:outline-none focus:border-blue-500/60 focus:bg-white/[0.07]',
  'transition-all duration-200',
].join(' ')