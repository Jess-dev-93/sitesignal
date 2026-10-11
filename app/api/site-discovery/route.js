import {
  NextResponse,
} from 'next/server'

import {
  runFullSiteAudit,
} from '../../../lib/siteAuditService'

import {
  getUserIdFromRequest,
} from '../../../lib/getUserId'

import {
  getUserPlan,
  incrementUsage,
} from '../../../lib/getUserPlan'

import {
  normaliseAuditUrl,
} from '../../../lib/normaliseAuditUrl'

export const runtime =
  'nodejs'

/*
 * Full-site audits perform several
 * controlled website and Lighthouse
 * requests, so they need a longer
 * server execution allowance.
 */
export const maxDuration =
  300

export async function POST(
  request
) {
  try {
    const body =
      await request.json()

    const {
      url,
    } = body

    if (
      !url ||
      typeof url !==
        'string'
    ) {
      return NextResponse.json(
        {
          error:
            'Please provide a URL',
        },
        {
          status: 400,
        }
      )
    }

    const cleanUrl =
      normaliseAuditUrl(
        url
      )

    if (!cleanUrl) {
      return NextResponse.json(
        {
          error:
            'That does not look like a valid URL. Try: example.com.au',
        },
        {
          status: 400,
        }
      )
    }

    const userId =
      getUserIdFromRequest(
        request
      )

    if (userId) {
      const planData =
        await getUserPlan(
          userId
        )

      if (
        planData
          .auditLimitReached
      ) {
        return NextResponse.json(
          {
            error:
              `You have used all ${planData.auditLimit} free audits this month. ` +
              'Upgrade to Pro for unlimited audits.',

            limitReached:
              true,

            limitType:
              'audit',

            used:
              planData.auditCount,

            limit:
              planData.auditLimit,

            plan:
              planData.plan,
          },
          {
            status: 403,
          }
        )
      }
    }

    const result =
      await runFullSiteAudit(
        cleanUrl,
        {
          maxPages:
            20,

          maxDeepPages:
            5,
        }
      )

    if (
      !result.success
    ) {
      return NextResponse.json(
        {
          error:
            result.error ||
            'Site audit failed',
        },
        {
          status: 502,
        }
      )
    }

    /*
     * A complete full-site review
     * counts as one audit.
     */
    if (userId) {
      await incrementUsage(
        userId,
        'audit'
      )
    }

    return NextResponse.json(
      result
    )
  } catch (error) {
    console.error(
      'Full-site audit error:',
      error
    )

    return NextResponse.json(
      {
        error:
          error?.message ||
          'Site audit failed',
      },
      {
        status: 500,
      }
    )
  }
}