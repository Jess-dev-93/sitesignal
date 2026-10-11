export const AUTH_REQUIRED = false

export const GUEST_USER_ID = 'demo-user'

export function isGuestModeEnabled() {
  return !AUTH_REQUIRED
}