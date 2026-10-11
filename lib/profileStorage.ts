export type UserProfile = {
  yourName: string
  yourTitle: string
  yourCompany: string
  yourLocation: string
  yourSpecialty: string
  yourWebsite?: string
  yourLinkedIn?: string
}

export const DEFAULT_PROFILE:
  UserProfile = {
    yourName:
      'Jessica Manning',

    yourTitle:
      'Founder | Web Developer & Digital Solutions Specialist',

    yourCompany:
      'JM Sites',

    yourLocation:
      'Sydney, Australia',

    yourSpecialty:
      'Webflow, CMS Architecture & Front-End Development',

    yourWebsite:
      'https://jmsites.dev',

    yourLinkedIn:
      'https://www.linkedin.com/in/jess-manning-dev/',
  }

/*
 * Keep the original storage key so existing
 * saved profile information is not lost.
 */
const STORAGE_KEY =
  'clientFinderProfile'

export function getStoredProfile():
  UserProfile {
  if (
    typeof window ===
    'undefined'
  ) {
    return DEFAULT_PROFILE
  }

  try {
    const raw =
      localStorage.getItem(
        STORAGE_KEY
      )

    if (!raw) {
      return DEFAULT_PROFILE
    }

    const parsed =
      JSON.parse(raw)

    return {
      yourName:
        parsed?.yourName
          ?.trim() ||
        DEFAULT_PROFILE
          .yourName,

      yourTitle:
        parsed?.yourTitle
          ?.trim() ||
        DEFAULT_PROFILE
          .yourTitle,

      yourCompany:
        parsed?.yourCompany
          ?.trim() ||
        DEFAULT_PROFILE
          .yourCompany,

      yourLocation:
        parsed?.yourLocation
          ?.trim() ||
        DEFAULT_PROFILE
          .yourLocation,

      yourSpecialty:
        parsed?.yourSpecialty
          ?.trim() ||
        DEFAULT_PROFILE
          .yourSpecialty,

      yourWebsite:
        parsed?.yourWebsite
          ?.trim() ||
        DEFAULT_PROFILE
          .yourWebsite,

      yourLinkedIn:
        parsed?.yourLinkedIn
          ?.trim() ||
        DEFAULT_PROFILE
          .yourLinkedIn,
    }
  } catch {
    return DEFAULT_PROFILE
  }
}

export function saveStoredProfile(
  profile: UserProfile
) {
  if (
    typeof window ===
    'undefined'
  ) {
    return
  }

  const completeProfile:
    UserProfile = {
      yourName:
        profile?.yourName
          ?.trim() ||
        DEFAULT_PROFILE
          .yourName,

      yourTitle:
        profile?.yourTitle
          ?.trim() ||
        DEFAULT_PROFILE
          .yourTitle,

      yourCompany:
        profile?.yourCompany
          ?.trim() ||
        DEFAULT_PROFILE
          .yourCompany,

      yourLocation:
        profile?.yourLocation
          ?.trim() ||
        DEFAULT_PROFILE
          .yourLocation,

      yourSpecialty:
        profile?.yourSpecialty
          ?.trim() ||
        DEFAULT_PROFILE
          .yourSpecialty,

      yourWebsite:
        profile?.yourWebsite
          ?.trim() ||
        DEFAULT_PROFILE
          .yourWebsite,

      yourLinkedIn:
        profile?.yourLinkedIn
          ?.trim() ||
        DEFAULT_PROFILE
          .yourLinkedIn,
    }

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(
      completeProfile
    )
  )
}

export function hasCompletedProfile(
  profile: UserProfile
) {
  return Boolean(
    profile?.yourName
      ?.trim() &&
    profile?.yourCompany
      ?.trim()
  )
}