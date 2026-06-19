import { UserProfile } from './profileStorage'

export function getProfileFallbacks(profile?: Partial<UserProfile>) {
  return {
    yourName:      profile?.yourName      || 'Your Name',
    yourTitle:     profile?.yourTitle     || 'Web Developer',
    yourCompany:   profile?.yourCompany   || 'Your Company',
    yourLocation:  profile?.yourLocation  || 'Sydney',
    yourSpecialty: profile?.yourSpecialty || 'Web Developer',
  }
}

export function applyProfilePlaceholders(
  input: string,
  profile?: Partial<UserProfile>
): string {
  if (!input) return input

  const v = getProfileFallbacks(profile)

  return input
    .replace(/$$Your Name$$/gi,      v.yourName)
    .replace(/$$Your Title$$/gi,     v.yourTitle)
    .replace(/$$Your Company$$/gi,   v.yourCompany)
    .replace(/$$Your Location$$/gi,  v.yourLocation)
    .replace(/$$Your Specialty$$/gi, v.yourSpecialty)
    .replace(/\{Your Name\}/gi,      v.yourName)
    .replace(/\{Your Title\}/gi,     v.yourTitle)
    .replace(/\{Your Company\}/gi,   v.yourCompany)
    .replace(/\{Your Location\}/gi,  v.yourLocation)
    .replace(/\{Your Specialty\}/gi, v.yourSpecialty)
    .replace(/\$\$Your Name\$\$/gi,      v.yourName)
    .replace(/\$\$Your Title\$\$/gi,     v.yourTitle)
    .replace(/\$\$Your Company\$\$/gi,   v.yourCompany)
    .replace(/\$\$Your Location\$\$/gi,  v.yourLocation)
    .replace(/\$\$Your Specialty\$\$/gi, v.yourSpecialty)
}

export function applyProfilePlaceholdersDeep<T>(
  value: T,
  profile?: Partial<UserProfile>
): T {
  if (typeof value === 'string') {
    return applyProfilePlaceholders(value, profile) as T
  }

  if (Array.isArray(value)) {
    return value.map((item) => applyProfilePlaceholdersDeep(item, profile)) as T
  }

  if (value && typeof value === 'object') {
    const next: Record<string, any> = {}
    Object.entries(value as Record<string, any>).forEach(([key, val]) => {
      next[key] = applyProfilePlaceholdersDeep(val, profile)
    })
    return next as T
  }

  return value
}