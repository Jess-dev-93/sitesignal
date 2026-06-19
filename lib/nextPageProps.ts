'use client'

import { use } from 'react'

export type NextPageProps = {
  params?: Promise<Record<string, string | string[]>>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export function useUnwrapNextPageProps({
  params,
  searchParams,
}: NextPageProps = {}) {
  if (params) use(params)
  if (searchParams) use(searchParams)
}
