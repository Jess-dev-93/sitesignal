/** True when the URL hash is a Supabase password-recovery handoff. */
export function isPasswordRecoveryHash(hash: string): boolean {
  if (!hash) return false
  const params = new URLSearchParams(hash.replace(/^#/, ''))
  return params.get('type') === 'recovery' && Boolean(params.get('access_token'))
}

/** Send recovery tokens on the current URL to the reset-password page. */
export function passwordRecoveryRedirectTarget(pathname: string, hash: string): string | null {
  if (pathname === '/reset-password' || !isPasswordRecoveryHash(hash)) {
    return null
  }
  return `/reset-password${hash}`
}
