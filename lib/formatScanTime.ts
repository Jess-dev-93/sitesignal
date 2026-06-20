export function formatScanTimestamp(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return 'Recently scanned'

  const now = Date.now()
  const diffMs = now - date.getTime()
  const diffMins = Math.floor(diffMs / 60_000)

  if (diffMins < 1) return 'Scanned just now'
  if (diffMins < 60) return `Scanned ${diffMins} minute${diffMins === 1 ? '' : 's'} ago`

  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `Scanned ${diffHours} hour${diffHours === 1 ? '' : 's'} ago`

  return `Scanned ${date.toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })}`
}
