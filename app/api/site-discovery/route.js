import { NextResponse } from 'next/server'
import { runFullSiteAudit } from '../../../lib/siteAuditService'

export async function POST(request) {
  try {
    const body = await request.json()
    const { url } = body

    if (!url) {
      return NextResponse.json({ error: 'Please provide a URL' }, { status: 400 })
    }

    const result = await runFullSiteAudit(url, { maxPages: 20, maxDeepPages: 5 })

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Site audit failed' },
      { status: 500 }
    )
  }
}
