/** Extract document title from raw HTML. */
export function extractPageTitle(html: string): string | null {
  if (!html) return null
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  if (!match?.[1]) return null
  const title = match[1]
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return title.length > 0 ? title.slice(0, 140) : null
}

export function hostnameFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
  }
}

export function displaySiteName(url: string, pageTitle?: string | null): string {
  if (pageTitle) {
    const cleaned = pageTitle
      .replace(/\s*[|\-–—]\s*.+$/, '')
      .trim()
    if (cleaned.length > 2) return cleaned
  }
  const host = hostnameFromUrl(url)
  const base = host.split('.')[0]
  return base
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function faviconUrl(url: string, size = 32): string {
  const host = hostnameFromUrl(url)
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=${size}`
}
