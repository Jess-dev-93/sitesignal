// Temporary development/preview bypass for auth.
// Set this to true to restore normal Supabase auth enforcement later.
export const AUTH_REQUIRED = false

export function isGuestModeEnabled() {
  return !AUTH_REQUIRED
}
