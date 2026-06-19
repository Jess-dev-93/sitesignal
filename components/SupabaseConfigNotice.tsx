'use client'

import Link from 'next/link'
import { supabaseConfigError } from '../lib/supabaseClient'

export default function SupabaseConfigNotice() {
  if (!supabaseConfigError) return null

  return (
    <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
      <p className="font-semibold text-amber-50">Sign-in is unavailable right now</p>
      <p className="mt-2 leading-relaxed text-amber-100/90">{supabaseConfigError}</p>
      <p className="mt-2 leading-relaxed text-amber-100/80">
        On Vercel, add both variables under Project Settings → Environment Variables, then trigger
        a new deploy so the client bundle picks them up.
      </p>
      <p className="mt-3">
        <Link href="/" className="font-medium text-white underline underline-offset-2">
          Back to home
        </Link>
      </p>
    </div>
  )
}
