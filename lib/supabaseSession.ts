import type { Session } from '@supabase/supabase-js'
import { supabase, supabaseConfigError } from './supabaseClient'

type SessionListener = (session: Session | null) => void

let initPromise: Promise<Session | null> | null = null
let authListenerStarted = false
const listeners = new Set<SessionListener>()

function notifyListeners(session: Session | null) {
  listeners.forEach((listener) => listener(session))
}

function ensureAuthListener() {
  if (authListenerStarted || supabaseConfigError) return
  authListenerStarted = true

  supabase.auth.onAuthStateChange((_event, session) => {
    notifyListeners(session)
  })
}

function loadInitialSession(): Promise<Session | null> {
  if (supabaseConfigError) {
    return Promise.resolve(null)
  }

  if (!initPromise) {
    initPromise = supabase.auth
      .getSession()
      .then(({ data }) => data.session)
      .catch(() => null)
  }

  return initPromise
}

export function subscribeToAuthSession(listener: SessionListener): () => void {
  if (supabaseConfigError) {
    listener(null)
    return () => {}
  }

  ensureAuthListener()
  listeners.add(listener)

  void loadInitialSession().then((session) => {
    listener(session)
  })

  return () => {
    listeners.delete(listener)
  }
}
