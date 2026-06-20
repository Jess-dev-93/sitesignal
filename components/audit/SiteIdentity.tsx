import Image from 'next/image'
import { faviconUrl, hostnameFromUrl, displaySiteName } from '../../lib/pageMeta'
import { formatScanTimestamp } from '../../lib/formatScanTime'

type SiteIdentityProps = {
  url: string
  pageTitle?: string | null
  scannedAt?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function SiteIdentity({
  url,
  pageTitle,
  scannedAt,
  size = 'md',
}: SiteIdentityProps) {
  const host = hostnameFromUrl(url)
  const name = displaySiteName(url, pageTitle)
  const titleClass =
    size === 'lg'
      ? 'text-xl font-bold sm:text-2xl'
      : size === 'sm'
        ? 'text-sm font-semibold'
        : 'text-lg font-semibold'

  return (
    <div className="flex items-start gap-3">
      <div className="relative mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <Image
          src={faviconUrl(url, 64)}
          alt=""
          width={24}
          height={24}
          className="h-6 w-6 object-contain"
          unoptimized
        />
      </div>
      <div className="min-w-0">
        <p className={`truncate text-foreground ${titleClass}`}>{name}</p>
        <p className="mt-0.5 truncate text-sm text-muted-foreground">{host}</p>
        {scannedAt ? (
          <p className="mt-1 text-xs text-muted-foreground/80">{formatScanTimestamp(scannedAt)}</p>
        ) : null}
      </div>
    </div>
  )
}
