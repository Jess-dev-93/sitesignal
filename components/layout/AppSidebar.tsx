'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'
import { BRAND_NAME } from '../../lib/brand'
import { useSupabaseSession } from '../../lib/useSupabaseSession'
import ProfileModal from '../profile/ProfileModal'
import {
  DEFAULT_PROFILE,
  getStoredProfile,
  saveStoredProfile,
  type UserProfile,
} from '../../lib/profileStorage'

const SIDEBAR_COLLAPSED_KEY = 'siteSignalSidebarCollapsed'

function Icon({
  name,
  className = 'h-5 w-5',
}: {
  name:
    | 'grid'
    | 'users'
    | 'file'
    | 'send'
    | 'branch'
    | 'card'
    | 'settings'
    | 'help'
  className?: string
}) {
  const common = `${className} shrink-0`
  switch (name) {
    case 'grid':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z" stroke="currentColor" strokeWidth="1.7" />
        </svg>
      )
    case 'users':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0Z" stroke="currentColor" strokeWidth="1.7" />
          <path d="M4 20c1.6-3.5 5-5 8-5s6.4 1.5 8 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      )
    case 'file':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M7 3h7l3 3v15H7V3Z" stroke="currentColor" strokeWidth="1.7" />
          <path d="M14 3v4h4" stroke="currentColor" strokeWidth="1.7" />
        </svg>
      )
    case 'send':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M22 2 11 13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M22 2 15 22l-4-9-9-4L22 2Z" stroke="currentColor" strokeWidth="1.7" />
        </svg>
      )
    case 'branch':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 3v6a4 4 0 0 0 4 4h4a4 4 0 0 1 4 4v4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M6 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM18 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" stroke="currentColor" strokeWidth="1.7" />
        </svg>
      )
    case 'card':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M3 7h18v10H3V7Z" stroke="currentColor" strokeWidth="1.7" />
          <path d="M3 10h18" stroke="currentColor" strokeWidth="1.7" />
        </svg>
      )
    case 'settings':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" stroke="currentColor" strokeWidth="1.7" />
          <path d="M19.4 15a8.4 8.4 0 0 0 .1-1l2-1.2-2-3.4-2.3.6a8.8 8.8 0 0 0-1.7-1l-.3-2.3H11l-.3 2.3a8.8 8.8 0 0 0-1.7 1l-2.3-.6-2 3.4 2 1.2a8.4 8.4 0 0 0 .1 1 8.4 8.4 0 0 0-.1 1l-2 1.2 2 3.4 2.3-.6c.5.4 1.1.7 1.7 1l.3 2.3h4l.3-2.3c.6-.3 1.2-.6 1.7-1l2.3.6 2-3.4-2-1.2c.1-.3.1-.7.1-1Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
        </svg>
      )
    case 'help':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 17h.01" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M9.5 9a2.6 2.6 0 1 1 4.2 2.1c-.9.7-1.7 1.2-1.7 2.4v.3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" stroke="currentColor" strokeWidth="1.7" />
        </svg>
      )
  }
}

const MAIN_LINKS = [
  { href: '/app', label: 'Dashboard', icon: 'grid' as const },
  { href: '/app/leads', label: 'Leads', icon: 'users' as const },
  { href: '/app/audit', label: 'Audit', icon: 'file' as const },
  { href: '/app/outreach', label: 'Outreach', icon: 'send' as const },
  { href: '/app/pipeline', label: 'Pipeline', icon: 'branch' as const },
]

export default function AppSidebar() {
  const pathname = usePathname()
  const { email: sessionEmail, userId: sessionUserId } = useSupabaseSession()
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE)
  const [showProfile, setShowProfile] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    setProfile(getStoredProfile())
  }, [])

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true')
    } catch {}
  }, [])

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next))
      } catch {}
      return next
    })
  }

  const initials = useMemo(() => {
    const name = profile.yourName?.trim()
    if (name) return name.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()
    if (sessionEmail) return sessionEmail.slice(0, 2).toUpperCase()
    return 'SS'
  }, [profile.yourName, sessionEmail])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const handleSaveProfile = (nextProfile: UserProfile) => {
    setProfile(nextProfile)
    saveStoredProfile(nextProfile)
  }

  const content = (
    <>
      <div className={`flex items-center justify-between gap-3 px-5 py-5 ${collapsed ? 'px-4' : ''}`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 via-violet-500 to-indigo-500 shadow-[0_10px_30px_rgba(139,92,246,0.28)]">
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" aria-hidden="true">
              <path
                d="M4 13c2.2-6 4.6-6 6.8 0s4.6 6 6.8 0S22 7 20 13"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-bold leading-none text-white">{BRAND_NAME}</p>
              <p className="mt-1 truncate text-[11px] leading-none text-slate-500">
                Lead Generation + Website Audits
              </p>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={toggleCollapsed}
          className="hidden md:inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-200 transition hover:bg-white/[0.08]"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? '›' : '‹'}
        </button>
      </div>

      <div className={`${collapsed ? 'px-2' : 'px-4'} pb-4`}>
        {!collapsed && <div className="mb-4 h-px w-full bg-white/10" />}
        {!collapsed && (
          <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
            Main menu
          </p>
        )}
        <nav className="flex flex-col gap-1" aria-label="App navigation">
          {MAIN_LINKS.map((l) => {
            const active = l.href === '/app' ? pathname === '/app' : pathname.startsWith(l.href)
            return (
              <Link
                key={l.href}
                href={l.href}
                title={collapsed ? l.label : undefined}
                className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  active
                    ? 'bg-white/[0.06] text-white'
                    : 'text-slate-300 hover:bg-white/[0.04] hover:text-white'
                } ${collapsed ? 'justify-center px-2' : ''}`}
              >
                <span
                  className={`${
                    active ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                >
                  <Icon name={l.icon} className="h-5 w-5" />
                </span>
                {!collapsed && <span className="truncate">{l.label}</span>}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className={`mt-auto ${collapsed ? 'px-2' : 'px-4'} pb-5`}>
        {!collapsed && (
          <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
            Support
          </p>
        )}
        <nav className="flex flex-col gap-1">
          <Link
            href="/app/pricing"
            title={collapsed ? 'Pricing' : undefined}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
              pathname.startsWith('/app/pricing')
                ? 'bg-white/[0.06] text-white'
                : 'text-slate-300 hover:bg-white/[0.05] hover:text-white'
            } ${collapsed ? 'justify-center px-2' : ''}`}
          >
            <span className="text-slate-200">
              <Icon name="card" />
            </span>
            {!collapsed && 'Pricing'}
          </Link>
          <button
            type="button"
            onClick={() => setShowProfile(true)}
            title={collapsed ? 'Settings' : undefined}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-300 transition hover:bg-white/[0.05] hover:text-white ${
              collapsed ? 'justify-center px-2' : ''
            }`}
          >
            <span className="text-slate-200">
              <Icon name="settings" />
            </span>
            {!collapsed && 'Settings'}
          </button>
          <a
            href="mailto:hello@sitesignal.com.au?subject=SiteSignal%20Help"
            title={collapsed ? 'Help' : undefined}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.05] hover:text-white ${
              collapsed ? 'justify-center px-2' : ''
            }`}
          >
            <span className="text-slate-200">
              <Icon name="help" />
            </span>
            {!collapsed && 'Help'}
          </a>
        </nav>

        {!collapsed && <div className="mt-6 h-px w-full bg-white/10" />}

        <div className={`mt-6 rounded-2xl border border-white/10 bg-white/[0.04] ${collapsed ? 'p-2' : 'p-3'}`}>
          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
            <button
              type="button"
              onClick={() => setShowProfile(true)}
              className={`flex items-center gap-3 text-left ${collapsed ? '' : 'min-w-0 flex-1'}`}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 via-violet-500 to-indigo-500 text-xs font-bold text-white">
                {initials}
              </span>
              {!collapsed && (
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold text-white">
                    {sessionEmail || 'Signed out'}
                  </span>
                  <span className="mt-1 inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                    {sessionUserId ? 'Signed in' : 'Guest'}
                  </span>
                </span>
              )}
            </button>

            {!collapsed && sessionUserId && (
              <button
                type="button"
                onClick={handleSignOut}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-200 transition hover:bg-white/[0.08]"
                aria-label="Sign out"
                title="Sign out"
              >
                ↗
              </button>
            )}
          </div>
        </div>
      </div>

      <ProfileModal
        open={showProfile}
        initialProfile={profile}
        sessionEmail={sessionEmail}
        onClose={() => setShowProfile(false)}
        onSave={handleSaveProfile}
      />
    </>
  )

  return (
    <aside
      className={`hidden md:flex md:flex-col md:border-r md:border-sidebar-border md:bg-sidebar/80 md:backdrop-blur-2xl ${
        collapsed ? 'md:w-[84px]' : 'md:w-72'
      }`}
    >
      {content}
    </aside>
  )
}

