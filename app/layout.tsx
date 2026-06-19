import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'], display: 'swap', variable: '--font-sans' })
const geistMono = Geist_Mono({ subsets: ['latin'], display: 'swap', variable: '--font-mono' })

/* ─────────────────────────────────────────────
   SITE-WIDE SEO & SOCIAL META
   Update businessCity / businessRegion if needed
───────────────────────────────────────────── */
import { BRAND_NAME } from '../lib/brand'

const siteName = BRAND_NAME
const siteUrl = 'https://siteSignal.com.au' // ← update to your live domain
const siteDescription =
  'Find underperforming business websites in your local market, run a professional audit in minutes, and turn the findings into paying clients. Built for Australian web developers and digital agencies.'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  // ── Core ──────────────────────────────────
  title: {
    default: `${siteName} — Find Weak Websites & Win More Clients`,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  keywords: [
    'website audit tool',
    'lead generation for web developers',
    'find clients Australia',
    'website performance audit',
    'SEO audit tool',
    'freelance web developer tools',
    'SiteSignal',
    'bad website finder',
    'web development leads Australia',
    'local business website audit',
    'cold outreach web design',
    'Australian web developer',
  ],
  authors: [{ name: BRAND_NAME, url: siteUrl }],
  creator: BRAND_NAME,
  publisher: BRAND_NAME,
  category: 'Technology',
  applicationName: siteName,

  // ── Canonical & Robots ────────────────────
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // ── Open Graph (Facebook / LinkedIn) ──────
  openGraph: {
    type: 'website',
    locale: 'en_AU',
    url: siteUrl,
    siteName,
    title: `${siteName} — Find Weak Websites & Win More Clients`,
    description: siteDescription,
    images: [
      {
        url: '/og-image.png', // ← add a 1200×630 image to /public
        width: 1200,
        height: 630,
        alt: `${BRAND_NAME} — Lead generation and website audit tool for web developers`,
        type: 'image/png',
      },
    ],
  },

  // ── Twitter / X Card ──────────────────────
  twitter: {
    card: 'summary_large_image',
    title: `${siteName} — Find Weak Websites & Win More Clients`,
    description: siteDescription,
    images: ['/og-image.png'],
    creator: '@siteSignal', // ← update to your handle if you have one
  },

  // ── Icons ─────────────────────────────────
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },

  // ── App / PWA ─────────────────────────────
  manifest: '/site.webmanifest',

  // ── Verification (add when ready) ─────────
  // verification: {
  //   google: 'your-google-search-console-token',
  // },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0b1020' },
    { media: '(prefers-color-scheme: light)', color: '#0b1020' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  colorScheme: 'dark',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en-AU"
      className={`${geist.variable} ${geistMono.variable} dark bg-background`}
      suppressHydrationWarning
    >
      <head>
        {/* ── Structured Data (JSON-LD) ── */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: siteName,
              applicationCategory: 'BusinessApplication',
              operatingSystem: 'Web',
              url: siteUrl,
              description: siteDescription,
              inLanguage: 'en-AU',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'AUD',
              },
              author: {
                '@type': 'Organization',
                name: siteName,
                url: siteUrl,
                address: {
                  '@type': 'PostalAddress',
                  addressLocality: 'Sydney',
                  addressRegion: 'NSW',
                  addressCountry: 'AU',
                },
              },
              featureList: [
                'AI-powered website audit',
                'Lead generation for web developers',
                'SEO and performance analysis',
                'Client outreach generation',
                'Pipeline CRM tracking',
                'CSV lead export',
              ],
            }),
          }}
        />

        {/* ── Preconnect for performance ── */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>

      <body
        className={`
          ${geist.className}
          antialiased
          min-h-screen
          bg-background
          text-foreground
        `}
      >
        {children}
      </body>
    </html>
  )
}