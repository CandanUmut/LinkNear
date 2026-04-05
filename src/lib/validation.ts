/**
 * Client-side form validation schemas.
 *
 * Deliberately dependency-free — matches exactly what the Postgres CHECK
 * constraints enforce on the server, so client errors are user-friendly and
 * server errors are the last line of defense.
 *
 * Every schema returns { ok: true, value } or { ok: false, errors } where
 * errors is a map from field name to a short human-readable message. Callers
 * surface errors inline next to the corresponding input.
 */

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; errors: Record<string, string> }

const LOOKING_FOR_VALUES = [
  'cofounder',
  'study-buddy',
  'mentor',
  'mentee',
  'collaborator',
  'networking',
  'friends',
] as const

export type LookingFor = (typeof LOOKING_FOR_VALUES)[number]

// ---- Profile update ---------------------------------------------------------

export interface ProfileUpdateInput {
  full_name?: string
  headline?: string
  bio?: string
  skills?: string[]
  interests?: string[]
  looking_for?: string
  latitude?: number | null
  longitude?: number | null
  location_name?: string
  discovery_enabled?: boolean
}

export function validateProfileUpdate(
  input: ProfileUpdateInput
): ValidationResult<ProfileUpdateInput> {
  const errors: Record<string, string> = {}

  if (input.full_name !== undefined) {
    const name = input.full_name.trim()
    if (name.length === 0) {
      errors.full_name = 'Name is required'
    } else if (name.length > 80) {
      errors.full_name = 'Name must be 80 characters or fewer'
    }
  }
  if (input.headline !== undefined && input.headline.length > 120) {
    errors.headline = 'Headline must be 120 characters or fewer'
  }
  if (input.bio !== undefined && input.bio.length > 500) {
    errors.bio = 'Bio must be 500 characters or fewer'
  }
  if (input.skills !== undefined) {
    if (input.skills.length > 20) {
      errors.skills = 'Maximum 20 skills'
    }
    if (input.skills.some(s => s.length > 60)) {
      errors.skills = 'Each skill must be 60 characters or fewer'
    }
  }
  if (input.interests !== undefined) {
    if (input.interests.length > 20) {
      errors.interests = 'Maximum 20 interests'
    }
    if (input.interests.some(s => s.length > 60)) {
      errors.interests = 'Each interest must be 60 characters or fewer'
    }
  }
  if (
    input.looking_for !== undefined &&
    !LOOKING_FOR_VALUES.includes(input.looking_for as LookingFor)
  ) {
    errors.looking_for = 'Pick one of the available options'
  }
  if (input.latitude != null && (input.latitude < -90 || input.latitude > 90)) {
    errors.latitude = 'Latitude must be between -90 and 90'
  }
  if (input.longitude != null && (input.longitude < -180 || input.longitude > 180)) {
    errors.longitude = 'Longitude must be between -180 and 180'
  }
  if (input.location_name !== undefined && input.location_name.length > 120) {
    errors.location_name = 'Location name must be 120 characters or fewer'
  }

  return Object.keys(errors).length === 0
    ? { ok: true, value: input }
    : { ok: false, errors }
}

// ---- Connection message ----------------------------------------------------

export function validateConnectionMessage(
  message: string | null | undefined
): ValidationResult<string | null> {
  if (!message) return { ok: true, value: null }
  const trimmed = message.trim()
  if (trimmed.length === 0) return { ok: true, value: null }
  if (trimmed.length > 300) {
    return { ok: false, errors: { message: 'Message must be 300 characters or fewer' } }
  }
  return { ok: true, value: trimmed }
}

// ---- Chat message body -----------------------------------------------------

export function validateMessageBody(body: string): ValidationResult<string> {
  const trimmed = body.trim()
  if (trimmed.length === 0) {
    return { ok: false, errors: { body: 'Message cannot be empty' } }
  }
  if (trimmed.length > 2000) {
    return { ok: false, errors: { body: 'Message must be 2000 characters or fewer' } }
  }
  return { ok: true, value: trimmed }
}

// ---- Age gate --------------------------------------------------------------

export function validateAge(dob: string): ValidationResult<string> {
  if (!dob) return { ok: false, errors: { date_of_birth: 'Date of birth is required' } }
  const d = new Date(dob)
  if (Number.isNaN(d.getTime())) {
    return { ok: false, errors: { date_of_birth: 'Please enter a valid date' } }
  }
  const today = new Date()
  const thirteenYearsAgo = new Date(today.getFullYear() - 13, today.getMonth(), today.getDate())
  if (d > thirteenYearsAgo) {
    return { ok: false, errors: { date_of_birth: 'You must be at least 13 years old' } }
  }
  return { ok: true, value: dob }
}
