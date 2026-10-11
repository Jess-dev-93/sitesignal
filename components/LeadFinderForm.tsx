'use client'

import {
  useEffect,
  useState,
} from 'react'

export type WebsitePlatform =
  | 'any'
  | 'Webflow'
  | 'WordPress'
  | 'Shopify'
  | 'Wix'
  | 'Squarespace'
  | 'Custom / Unknown'

export type BusinessSize =
  | 'any'
  | 'small'
  | 'small-medium'
  | 'medium'
  | 'enterprise'

export type OpportunityType =
  | 'website-project'
  | 'ongoing-support'
  | 'webflow-help'
  | 'technical-rescue'
  | 'digital-product'

export type LeadPreferences = {
  /*
   * Existing fields are staying temporarily so the
   * current API continues working while we rebuild it.
   */
  preferLowReview: boolean
  preferOuterMetro: boolean
  excludePolishedSites: boolean
  prioritizeContactMobileIssues: boolean
  selectedPlatforms: WebsitePlatform[]
  targetBusinessSize: BusinessSize

  /*
   * New Client Finder preferences.
   */
  selectedOpportunityTypes: OpportunityType[]
  requirePhone: boolean
  excludePreviouslyReviewed: boolean
}

export const DEFAULT_LEAD_PREFERENCES: LeadPreferences = {
  /*
   * Website health is no longer the main filter.
   */
  preferLowReview: false,
  preferOuterMetro: false,
  excludePolishedSites: false,
  prioritizeContactMobileIssues: false,
  selectedPlatforms: ['any'],

  /*
   * Jess's preferred client profile.
   */
  targetBusinessSize:
    'small-medium',

  selectedOpportunityTypes: [
    'website-project',
    'ongoing-support',
    'webflow-help',
    'technical-rescue',
  ],

  requirePhone: true,
  excludePreviouslyReviewed: true,
}

const EXAMPLE_SEARCHES = [
  'Technology consultancies Sydney',
  'Data consultancies Sydney',
  'Engineering consultancies Sydney',
  'Training providers Sydney',
  'Recruitment agencies Sydney',
  'Business advisory firms Sydney',
]

const BUSINESS_SIZE_OPTIONS: Array<{
  value: BusinessSize
  label: string
  description: string
}> = [
  {
    value: 'small-medium',
    label: 'Small to mid-size',
    description:
      'Approximately 5–50 staff',
  },
  {
    value: 'small',
    label: 'Small business',
    description:
      'Approximately 1–10 staff',
  },
  {
    value: 'medium',
    label: 'Growing business',
    description:
      'Approximately 20–100 staff',
  },
  {
    value: 'any',
    label: 'Any size',
    description:
      'Do not limit by size',
  },
]

const OPPORTUNITY_OPTIONS: Array<{
  value: OpportunityType
  label: string
  description: string
}> = [
  {
    value: 'website-project',
    label: 'Website project',
    description:
      'New website, rebuild or major refresh',
  },
  {
    value: 'ongoing-support',
    label: 'Ongoing support',
    description:
      'Maintenance, SEO, analytics and improvements',
  },
  {
    value: 'webflow-help',
    label: 'Webflow help',
    description:
      'CMS, custom code and Webflow development',
  },
  {
    value: 'technical-rescue',
    label: 'Technical rescue',
    description:
      'Broken, unfinished or difficult website work',
  },
  {
    value: 'digital-product',
    label: 'Digital product',
    description:
      'Custom front-end or focused web application',
  },
]

interface Props {
  onSubmit: (
    query: string,
    preferences: LeadPreferences
  ) => void

  isLoading: boolean
  initialQuery?: string
  initialPreferences?:
    Partial<LeadPreferences>
}

function normalisePreferences(
  preferences?:
    Partial<LeadPreferences>
): LeadPreferences {
  return {
    ...DEFAULT_LEAD_PREFERENCES,
    ...preferences,

    selectedPlatforms:
      preferences
        ?.selectedPlatforms
        ?.length
        ? preferences.selectedPlatforms
        : [
            ...DEFAULT_LEAD_PREFERENCES
              .selectedPlatforms,
          ],

    selectedOpportunityTypes:
      preferences
        ?.selectedOpportunityTypes
        ?.length
        ? preferences
            .selectedOpportunityTypes
        : [
            ...DEFAULT_LEAD_PREFERENCES
              .selectedOpportunityTypes,
          ],
  }
}

export default function LeadFinderForm({
  onSubmit,
  isLoading,
  initialQuery = '',
  initialPreferences,
}: Props) {
  const [query, setQuery] =
    useState(initialQuery)

  const [
    preferences,
    setPreferences,
  ] = useState<LeadPreferences>(
    () =>
      normalisePreferences(
        initialPreferences
      )
  )

  useEffect(() => {
    setQuery(initialQuery)
  }, [initialQuery])

  useEffect(() => {
    setPreferences(
      normalisePreferences(
        initialPreferences
      )
    )
  }, [initialPreferences])

  const handleSubmit = () => {
    const cleanedQuery =
      query.trim()

    if (
      !cleanedQuery ||
      isLoading
    ) {
      return
    }

    onSubmit(
      cleanedQuery,
      preferences
    )
  }

  const toggleOpportunity = (
    opportunity:
      OpportunityType
  ) => {
    setPreferences(
      (previous) => {
        const selected =
          previous
            .selectedOpportunityTypes
            .includes(
              opportunity
            )

        const next =
          selected
            ? previous
                .selectedOpportunityTypes
                .filter(
                  (item) =>
                    item !==
                    opportunity
                )
            : [
                ...previous
                  .selectedOpportunityTypes,
                opportunity,
              ]

        return {
          ...previous,

          selectedOpportunityTypes:
            next.length
              ? next
              : [opportunity],
        }
      }
    )
  }

  return (
    <div className="space-y-7">
      {/* INTRODUCTION */}

      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-300">
          Client Finder
        </p>

        <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
          Find businesses worth
          contacting
        </h2>

        <p className="mt-2 max-w-2xl text-base leading-7 text-slate-400">
          Search for established
          businesses that match your
          services, budget and ideal
          client profile.
        </p>
      </div>

      {/* SEARCH */}

      <div>
        <label
          htmlFor="lead-search"
          className="mb-2 block text-base font-semibold text-white"
        >
          What type of client are
          you looking for?
        </label>

        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg"
            >
              🔎
            </span>

            <input
              id="lead-search"
              type="text"
              value={query}
              onChange={(event) =>
                setQuery(
                  event.target.value
                )
              }
              onKeyDown={(
                event
              ) => {
                if (
                  event.key ===
                  'Enter'
                ) {
                  handleSubmit()
                }
              }}
              placeholder="e.g. technology consultancies Sydney"
              disabled={isLoading}
              autoComplete="off"
              className="h-16 w-full rounded-2xl border border-white/[0.10] bg-white/[0.04] pl-12 pr-4 text-lg text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500/50 focus:bg-white/[0.06] focus:ring-4 focus:ring-blue-500/10 disabled:opacity-50"
            />
          </div>

          <button
            type="button"
            onClick={
              handleSubmit
            }
            disabled={
              isLoading ||
              !query.trim()
            }
            className="inline-flex h-16 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-8 text-base font-semibold text-white shadow-[0_12px_32px_rgba(37,99,235,0.22)] transition hover:-translate-y-0.5 hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
          >
            {isLoading
              ? 'Finding clients...'
              : 'Find Clients'}

            {!isLoading && (
              <span
                aria-hidden="true"
              >
                →
              </span>
            )}
          </button>
        </div>

        {/* EXAMPLES */}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-500">
            Try:
          </span>

          {EXAMPLE_SEARCHES.map(
            (search) => (
              <button
                key={search}
                type="button"
                onClick={() =>
                  setQuery(search)
                }
                disabled={
                  isLoading
                }
                className="rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 py-2 text-sm text-slate-400 transition hover:border-white/[0.14] hover:text-white disabled:opacity-40"
              >
                {search}
              </button>
            )
          )}
        </div>
      </div>

      {/* BUSINESS SIZE */}

      <div className="border-t border-white/[0.07] pt-6">
        <div className="mb-4">
          <p className="text-base font-semibold text-white">
            Ideal business size
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Choose businesses likely
            to suit your services and
            project size.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {BUSINESS_SIZE_OPTIONS.map(
            (option) => {
              const selected =
                preferences
                  .targetBusinessSize ===
                option.value

              return (
                <button
                  key={
                    option.value
                  }
                  type="button"
                  disabled={
                    isLoading
                  }
                  aria-pressed={
                    selected
                  }
                  onClick={() =>
                    setPreferences(
                      (
                        previous
                      ) => ({
                        ...previous,

                        targetBusinessSize:
                          option.value,
                      })
                    )
                  }
                  className={`rounded-2xl border p-4 text-left transition ${
                    selected
                      ? 'border-cyan-400/35 bg-cyan-500/[0.09] shadow-[0_8px_24px_rgba(34,211,238,0.07)]'
                      : 'border-white/[0.08] bg-white/[0.025] hover:border-white/[0.14] hover:bg-white/[0.04]'
                  } disabled:opacity-40`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={
                        selected
                          ? 'text-cyan-300'
                          : 'text-slate-600'
                      }
                    >
                      {selected
                        ? '✓'
                        : '○'}
                    </span>

                    <span
                      className={`text-base font-semibold ${
                        selected
                          ? 'text-cyan-100'
                          : 'text-slate-300'
                      }`}
                    >
                      {
                        option.label
                      }
                    </span>
                  </div>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {
                      option.description
                    }
                  </p>
                </button>
              )
            }
          )}
        </div>
      </div>

      {/* OPPORTUNITY TYPE */}

      <div className="border-t border-white/[0.07] pt-6">
        <div className="mb-4">
          <p className="text-base font-semibold text-white">
            Work you want to find
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Client Finder will use
            these when ranking
            businesses.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {OPPORTUNITY_OPTIONS.map(
            (option) => {
              const selected =
                preferences
                  .selectedOpportunityTypes
                  .includes(
                    option.value
                  )

              return (
                <button
                  key={
                    option.value
                  }
                  type="button"
                  disabled={
                    isLoading
                  }
                  aria-pressed={
                    selected
                  }
                  onClick={() =>
                    toggleOpportunity(
                      option.value
                    )
                  }
                  className={`rounded-2xl border p-4 text-left transition ${
                    selected
                      ? 'border-blue-400/30 bg-blue-500/[0.09]'
                      : 'border-white/[0.08] bg-white/[0.025] hover:border-white/[0.14] hover:bg-white/[0.04]'
                  } disabled:opacity-40`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={
                        selected
                          ? 'text-blue-300'
                          : 'text-slate-600'
                      }
                    >
                      {selected
                        ? '✓'
                        : '+'}
                    </span>

                    <span
                      className={`text-base font-semibold ${
                        selected
                          ? 'text-blue-100'
                          : 'text-slate-300'
                      }`}
                    >
                      {
                        option.label
                      }
                    </span>
                  </div>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {
                      option.description
                    }
                  </p>
                </button>
              )
            }
          )}
        </div>
      </div>

      {/* SEARCH REQUIREMENTS */}

      <div className="border-t border-white/[0.07] pt-6">
        <div className="mb-4">
          <p className="text-base font-semibold text-white">
            Search requirements
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Keep the shortlist
            practical and ready for
            outreach.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <button
            type="button"
            disabled={isLoading}
            aria-pressed={
              preferences.requirePhone
            }
            onClick={() =>
              setPreferences(
                (previous) => ({
                  ...previous,

                  requirePhone:
                    !previous
                      .requirePhone,
                })
              )
            }
            className={`rounded-2xl border p-4 text-left transition ${
              preferences.requirePhone
                ? 'border-emerald-400/30 bg-emerald-500/[0.08]'
                : 'border-white/[0.08] bg-white/[0.025]'
            } disabled:opacity-40`}
          >
            <p className="text-base font-semibold text-white">
              {preferences.requirePhone
                ? '✓ '
                : '+ '}
              Public phone required
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Only return businesses
              you can genuinely call.
            </p>
          </button>

          <button
            type="button"
            disabled={isLoading}
            aria-pressed={
              preferences
                .excludePreviouslyReviewed
            }
            onClick={() =>
              setPreferences(
                (previous) => ({
                  ...previous,

                  excludePreviouslyReviewed:
                    !previous
                      .excludePreviouslyReviewed,
                })
              )
            }
            className={`rounded-2xl border p-4 text-left transition ${
              preferences
                .excludePreviouslyReviewed
                ? 'border-emerald-400/30 bg-emerald-500/[0.08]'
                : 'border-white/[0.08] bg-white/[0.025]'
            } disabled:opacity-40`}
          >
            <p className="text-base font-semibold text-white">
              {preferences
                .excludePreviouslyReviewed
                ? '✓ '
                : '+ '}
              Only fresh prospects
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Hide businesses already
              reviewed or contacted.
            </p>
          </button>

          <button
            type="button"
            disabled={isLoading}
            aria-pressed={
              preferences
                .preferOuterMetro
            }
            onClick={() =>
              setPreferences(
                (previous) => ({
                  ...previous,

                  preferOuterMetro:
                    !previous
                      .preferOuterMetro,
                })
              )
            }
            className={`rounded-2xl border p-4 text-left transition ${
              preferences
                .preferOuterMetro
                ? 'border-violet-400/30 bg-violet-500/[0.08]'
                : 'border-white/[0.08] bg-white/[0.025]'
            } disabled:opacity-40`}
          >
            <p className="text-base font-semibold text-white">
              {preferences
                .preferOuterMetro
                ? '✓ '
                : '+ '}
              Expand the location
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Include outer-metro
              areas around the chosen
              city.
            </p>
          </button>
        </div>
      </div>
    </div>
  )
}