export type UserProfile = {
  name: string
  title: string
  company: string
  location: string
  specialty: string
}

export const DEFAULT_PROFILE: UserProfile = {
  name: '',
  title: '',
  company: '',
  location: '',
  specialty: '',
}

const STORAGE_KEY = 'siteSignalUserProfile'

export function getStoredProfile(): UserProfile {
  if (typeof window === 'undefined') return DEFAULT_PROFILE

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_PROFILE

    const parsed = JSON.parse(raw)

    return {
      name: parsed?.name || '',
      title: parsed?.title || '',
      company: parsed?.company || '',
      location: parsed?.location || '',
      specialty: parsed?.specialty || '',
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
  return Boolean(profile.name && profile.company)
}
