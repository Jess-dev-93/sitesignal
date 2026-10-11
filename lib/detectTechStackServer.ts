import {
  detectTechStack,
  type TechStack,
} from './techStack'

import {
  extractPageTitle,
} from './pageMeta'

const FETCH_TIMEOUT_MS =
  10_000

const MAX_HTML_BYTES =
  750_000

async function readLimitedHtml(
  response: Response
): Promise<string> {
  if (!response.body) {
    return ''
  }

  const reader =
    response.body.getReader()

  const chunks:
    Uint8Array[] =
    []

  let received = 0

  while (true) {
    const {
      done,
      value,
    } = await reader.read()

    if (done) {
      break
    }

    if (!value) {
      continue
    }

    const remaining =
      MAX_HTML_BYTES -
      received

    if (remaining <= 0) {
      await reader.cancel()
      break
    }

    const chunk =
      value.byteLength >
      remaining
        ? value.slice(
            0,
            remaining
          )
        : value

    chunks.push(chunk)

    received +=
      chunk.byteLength

    if (
      received >=
      MAX_HTML_BYTES
    ) {
      await reader.cancel()
      break
    }
  }

  const combined =
    new Uint8Array(
      received
    )

  let offset = 0

  chunks.forEach(
    (chunk) => {
      combined.set(
        chunk,
        offset
      )

      offset +=
        chunk.byteLength
    }
  )

  return new TextDecoder(
    'utf-8',
    {
      fatal: false,
    }
  ).decode(combined)
}

/**
 * Fetch homepage HTML and response headers
 * for public technology detection.
 */
export async function fetchPageForStackDetection(
  url: string
): Promise<{
  html: string
  headers: Record<
    string,
    string
  >
}> {
  const controller =
    new AbortController()

  const timeout =
    setTimeout(
      () =>
        controller.abort(),
      FETCH_TIMEOUT_MS
    )

  try {
    const res =
      await fetch(
        url,
        {
          signal:
            controller.signal,

          headers: {
            'User-Agent':
              'JM-Sites-Audit/1.0 (+https://jmsites.dev)',

            Accept:
              'text/html,application/xhtml+xml',
          },

          redirect:
            'follow',

          cache:
            'no-store',
        }
      )

    if (!res.ok) {
      throw new Error(
        `Website returned HTTP ${res.status}`
      )
    }

    const contentType =
      res.headers.get(
        'content-type'
      ) || ''

    if (
      contentType &&
      !/text\/html|application\/xhtml\+xml/i.test(
        contentType
      )
    ) {
      throw new Error(
        `Website returned unsupported content type: ${contentType}`
      )
    }

    const headers:
      Record<
        string,
        string
      > = {}

    res.headers.forEach(
      (
        value,
        key
      ) => {
        headers[key] =
          value
      }
    )

    const html =
      await readLimitedHtml(
        res
      )

    return {
      html,
      headers,
    }
  } catch (error) {
    console.warn(
      'Stack detection fetch failed:',

      error instanceof Error
        ? error.message
        : error
    )

    return {
      html: '',
      headers: {},
    }
  } finally {
    clearTimeout(
      timeout
    )
  }
}

export async function detectTechStackFromUrl(
  url: string
): Promise<{
  stack: TechStack
  pageTitle:
    string | null
}> {
  const {
    html,
    headers,
  } =
    await fetchPageForStackDetection(
      url
    )

  return {
    stack:
      detectTechStack(
        html,
        headers
      ),

    pageTitle:
      extractPageTitle(
        html
      ),
  }
}