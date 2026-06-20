export type TechStackConfidence = 'high' | 'medium' | 'low'

export type TechStack = {
  cms: string
  pageBuilder: string | null
  hosting: string
  confidence: TechStackConfidence
}

export type RecommendedPath = {
  role: 'best' | 'alternative' | 'performance'
  roleLabel: string
  title: string
  description: string
}

function headerLookup(headers: Record<string, string>, name: string): string {
  const key = Object.keys(headers).find((k) => k.toLowerCase() === name.toLowerCase())
  return key ? headers[key] : ''
}

function matchAny(html: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(html))
}

/** Detect CMS, page builder, and hosting hints from HTML + response headers. */
export function detectTechStack(
  html: string,
  headers: Record<string, string> = {}
): TechStack {
  const lower = html.toLowerCase()
  const server = headerLookup(headers, 'server').toLowerCase()
  const poweredBy = headerLookup(headers, 'x-powered-by').toLowerCase()
  const via = headerLookup(headers, 'via').toLowerCase()

  let cms = 'Unknown CMS'
  let pageBuilder: string | null = null
  let confidence: TechStackConfidence = 'low'

  if (
    matchAny(lower, [
      /wp-content\//,
      /wp-includes\//,
      /wordpress/i,
      /<meta[^>]+name=["']generator["'][^>]+wordpress/i,
    ])
  ) {
    cms = 'WordPress'
    confidence = 'high'
  } else if (matchAny(lower, [/cdn\.shopify\.com/, /shopify\.theme/, /x-shopify-stage/i])) {
    cms = 'Shopify'
    confidence = 'high'
  } else if (matchAny(lower, [/webflow\.com/, /data-wf-page/, /data-wf-site/])) {
    cms = 'Webflow'
    confidence = 'high'
  } else if (matchAny(lower, [/wixstatic\.com/, /static\.wix\.com/, /wix\.com/])) {
    cms = 'Wix'
    confidence = 'high'
  } else if (matchAny(lower, [/squarespace\.com/, /static1\.squarespace/])) {
    cms = 'Squarespace'
    confidence = 'high'
  } else if (matchAny(lower, [/__next_data__/, /_next\/static/])) {
    cms = 'Next.js'
    confidence = 'high'
  } else if (matchAny(lower, [/framerusercontent\.com/, /data-framer/])) {
    cms = 'Framer'
    confidence = 'high'
  } else if (matchAny(lower, [/joomla/i, /\/components\/com_/])) {
    cms = 'Joomla'
    confidence = 'medium'
  } else if (matchAny(lower, [/drupal\.settings/, /drupal\.js/])) {
    cms = 'Drupal'
    confidence = 'medium'
  } else if (matchAny(lower, [/hubspot/i, /hs-scripts\.com/])) {
    cms = 'HubSpot CMS'
    confidence = 'medium'
  } else if (html.length > 500) {
    cms = 'Custom / unknown'
    confidence = 'low'
  }

  if (matchAny(lower, [/elementor/, /data-elementor/])) {
    pageBuilder = 'Elementor'
    confidence = 'high'
  } else if (matchAny(lower, [/et_pb_/, /divi-/i, /elegantthemes/])) {
    pageBuilder = 'Divi'
    confidence = 'high'
  } else if (matchAny(lower, [/wpbakery/, /js_composer/])) {
    pageBuilder = 'WPBakery'
    confidence = 'medium'
  } else if (matchAny(lower, [/beaver-builder/, /fl-builder/])) {
    pageBuilder = 'Beaver Builder'
    confidence = 'medium'
  } else if (cms === 'Webflow') {
    pageBuilder = 'Webflow Designer'
  } else if (cms === 'Wix') {
    pageBuilder = 'Wix Editor'
  } else if (cms === 'Shopify') {
    pageBuilder = 'Shopify Theme'
  } else if (cms === 'Next.js' || cms === 'Framer') {
    pageBuilder = null
  }

  let hosting = 'Unknown hosting'

  if (headerLookup(headers, 'cf-ray') || server.includes('cloudflare')) {
    hosting = 'Cloudflare CDN'
    confidence = confidence === 'low' ? 'medium' : confidence
  } else if (headerLookup(headers, 'x-vercel-id') || server.includes('vercel')) {
    hosting = 'Vercel'
    confidence = 'high'
  } else if (via.includes('netlify') || server.includes('netlify')) {
    hosting = 'Netlify'
    confidence = 'high'
  } else if (lower.includes('wpengine') || server.includes('wpengine')) {
    hosting = 'WP Engine'
    confidence = 'high'
  } else if (server.includes('apache') || server.includes('nginx')) {
    hosting =
      cms === 'WordPress' && !headerLookup(headers, 'cf-ray')
        ? 'Shared hosting'
        : server.includes('nginx')
          ? 'Nginx server'
          : 'Apache server'
    confidence = confidence === 'low' ? 'medium' : confidence
  } else if (poweredBy.includes('asp.net')) {
    hosting = 'Microsoft IIS'
  } else if (cms === 'Shopify') {
    hosting = 'Shopify hosting'
    confidence = 'high'
  } else if (cms !== 'Unknown CMS') {
    hosting = 'Managed platform hosting'
    confidence = confidence === 'low' ? 'medium' : confidence
  }

  return { cms, pageBuilder, hosting, confidence }
}

/** Consultant-style paths tailored to detected stack and performance. */
export function buildRecommendedPaths(
  stack: TechStack,
  performance: number
): RecommendedPath[] {
  const isWordPress =
    stack.cms === 'WordPress' ||
    stack.pageBuilder === 'Elementor' ||
    stack.pageBuilder === 'Divi'
  const isPageBuilderHeavy =
    stack.pageBuilder === 'Elementor' ||
    stack.pageBuilder === 'Divi' ||
    stack.pageBuilder === 'WPBakery'
  const isModernPlatform =
    stack.cms === 'Next.js' || stack.cms === 'Webflow' || stack.cms === 'Framer'
  const isHostedCommerce = stack.cms === 'Shopify' || stack.cms === 'Wix'

  if (isModernPlatform && performance >= 70) {
    return [
      {
        role: 'best',
        roleLabel: 'Best option',
        title: 'Optimise what you have',
        description:
          'Fine-tune images, scripts, and caching — the stack is already modern; squeeze more speed and conversion.',
      },
      {
        role: 'alternative',
        roleLabel: 'Alternative',
        title: 'Expand with a design system',
        description: 'Add reusable components and clearer conversion paths without a full rebuild.',
      },
      {
        role: 'performance',
        roleLabel: 'Performance option',
        title: 'Edge hosting + analytics',
        description: 'Move static assets to a CDN edge and add conversion tracking for measurable ROI.',
      },
    ]
  }

  if (isWordPress || isPageBuilderHeavy) {
    if (performance < 45) {
      return [
        {
          role: 'best',
          roleLabel: 'Best option',
          title: 'Rebuild on Next.js',
          description:
            'Performance is critically low — a modern rebuild will outperform patching Elementor or heavy page builders.',
        },
        {
          role: 'alternative',
          roleLabel: 'Alternative',
          title: 'Move to Webflow',
          description:
            'Design-led marketing site with better speed out of the box — good for service businesses that need polish fast.',
        },
        {
          role: 'performance',
          roleLabel: 'Performance option',
          title: 'Optimise existing site (short-term)',
          description:
            'Hosting upgrade, image compression, and strip unused builder widgets — buys time before a rebuild.',
        },
      ]
    }

    if (performance < 65) {
      return [
        {
          role: 'best',
          roleLabel: 'Best option',
          title: 'Optimise existing site',
          description:
            'Upgrade hosting, add caching, compress images, and replace the heaviest page-builder sections.',
        },
        {
          role: 'alternative',
          roleLabel: 'Alternative',
          title: 'Move to Webflow',
          description:
            'Escape builder bloat — faster marketing site with easier client handoff and fewer plugin risks.',
        },
        {
          role: 'performance',
          roleLabel: 'Performance option',
          title: 'Move to Next.js',
          description:
            'Maximum speed and flexibility when the business is ready to invest in growth and custom features.',
        },
      ]
    }

    return [
      {
        role: 'best',
        roleLabel: 'Best option',
        title: 'Optimise existing site',
        description:
          'The stack is salvageable — tighten hosting, lazy-load images, and clean up builder CSS/JS.',
      },
      {
        role: 'alternative',
        roleLabel: 'Alternative',
        title: 'Modernise with Bricks or lighter theme',
        description: 'Stay on WordPress but drop Elementor weight for a faster, more maintainable theme.',
      },
      {
        role: 'performance',
        roleLabel: 'Performance option',
        title: 'Move to Next.js',
        description: 'When they outgrow WordPress — best for apps, portals, or high-traffic lead gen.',
      },
    ]
  }

  if (isHostedCommerce) {
    return [
      {
        role: 'best',
        roleLabel: 'Best option',
        title: 'Optimise theme and apps',
        description: 'Audit third-party apps, compress product images, and streamline checkout scripts.',
      },
      {
        role: 'alternative',
        roleLabel: 'Alternative',
        title: 'Rebuild storefront on Shopify 2.0',
        description: 'Modern theme architecture with better Core Web Vitals and merchandising flexibility.',
      },
      {
        role: 'performance',
        roleLabel: 'Performance option',
        title: 'Headless commerce (Next.js)',
        description: 'For brands outgrowing templates — custom UX with Shopify or Stripe as the backend.',
      },
    ]
  }

  if (performance < 50) {
    return [
      {
        role: 'best',
        roleLabel: 'Best option',
        title: 'Optimise or rebuild',
        description: 'Fix critical performance blockers first — if scores stay low, plan a platform migration.',
      },
      {
        role: 'alternative',
        roleLabel: 'Alternative',
        title: 'Move to Webflow',
        description: 'Balanced option for marketing sites that need speed without a full dev project.',
      },
      {
        role: 'performance',
        roleLabel: 'Performance option',
        title: 'Move to Next.js',
        description: 'Best long-term performance, SEO control, and custom conversion flows.',
      },
    ]
  }

  return [
    {
      role: 'best',
      roleLabel: 'Best option',
      title: 'Optimise existing site',
      description: 'Address Lighthouse issues, improve mobile UX, and strengthen SEO fundamentals.',
    },
    {
      role: 'alternative',
      roleLabel: 'Alternative',
      title: 'Move to Webflow',
      description: 'If the current platform is hard to maintain — faster iteration for marketing pages.',
    },
    {
      role: 'performance',
      roleLabel: 'Performance option',
      title: 'Move to Next.js',
      description: 'When the business needs maximum speed, integrations, and a scalable foundation.',
    },
  ]
}
