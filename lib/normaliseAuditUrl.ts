const TRACKING_PARAMS = new Set([
  'gclid',
  'gbraid',
  'wbraid',
  'fbclid',
  'msclkid',
  '_gl',
  '_ga',
  '_gid',
])

export function normaliseAuditUrl(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ''

  const withProtocol =
    trimmed.startsWith('http://') || trimmed.startsWith('https://')
      ? trimmed
      : `https://${trimmed}`

  try {
    const url = new URL(withProtocol)

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return ''
    }

    Array.from(url.searchParams.keys()).forEach((key) => {
      const lowerKey = key.toLowerCase()

      if (TRACKING_PARAMS.has(lowerKey) || lowerKey.startsWith('utm_')) {
        url.searchParams.delete(key)
      }
    })

    url.hash = ''

    return url.toString()
  } catch {
    return ''
  }
}

export function getDisplayAuditUrl(value: string) {
  const normalised = normaliseAuditUrl(value)

  if (!normalised) return value.trim()

  try {
    const url = new URL(normalised)

    if (url.pathname === '/' && !url.search) {
      return `${url.origin}/`
    }

    return url.toString()
  } catch {
    return normalised
  }
}