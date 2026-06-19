export type UserProfile = {
  yourName: string
  yourTitle: string
  yourCompany: string
  yourLocation: string
  yourSpecialty: string
}

export const DEFAULT_PROFILE: UserProfile = {
  yourName: '',
  yourTitle: '',
  yourCompany: '',
  yourLocation: '',
  yourSpecialty: '',
}

// NOTE: Still using old "clientFinder" keys until rebrand pass.
const STORAGE_KEY = 'clientFinderProfile'

export function getStoredProfile(): UserProfile {
  if (typeof window === 'undefined') return DEFAULT_PROFILE

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_PROFILE

    const parsed = JSON.parse(raw)

    return {
      yourName: parsed?.yourName || '',
      yourTitle: parsed?.yourTitle || '',
      yourCompany: parsed?.yourCompany || '',
      yourLocation: parsed?.yourLocation || '',
      yourSpecialty: parsed?.yourSpecialty || '',
    }
  } catch {
    return DEFAULT_PROFILE
  }
}

export function saveStoredProfile(profile: UserProfile) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
}

export function hasCompletedProfile(profile: UserProfile) {
  return Boolean(profile.yourName && profile.yourCompany)
}
