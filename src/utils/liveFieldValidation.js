/**
 * Single-field validation for real-time form feedback (on change).
 * Returns '' when valid, otherwise an error message.
 * Aligns with `onboardingValidation.js` rules.
 */
import { validateIndianMobile } from './phoneIndia.js'
import {
  validateEmailOptional,
  validateFile,
  validateAvatarFile,
} from './onboardingValidation.js'
import { PHYSIO_DEGREE_OPTIONS } from '../constants/physioQualification.js'
import { isValidIdProofType } from '../constants/idProofTypes.js'

/**
 * @param {string} name - field id
 * @param {unknown} value
 * @param {{
 *   locationLat?: number | null,
 *   locationLng?: number | null,
 *   mode?: 'booking' | 'physio',
 *   isPhysio?: boolean,
 *   requiredGender?: boolean,
 *   requireCoords?: boolean,
 *   feeMinStr?: string,
 * }} [ctx]
 */
export function validateLiveField(name, value, ctx = {}) {
  const v = value === undefined || value === null ? '' : value
  const str = typeof v === 'string' ? v : v instanceof File ? v : String(v)

  switch (name) {
    case 'phone':
    case 'bookingPhone': {
      const pv = validateIndianMobile(str)
      return pv.valid ? '' : pv.message
    }
    case 'password':
    case 'loginPassword': {
      if (!str) return ''
      return str.length < 6 ? 'Password must be at least 6 characters' : ''
    }
    case 'email':
    case 'loginEmail': {
      const t = str.trim()
      if (!t) return 'Email is required'
      const c = validateEmailOptional(t)
      return c.ok ? '' : c.message
    }
    case 'profileEmail': {
      const t = str.trim()
      if (!t) return ''
      const c = validateEmailOptional(t)
      return c.ok ? '' : c.message
    }
    case 'name':
    case 'bookingName': {
      const t = str.trim()
      if (!t) return 'Full name is required'
      if (t.length < 2) return 'Name must be at least 2 characters'
      if (t.length > 120) return 'Name is too long'
      return ''
    }
    case 'location': {
      const mode = ctx.mode || 'physio'
      const t = str.trim()
      if (mode === 'booking') {
        if (!t) return 'Location is required'
        if (t.length < 2) return 'Enter area or city (at least 2 characters)'
        return ''
      }
      if (!t) return 'Coverage / location is required'
      if (t.length < 2) return 'Location must be at least 2 characters'
      if (t.length > 300) return 'Location is too long'
      if (ctx.requireCoords === false) return ''
      if (ctx.locationLat == null || ctx.locationLng == null) {
        return 'Use map search or Pick on map to set your coverage point'
      }
      return ''
    }
    case 'dob': {
      if (!str || !String(str).trim()) return 'Date of birth is required'
      const d = new Date(str)
      if (Number.isNaN(d.getTime())) return 'Invalid date of birth'
      const now = new Date()
      if (d > now) return 'Date of birth cannot be in the future'
      const age = (now.getTime() - d.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
      if (age < 18) return 'You must be at least 18 years old'
      if (age > 100) return 'Please check the date of birth'
      return ''
    }
    case 'gender': {
      const g = String(str).trim()
      if (!g) return ctx.requiredGender ? 'Gender is required' : ''
      if (!['female', 'male', 'other', 'prefer_not_to_say'].includes(g)) return 'Select a valid option'
      return ''
    }
    case 'address': {
      const t = str.trim()
      if (t.length > 500) return 'Address is too long (max 500 characters)'
      return ''
    }
    case 'addressCoords': {
      const lat = ctx.addressLat
      const lng = ctx.addressLng
      if ((lat == null || lat === '') !== (lng == null || lng === '')) {
        return 'Address coordinates are incomplete. Re-select a place on the map or from search.'
      }
      return ''
    }
    case 'degree': {
      const t = str.trim()
      if (!t) return 'Degree is required'
      if (!PHYSIO_DEGREE_OPTIONS.includes(t)) return 'Select BPT or MPT'
      return ''
    }
    case 'university': {
      const t = str.trim()
      if (!t) return 'University is required'
      if (t.length > 200) return 'University name is too long'
      return ''
    }
    case 'year': {
      if (str === '' || str == null) return 'Passing year is required'
      const y = Number(str)
      const current = new Date().getFullYear()
      if (!Number.isFinite(y)) return 'Enter a valid passing year'
      if (y < 1950 || y > current + 1) return `Passing year must be between 1950 and ${current + 1}`
      return ''
    }
    case 'registrationNumber': {
      const t = str.trim()
      if (!t) return ''
      if (t.length < 3) return 'Council registration number is too short'
      if (t.length > 80) return 'Council registration number is too long'
      return ''
    }
    case 'experience': {
      if (str === '' || str == null) return 'Experience (years) is required'
      const e = Number(str)
      if (!Number.isFinite(e) || e < 0) return 'Enter a valid number of years'
      if (e > 80) return 'Enter a realistic experience value'
      return ''
    }
    case 'specialization': {
      const t = str.trim()
      if (!ctx.isPhysio) return ''
      if (!t) return 'Specialization is required for physiotherapists'
      if (t.length < 2) return 'Specialization must be at least 2 characters'
      if (t.length > 120) return 'Specialization is too long'
      return ''
    }
    case 'serviceType': {
      if (str && !['online', 'home', 'both'].includes(str)) return 'Invalid service type'
      return ''
    }
    case 'areas': {
      const raw = str
      const areaList =
        typeof raw === 'string'
          ? raw.split(/[,;]/).map((s) => s.trim()).filter(Boolean)
          : Array.isArray(raw)
            ? raw.map((s) => String(s).trim()).filter(Boolean)
            : []
      if (areaList.length === 0) return 'Add at least one service area'
      return ''
    }
    case 'fees': {
      if (str === '' || str == null) return 'Minimum fee per session is required'
      const fee = Number(str)
      if (!Number.isFinite(fee) || fee <= 0) return 'Enter a valid minimum fee greater than zero (₹)'
      if (fee > 500000) return 'Fee seems unreasonably high — please check'
      return ''
    }
    case 'feeMin': {
      if (str === '' || str == null) return 'Minimum fee per session is required'
      const fee = Number(str)
      if (!Number.isFinite(fee) || fee <= 0) return 'Enter a valid minimum fee greater than zero (₹)'
      if (fee > 500000) return 'Fee seems unreasonably high — please check'
      return ''
    }
    case 'feeMax': {
      if (str === '' || str == null) return ''
      const fee = Number(str)
      if (!Number.isFinite(fee) || fee <= 0) return 'Enter a valid maximum fee (₹)'
      if (fee > 500000) return 'Fee seems unreasonably high — please check'
      const minStr = ctx.feeMinStr != null ? String(ctx.feeMinStr).trim() : ''
      if (minStr !== '') {
        const min = Number(minStr)
        if (Number.isFinite(min) && fee < min) return 'Maximum must be greater than or equal to minimum'
      }
      return ''
    }
    case 'profileFees': {
      if (str === '' || str == null) return ''
      const fee = Number(str)
      if (!Number.isFinite(fee) || fee < 0) return 'Enter a valid fee (₹)'
      if (fee > 500000) return 'Fee seems unreasonably high — please check'
      return ''
    }
    case 'profileFeeMax': {
      if (str === '' || str == null) return ''
      const fee = Number(str)
      if (!Number.isFinite(fee) || fee <= 0) return 'Enter a valid maximum fee (₹)'
      if (fee > 500000) return 'Fee seems unreasonably high — please check'
      const minStr = ctx.feeMinStr != null ? String(ctx.feeMinStr).trim() : ''
      if (minStr !== '') {
        const min = Number(minStr)
        if (Number.isFinite(min) && fee < min) return 'Maximum must be greater than or equal to minimum'
      }
      return ''
    }
    case 'profileExperience': {
      if (str === '' || str == null) return ''
      const e = Number(str)
      if (!Number.isFinite(e) || e < 0) return 'Enter a valid number of years'
      if (e > 80) return 'Enter a realistic experience value'
      return ''
    }
    case 'issue':
    case 'bookingIssue': {
      const t = str.trim()
      if (!t) return 'Please select a problem'
      return ''
    }
    case 'otp': {
      const d = String(str).replace(/\D/g, '')
      if (!d) return ''
      if (d.length !== 4) return 'Enter the 4-digit code'
      return ''
    }
    case 'avatar':
    case 'avatarFile': {
      if (!v || !(v instanceof File)) return ''
      const r = validateAvatarFile(v)
      return r.ok ? '' : r.message
    }
    case 'idProofType': {
      const t = String(str).trim().toLowerCase()
      if (!t) return 'Select the type of ID you are uploading'
      return isValidIdProofType(t) ? '' : 'Select Aadhaar, PAN, Passport, or Voter ID'
    }
    case 'certificate':
    case 'idProof':
    case 'registrationCertificate':
    case 'selfieWithId':
    case 'internshipCertificate': {
      if (!v) return ''
      const list = Array.isArray(v) ? v : [v]
      for (const file of list) {
        if (!(file instanceof File)) continue
        const r = validateFile(file, 'File')
        if (!r.ok) return r.message
      }
      return ''
    }
    case 'councilRegistrationCertificate':
    case 'signedNda': {
      if (!v || !(v instanceof File)) return ''
      const r = validateFile(v, 'File')
      return r.ok ? '' : r.message
    }
    default:
      return ''
  }
}

/**
 * Merge server-side field errors with live validation for one field (e.g. after user edits).
 */
export function mergeServerFieldErrors(serverErrors, fieldName) {
  if (!serverErrors || typeof serverErrors !== 'object') return {}
  const next = { ...serverErrors }
  delete next[fieldName]
  return next
}
