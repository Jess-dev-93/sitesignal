'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import MainNavbar from '../components/layout/MainNavbar'
import AccountPrompt from '../components/profile/AccountPrompt'
import ProfileModal from '../components/profile/ProfileModal'
import {
  DEFAULT_PROFILE,
  getStoredProfile,
  saveStoredProfile,
  UserProfile,
} from '../lib/profileStorage'

export default function HomePage() {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE)
  const [sessionEmail, setSessionEmail] = useState<string | null>(null)
  const [sessionUserId, setSessionUserId] = useState<string | null>(null)
  const [showProfileModal, setShowProfileModal] = useState(false)

  useEffect(() => {
    setProfile(getStoredProfile())

    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSessionEmail(data.session?.user?.email || null)
      setSessionUserId(data.session?.user?.id || null)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionEmail(session?.user?.email || null)
      setSessionUserId(session?.user?.id || null)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const handleSaveProfile = (nextProfile: UserProfile) => {
    setProfile(nextProfile)
    saveStoredProfile(nextProfile)
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.13),transparent_55%),linear-gradient(160deg,#080e1f_0%,#0f1a38_50%,#080e1f_100%)]">
      <MainNavbar
        sessionEmail={sessionEmail}
        isLoggedIn={!!sessionUserId}
        profile={profile}
        onOpenProfile={() => setShowProfileModal(true)}
        onSignOut={handleSignOut}
        appHref="/app"
      />

      <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 md:px-6 md:py-10">
        <section
          aria-labelledby="hero-heading"
          className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-white/[0.035] px-5 py-8 shadow-[0_24px_60px_rgba(0,0,0,0.2)] backdrop-blur-sm sm:px-8 sm:py-10 md:px-12 md:py-12"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-16 right-0 h-56 w-56 rounded-full bg-blue-500/[0.10] blur-3xl sm:h-72 sm:w-72"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:36px_36px]"
          />

          <div className="relative mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/[0.08] px-3.5 py-1.5 text-[11px] font-semibold tracking-wide text-blue-200 sm:text-xs">
              <span aria-hidden="true">🚀</span>
              <span>Built for Australian web developers &amp; digital agencies</span>
            </div>

            <h1
              id="hero-heading"
              className="text-[1.75rem] font-bold leading-[1.08] tracking-tight text-white sm:text-4xl md:text-5xl lg:text-[3rem]"
            >
              Turn underperforming websites
              <span className="mt-1 block bg-gradient-to-r from-blue-300 via-cyan-300 to-blue-400 bg-clip-text pb-2 text-transparent sm:mt-1.5">
                into paying clients
              </span>
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-300 sm:mt-5 sm:text-base">
              Identify businesses running on slow, outdated, or poorly optimised websites.
              Audit them in minutes, generate a professional pitch, and close the work —
              all in one place.
            </p>

            <div className="mt-5 flex flex-col gap-2.5 sm:mt-6 sm:flex-row sm:justify-center">
              {sessionUserId ? (
                <>
                  <Link
                    href="/app"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(37,99,235,0.26)] transition hover:-translate-y-0.5 hover:bg-blue-500 active:translate-y-0 sm:w-auto sm:px-7 sm:py-3.5"
                  >
                    <span aria-hidden="true">🎯</span>
                    Open App
                  </Link>

                  <button
                    onClick={() => setShowProfileModal(true)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/[0.12] bg-white/[0.06] px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:-translate-y-0.5 hover:bg-white/[0.10] active:translate-y-0 sm:w-auto sm:px-7 sm:py-3.5"
                  >
                    <span aria-hidden="true">✍️</span>
                    Edit Profile
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/signup"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(37,99,235,0.26)] transition hover:-translate-y-0.5 hover:bg-blue-500 active:translate-y-0 sm:w-auto sm:px-7 sm:py-3.5"
                  >
                    <span aria-hidden="true">🎯</span>
                    Start Free
                  </Link>

                  <Link
                    href="/signin"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/[0.12] bg-white/[0.06] px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:-translate-y-0.5 hover:bg-white/[0.10] active:translate-y-0 sm:w-auto sm:px-7 sm:py-3.5"
                  >
                    <span aria-hidden="true">🔐</span>
                    Sign In
                  </Link>
                </>
              )}
            </div>

            <p className="mt-4 text-[11px] text-slate-500 sm:mt-5">
              Trusted by web developers across Sydney, Melbourne, Brisbane &amp; beyond
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                {
                  icon: '⚡',
                  title: 'Fast & Focused',
                  body: 'Find leads, Audit Websites, and move from research to a client conversation — without the usual back-and-forth.',
                },
                {
                  icon: '📈',
                  title: 'Commercially Actionable',
                  body: 'Every scan surfaces real issues and translates them into outreach that makes commercial sense to a business owner.',
                },
                {
                  icon: '🏆',
                  title: 'Agency-Grade Output',
                  body: 'Present yourself like a premium studio. Deliver findings that look polished and justify a serious project fee.',
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 text-left"
                >
                  <div className="mb-2 text-xl">{feature.icon}</div>
                  <h3 className="text-sm font-semibold text-white">{feature.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-400">
                    {feature.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {!sessionUserId && <AccountPrompt />}

        <section className="rounded-[28px] border border-white/[0.08] bg-white/[0.035] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.18)] backdrop-blur-sm sm:p-8 md:p-10">
          <div className="max-w-3xl">
            <div className="mb-2 inline-flex items-center rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
              How it works
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              A cleaner way to win web clients
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-400 sm:text-base">
              sitesignal helps you move from research to outreach without juggling five
              different tools. Search for weak local business websites, run a professional
              audit, generate outreach, and keep track of every opportunity.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              {
                step: '01',
                title: 'Find weak websites',
                body: 'Search by industry and location to surface local businesses with weak website fundamentals and strong opportunity potential.',
              },
              {
                step: '02',
                title: 'Run an instant audit',
                body: 'Generate a fast, client-ready website audit with performance, SEO, accessibility, and best-practice findings.',
              },
              {
                step: '03',
                title: 'Generate outreach',
                body: 'Turn your findings into commercially sensible outreach you can use in email, calls, follow-ups, and direct messages.',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5"
              >
                <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-sm font-bold text-blue-300">
                  {item.step}
                </div>
                <h3 className="text-base font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href={sessionUserId ? '/app' : '/signup'}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(37,99,235,0.24)] transition hover:bg-blue-500"
            >
              {sessionUserId ? 'Open App' : 'Create Free Account'}
            </Link>
          </div>
        </section>

        <footer
          role="contentinfo"
          className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-white/[0.035] backdrop-blur-sm"
        >
          <div className="relative flex flex-col items-center gap-4 px-6 py-8 text-center sm:flex-row sm:justify-between sm:px-10 sm:py-6 sm:text-left">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 text-base shadow-[0_6px_16px_rgba(37,99,235,0.25)]">
                🎯
              </div>
              <div className="text-left">
                <p className="text-sm font-bold leading-none text-white">sitesignal</p>
                <p className="mt-0.5 text-[11px] leading-none tracking-wide text-slate-500">
                  Lead generation + website audits · Sydney, Australia
                </p>
              </div>
            </div>

            <p className="hidden text-sm text-slate-500 md:block">
              Built for web developers who want to{' '}
              <span className="text-slate-300">win better client work</span> 🚀
            </p>

            <p className="text-[11px] text-slate-600">
              © {new Date().getFullYear()} sitesignal. All rights reserved.
            </p>
          </div>
        </footer>
      </div>

      <ProfileModal
        open={showProfileModal}
        initialProfile={profile}
        sessionEmail={sessionEmail}
        onClose={() => setShowProfileModal(false)}
        onSave={handleSaveProfile}
      />
    </main>
  )
}