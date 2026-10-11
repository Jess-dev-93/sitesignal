export type TechStackConfidence = 'high' | 'medium' | 'low'

export type TechSignalCategory =
  | 'analytics'
  | 'tag-manager'
  | 'marketing'
  | 'forms'
  | 'consent'
  | 'integration'

export type TechSignal = {
  category: TechSignalCategory
  name: string
  confidence: TechStackConfidence
  evidence: string
}

export type TechStack = {
  cms: string
  pageBuilder: string | null
  hosting: string
  confidence: TechStackConfidence
  analytics: string[]
  tagManagers: string[]
  marketing: string[]
  forms: string[]
  consent: string[]
  integrations: string[]
  signals: TechSignal[]
}

export type RecommendedPath = {
  role: 'best' | 'alternative' | 'performance'
  roleLabel: string
  title: string
  description: string
}

type SignalDefinition = {
  category: TechSignalCategory
  name: string
  confidence: TechStackConfidence
  evidence: string
  patterns: RegExp[]
}

const SIGNAL_DEFINITIONS: SignalDefinition[] = [
  {
    category: 'tag-manager',
    name: 'Google Tag Manager',
    confidence: 'high',
    evidence:
      'A Google Tag Manager container reference was found in the public HTML.',
    patterns: [
      /googletagmanager\.com\/gtm\.js/i,
      /gtm-[a-z0-9]+/i,
    ],
  },
  {
    category: 'analytics',
    name: 'Google Analytics',
    confidence: 'high',
    evidence:
      'A Google Analytics or Google tag reference was found in the public HTML.',
    patterns: [
      /google-analytics\.com\/(?:analytics|g)\.js/i,
      /googletagmanager\.com\/gtag\/js/i,
      /gtag\s*\(\s*["']config["']/i,
      /\bg-[a-z0-9]{10}\b/i,
      /\bua-\d{4,}-\d+\b/i,
    ],
  },
  {
    category: 'analytics',
    name: 'Microsoft Clarity',
    confidence: 'high',
    evidence:
      'A Microsoft Clarity tracking reference was found in the public HTML.',
    patterns: [
      /clarity\.ms\/tag\//i,
      /\bclarity\s*\(/i,
    ],
  },
  {
    category: 'analytics',
    name: 'Hotjar',
    confidence: 'high',
    evidence:
      'A Hotjar tracking reference was found in the public HTML.',
    patterns: [
      /static\.hotjar\.com/i,
      /hotjar-\d+\.js/i,
      /\bhj\s*\(/i,
    ],
  },
  {
    category: 'analytics',
    name: 'Matomo',
    confidence: 'medium',
    evidence:
      'A Matomo tracking pattern was found in the public HTML.',
    patterns: [
      /matomo\.js/i,
      /piwik\.js/i,
      /\b_paq\b/i,
    ],
  },
  {
    category: 'marketing',
    name: 'Meta Pixel',
    confidence: 'high',
    evidence:
      'A Meta Pixel tracking reference was found in the public HTML.',
    patterns: [
      /connect\.facebook\.net\/.+\/fbevents\.js/i,
      /\bfbq\s*\(/i,
    ],
  },
  {
    category: 'marketing',
    name: 'LinkedIn Insight Tag',
    confidence: 'high',
    evidence:
      'A LinkedIn Insight Tag reference was found in the public HTML.',
    patterns: [
      /snap\.licdn\.com\/li\.lms-analytics/i,
      /_linkedin_partner_id/i,
    ],
  },
  {
    category: 'marketing',
    name: 'HubSpot',
    confidence: 'high',
    evidence:
      'A HubSpot script, form or tracking reference was found in the public HTML.',
    patterns: [
      /js\.hs-scripts\.com/i,
      /js\.hsforms\.net/i,
      /forms\.hsforms\.com/i,
      /hbspt\.forms/i,
      /hubspotutk/i,
    ],
  },
  {
    category: 'marketing',
    name: 'Mailchimp',
    confidence: 'high',
    evidence:
      'A Mailchimp form or script reference was found in the public HTML.',
    patterns: [
      /list-manage\.com/i,
      /chimpstatic\.com/i,
      /mc-validate\.js/i,
    ],
  },
  {
    category: 'marketing',
    name: 'ActiveCampaign',
    confidence: 'high',
    evidence:
      'An ActiveCampaign form or tracking reference was found in the public HTML.',
    patterns: [
      /trackcmp\.net/i,
      /activehosted\.com/i,
      /activecampaign/i,
    ],
  },
  {
    category: 'marketing',
    name: 'Klaviyo',
    confidence: 'high',
    evidence:
      'A Klaviyo script or form reference was found in the public HTML.',
    patterns: [
      /static\.klaviyo\.com/i,
      /klaviyo\.com/i,
      /\b_klon\b/i,
    ],
  },
  {
    category: 'forms',
    name: 'HubSpot Forms',
    confidence: 'high',
    evidence:
      'A HubSpot form embed reference was found in the public HTML.',
    patterns: [
      /js\.hsforms\.net/i,
      /forms\.hsforms\.com/i,
      /hbspt\.forms/i,
    ],
  },
  {
    category: 'forms',
    name: 'Gravity Forms',
    confidence: 'high',
    evidence:
      'Gravity Forms markup or assets were found in the public HTML.',
    patterns: [
      /gravityforms/i,
      /gform_wrapper/i,
      /gform_fields/i,
    ],
  },
  {
    category: 'forms',
    name: 'Contact Form 7',
    confidence: 'high',
    evidence:
      'Contact Form 7 markup or assets were found in the public HTML.',
    patterns: [
      /contact-form-7/i,
      /\bwpcf7\b/i,
    ],
  },
  {
    category: 'forms',
    name: 'Typeform',
    confidence: 'high',
    evidence:
      'A Typeform embed reference was found in the public HTML.',
    patterns: [
      /embed\.typeform\.com/i,
      /typeform\.com\/to\//i,
    ],
  },
  {
    category: 'forms',
    name: 'Jotform',
    confidence: 'high',
    evidence:
      'A Jotform embed reference was found in the public HTML.',
    patterns: [
      /form\.jotform\.com/i,
      /jotform\.com/i,
    ],
  },
  {
    category: 'consent',
    name: 'OneTrust',
    confidence: 'high',
    evidence:
      'A OneTrust or CookiePro consent reference was found in the public HTML.',
    patterns: [
      /cdn\.cookielaw\.org/i,
      /cookiepro\.com/i,
      /onetrust/i,
    ],
  },
  {
    category: 'consent',
    name: 'Cookiebot',
    confidence: 'high',
    evidence:
      'A Cookiebot consent reference was found in the public HTML.',
    patterns: [
      /consent\.cookiebot\.com/i,
      /cookiebot/i,
    ],
  },
  {
    category: 'consent',
    name: 'CookieYes',
    confidence: 'high',
    evidence:
      'A CookieYes consent reference was found in the public HTML.',
    patterns: [
      /cdn-cookieyes\.com/i,
      /cookieyes/i,
    ],
  },
  {
    category: 'consent',
    name: 'Complianz',
    confidence: 'high',
    evidence:
      'Complianz consent markup or assets were found in the public HTML.',
    patterns: [
      /complianz/i,
      /cmplz_/i,
    ],
  },
  {
    category: 'consent',
    name: 'iubenda',
    confidence: 'high',
    evidence:
      'An iubenda consent reference was found in the public HTML.',
    patterns: [
      /cdn\.iubenda\.com/i,
      /iubenda/i,
    ],
  },
  {
    category: 'integration',
    name: 'Google reCAPTCHA',
    confidence: 'high',
    evidence:
      'A Google reCAPTCHA script or site-key reference was found in the public HTML.',
    patterns: [
      /google\.com\/recaptcha/i,
      /gstatic\.com\/recaptcha/i,
      /g-recaptcha/i,
    ],
  },
  {
    category: 'integration',
    name: 'Google Maps',
    confidence: 'high',
    evidence:
      'A Google Maps script or embed reference was found in the public HTML.',
    patterns: [
      /maps\.googleapis\.com/i,
      /google\.com\/maps\/embed/i,
    ],
  },
  {
    category: 'integration',
    name: 'Eventbrite',
    confidence: 'high',
    evidence:
      'An Eventbrite link, widget or script reference was found in the public HTML.',
    patterns: [
      /eventbrite\.(?:com|com\.au)/i,
      /eventbrite-widget/i,
    ],
  },
  {
    category: 'integration',
    name: 'Calendly',
    confidence: 'high',
    evidence:
      'A Calendly scheduling reference was found in the public HTML.',
    patterns: [
      /assets\.calendly\.com/i,
      /calendly\.com/i,
    ],
  },
  {
    category: 'integration',
    name: 'Stripe',
    confidence: 'high',
    evidence:
      'A Stripe client-side integration reference was found in the public HTML.',
    patterns: [
      /js\.stripe\.com/i,
      /checkout\.stripe\.com/i,
    ],
  },
]

function headerLookup(
  headers: Record<string, string>,
  name: string
): string {
  const key = Object.keys(headers).find(
    (item) =>
      item.toLowerCase() ===
      name.toLowerCase()
  )

  return key ? headers[key] : ''
}

function matchAny(
  value: string,
  patterns: RegExp[]
): boolean {
  return patterns.some(
    (pattern) =>
      pattern.test(value)
  )
}

function unique(
  values: string[]
): string[] {
  return Array.from(
    new Set(values)
  )
}

function signalsForCategory(
  signals: TechSignal[],
  category: TechSignalCategory
): string[] {
  return unique(
    signals
      .filter(
        (signal) =>
          signal.category ===
          category
      )
      .map(
        (signal) =>
          signal.name
      )
  )
}

/**
 * Detect publicly exposed technology signals from HTML
 * and response headers.
 *
 * A detected script proves that a public implementation
 * signal exists. It does not prove that the tool is
 * configured correctly or collecting useful data.
 */
export function detectTechStack(
  html: string,
  headers: Record<string, string> = {}
): TechStack {
  const lower =
    html.toLowerCase()

  const server =
    headerLookup(
      headers,
      'server'
    ).toLowerCase()

  const poweredBy =
    headerLookup(
      headers,
      'x-powered-by'
    ).toLowerCase()

  const via =
    headerLookup(
      headers,
      'via'
    ).toLowerCase()

  let cms =
    'Unknown CMS'

  let pageBuilder:
    string | null =
    null

  let confidence:
    TechStackConfidence =
    'low'

  if (
    matchAny(
      lower,
      [
        /wp-content\//,
        /wp-includes\//,
        /<meta[^>]+name=["']generator["'][^>]+wordpress/i,
      ]
    )
  ) {
    cms =
      'WordPress'

    confidence =
      'high'
  } else if (
    matchAny(
      lower,
      [
        /cdn\.shopify\.com/,
        /shopify\.theme/,
        /x-shopify-stage/i,
      ]
    )
  ) {
    cms =
      'Shopify'

    confidence =
      'high'
  } else if (
    matchAny(
      lower,
      [
        /webflow\.com/,
        /data-wf-page/,
        /data-wf-site/,
      ]
    )
  ) {
    cms =
      'Webflow'

    confidence =
      'high'
  } else if (
    matchAny(
      lower,
      [
        /wixstatic\.com/,
        /static\.wix\.com/,
        /wix\.com/,
      ]
    )
  ) {
    cms =
      'Wix'

    confidence =
      'high'
  } else if (
    matchAny(
      lower,
      [
        /squarespace\.com/,
        /static1\.squarespace/,
      ]
    )
  ) {
    cms =
      'Squarespace'

    confidence =
      'high'
  } else if (
    matchAny(
      lower,
      [
        /__next_data__/,
        /_next\/static/,
      ]
    )
  ) {
    cms =
      'Next.js'

    confidence =
      'high'
  } else if (
    matchAny(
      lower,
      [
        /framerusercontent\.com/,
        /data-framer/,
      ]
    )
  ) {
    cms =
      'Framer'

    confidence =
      'high'
  } else if (
    matchAny(
      lower,
      [
        /joomla/i,
        /\/components\/com_/,
      ]
    )
  ) {
    cms =
      'Joomla'

    confidence =
      'medium'
  } else if (
    matchAny(
      lower,
      [
        /drupal\.settings/,
        /drupal\.js/,
      ]
    )
  ) {
    cms =
      'Drupal'

    confidence =
      'medium'
  } else if (
    matchAny(
      lower,
      [
        /hs-sites\.com/i,
        /hubspotpagebuilder/i,
      ]
    )
  ) {
    cms =
      'HubSpot CMS'

    confidence =
      'medium'
  } else if (
    html.length > 500
  ) {
    cms =
      'Custom / unknown'
  }

  if (
    matchAny(
      lower,
      [
        /elementor/,
        /data-elementor/,
      ]
    )
  ) {
    pageBuilder =
      'Elementor'

    confidence =
      'high'
  } else if (
    matchAny(
      lower,
      [
        /et_pb_/,
        /divi-/i,
        /elegantthemes/,
      ]
    )
  ) {
    pageBuilder =
      'Divi'

    confidence =
      'high'
  } else if (
    matchAny(
      lower,
      [
        /wpbakery/,
        /js_composer/,
      ]
    )
  ) {
    pageBuilder =
      'WPBakery'

    confidence =
      'medium'
  } else if (
    matchAny(
      lower,
      [
        /beaver-builder/,
        /fl-builder/,
      ]
    )
  ) {
    pageBuilder =
      'Beaver Builder'

    confidence =
      'medium'
  } else if (
    cms ===
    'Webflow'
  ) {
    pageBuilder =
      'Webflow Designer'
  } else if (
    cms ===
    'Wix'
  ) {
    pageBuilder =
      'Wix Editor'
  } else if (
    cms ===
    'Shopify'
  ) {
    pageBuilder =
      'Shopify Theme'
  }

  let hosting =
    'Unknown hosting'

  if (
    headerLookup(
      headers,
      'cf-ray'
    ) ||
    server.includes(
      'cloudflare'
    )
  ) {
    hosting =
      'Origin obscured by Cloudflare CDN'

    confidence =
      confidence === 'low'
        ? 'medium'
        : confidence
  } else if (
    headerLookup(
      headers,
      'x-vercel-id'
    ) ||
    server.includes(
      'vercel'
    )
  ) {
    hosting =
      'Vercel'

    confidence =
      'high'
  } else if (
    via.includes(
      'netlify'
    ) ||
    server.includes(
      'netlify'
    )
  ) {
    hosting =
      'Netlify'

    confidence =
      'high'
  } else if (
    lower.includes(
      'wpengine'
    ) ||
    server.includes(
      'wpengine'
    )
  ) {
    hosting =
      'WP Engine'

    confidence =
      'high'
  } else if (
    server.includes(
      'nginx'
    )
  ) {
    hosting =
      'Nginx server (provider not identified)'

    confidence =
      confidence === 'low'
        ? 'medium'
        : confidence
  } else if (
    server.includes(
      'apache'
    )
  ) {
    hosting =
      'Apache server (provider not identified)'

    confidence =
      confidence === 'low'
        ? 'medium'
        : confidence
  } else if (
    poweredBy.includes(
      'asp.net'
    ) ||
    server.includes(
      'iis'
    )
  ) {
    hosting =
      'Microsoft IIS (provider not identified)'

    confidence =
      confidence === 'low'
        ? 'medium'
        : confidence
  } else if (
    cms ===
    'Shopify'
  ) {
    hosting =
      'Shopify hosting'

    confidence =
      'high'
  } else if (
    [
      'Webflow',
      'Wix',
      'Squarespace',
    ].includes(cms)
  ) {
    hosting =
      `${cms} managed hosting`

    confidence =
      'high'
  }

  const signals =
    SIGNAL_DEFINITIONS
      .filter(
        (definition) =>
          matchAny(
            html,
            definition.patterns
          )
      )
      .map(
        ({
          category,
          name,
          confidence:
            signalConfidence,
          evidence,
        }) => ({
          category,
          name,
          confidence:
            signalConfidence,
          evidence,
        })
      )

  return {
    cms,
    pageBuilder,
    hosting,
    confidence,

    analytics:
      signalsForCategory(
        signals,
        'analytics'
      ),

    tagManagers:
      signalsForCategory(
        signals,
        'tag-manager'
      ),

    marketing:
      signalsForCategory(
        signals,
        'marketing'
      ),

    forms:
      signalsForCategory(
        signals,
        'forms'
      ),

    consent:
      signalsForCategory(
        signals,
        'consent'
      ),

    integrations:
      signalsForCategory(
        signals,
        'integration'
      ),

    signals,
  }
}

/**
 * Provide investigation paths rather than automatic
 * migration prescriptions.
 *
 * A public scan cannot prove that a rebuild or platform
 * migration is the correct decision.
 */
export function buildRecommendedPaths(
  stack: TechStack,
  performance: number
): RecommendedPath[] {
  const performanceNeedsInvestigation =
    performance < 50

  const pageBuilderHeavy =
    [
      'Elementor',
      'Divi',
      'WPBakery',
    ].includes(
      stack.pageBuilder ||
        ''
    )

  return [
    {
      role:
        'best',

      roleLabel:
        'Start here',

      title:
        'Validate and optimise the current site',

      description:
        performanceNeedsInvestigation
          ? 'Trace the measured rendering, JavaScript and third-party costs on representative pages before choosing remediation work.'
          : 'Confirm recurring findings across representative templates, then prioritise the improvements with the clearest user and business value.',
    },
    {
      role:
        'alternative',

      roleLabel:
        'Maintainability review',

      title:
        pageBuilderHeavy
          ? 'Review theme and plugin overhead'
          : 'Review the delivery workflow',

      description:
        pageBuilderHeavy
          ? `Assess which ${stack.pageBuilder} components, plugins and integrations are required, duplicated or safe to defer.`
          : 'Review content management, integrations, deployment and ownership to identify operational friction that a public scan cannot measure.',
    },
    {
      role:
        'performance',

      roleLabel:
        'Strategic option',

      title:
        'Assess platform fit only if needed',

      description:
        'Consider a rebuild or migration only when discovery confirms that the current platform cannot meet performance, maintainability or growth requirements cost-effectively.',
    },
  ]
}