import { AUTH_REQUIRED } from './authGuestMode'

export function getUserIdFromRequest(req) {
  if (!AUTH_REQUIRED) {
    return req.headers.get('x-user-id') || null
  }

  // Temporary fallback until auth is wired in.
  // Replace later with Clerk / Supabase Auth / NextAuth user id.
  return req.headers.get('x-user-id') || 'demo-user'
}