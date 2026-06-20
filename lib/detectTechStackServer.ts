import { detectTechStack, type TechStack } from './techStack'

const FETCH_TIMEOUT_MS = 8000
const MAX_HTML_BYTES = 400_000

/** Fetch homepage HTML + headers for stack fingerprinting. */
export async function fetchPageForStackDetection(url: string): Promise<{
  html: string
  headers: Record<string, string>
}> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'SiteSignal/1.0 (website audit; +https://sitesignal.com.au)',
        Accept: 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
      cache: 'no-store',
    })

    const headers: Record<string, string> = {}
    res.headers.forEach((value, key) => {
      headers[key] = value
    })

    const buffer = await res.arrayBuffer()
    const slice = buffer.byteLength > MAX_HTML_BYTES ? buffer.slice(0, MAX_HTML_BYTES) : buffer
    const html = new TextDecoder('utf-8', { fatal: false }).decode(slice)

    return { html, headers }
  } catch (error) {
    console.warn('Stack detection fetch failed:', error instanceof Error ? error.message : error)
    return { html: '', headers: {} }
  } finally {
    clearTimeout(timeout)
  }
}

export async function detectTechStackFromUrl(url: string): Promise<TechStack> {
  const { html, headers } = await fetchPageForStackDetection(url)
  return detectTechStack(html, headers)
}
