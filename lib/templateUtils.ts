import type {
  UserProfile,
} from './profileStorage'

export function getProfileFallbacks(
  profile?:
    Partial<UserProfile>
) {
  return {
    yourName:
      profile?.yourName ||
      'Your Name',

    yourTitle:
      profile?.yourTitle ||
      'Web Developer',

    yourCompany:
      profile?.yourCompany ||
      'Your Company',

    yourLocation:
      profile?.yourLocation ||
      'Sydney',

    yourSpecialty:
      profile?.yourSpecialty ||
      'Web Developer',

    yourWebsite:
      profile?.yourWebsite ||
      'https://jmsites.dev',

    yourLinkedIn:
      profile?.yourLinkedIn ||
      '',
  }
}

export function applyProfilePlaceholders(
  input: string,
  profile?:
    Partial<UserProfile>
): string {
  if (!input) {
    return input
  }

  const values =
    getProfileFallbacks(
      profile
    )

  return input
    .replace(
      /\{Your Name\}/gi,
      values.yourName
    )
    .replace(
      /\{Your Title\}/gi,
      values.yourTitle
    )
    .replace(
      /\{Your Company\}/gi,
      values.yourCompany
    )
    .replace(
      /\{Your Location\}/gi,
      values.yourLocation
    )
    .replace(
      /\{Your Specialty\}/gi,
      values.yourSpecialty
    )
    .replace(
      /\{Your Website\}/gi,
      values.yourWebsite
    )
    .replace(
      /\{Your LinkedIn\}/gi,
      values.yourLinkedIn
    )
    .replace(
      /\$\$Your Name\$\$/gi,
      values.yourName
    )
    .replace(
      /\$\$Your Title\$\$/gi,
      values.yourTitle
    )
    .replace(
      /\$\$Your Company\$\$/gi,
      values.yourCompany
    )
    .replace(
      /\$\$Your Location\$\$/gi,
      values.yourLocation
    )
    .replace(
      /\$\$Your Specialty\$\$/gi,
      values.yourSpecialty
    )
    .replace(
      /\$\$Your Website\$\$/gi,
      values.yourWebsite
    )
    .replace(
      /\$\$Your LinkedIn\$\$/gi,
      values.yourLinkedIn
    )
}

export function applyProfilePlaceholdersDeep<T>(
  value: T,
  profile?:
    Partial<UserProfile>
): T {
  if (
    typeof value ===
    'string'
  ) {
    return applyProfilePlaceholders(
      value,
      profile
    ) as T
  }

  if (
    Array.isArray(
      value
    )
  ) {
    return value.map(
      (item) =>
        applyProfilePlaceholdersDeep(
          item,
          profile
        )
    ) as T
  }

  if (
    value &&
    typeof value ===
      'object'
  ) {
    const next:
      Record<
        string,
        unknown
      > = {}

    Object.entries(
      value as Record<
        string,
        unknown
      >
    ).forEach(
      ([
        key,
        item,
      ]) => {
        next[key] =
          applyProfilePlaceholdersDeep(
            item,
            profile
          )
      }
    )

    return next as T
  }

  return value
}