import { validateIndianMobile } from './phoneIndia.js'
import { isPhysioDegreeOption } from '../constants/physioQualification.js'
import { isValidIdProofType } from '../constants/idProofTypes.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateEmailOptional(email) {
  const s = String(email ?? '').trim()
  if (!s) return { ok: true }
  if (s.length > 254) return { ok: false, message: 'Email is too long' }
  if (!EMAIL_RE.test(s)) return { ok: false, message: 'Enter a valid email address' }
  return { ok: true }
}

export function validateBasicSection(basic) {
  const errors = {}
  const name = String(basic?.name ?? '').trim()
  if (!name) errors.name = 'Full name is required'
  else if (name.length < 2) errors.name = 'Name must be at least 2 characters'
  else if (name.length > 120) errors.name = 'Name is too long'

  const emailTrim = String(basic?.email ?? '').trim()
  if (!emailTrim) errors.email = 'Email is required'
  else {
    const emailCheck = validateEmailOptional(emailTrim)
    if (!emailCheck.ok) errors.email = emailCheck.message
  }

  const loc = String(basic?.location ?? '').trim()
  if (!loc) errors.location = 'Coverage / location is required'
  else if (loc.length < 2) errors.location = 'Location must be at least 2 characters'
  else if (loc.length > 300) errors.location = 'Location is too long'

  const dobStr = String(basic?.dob ?? '').trim()
  if (!dobStr) errors.dob = 'Date of birth is required'
  else {
    const d = new Date(dobStr)
    if (Number.isNaN(d.getTime())) errors.dob = 'Invalid date of birth'
    else {
      const now = new Date()
      if (d > now) errors.dob = 'Date of birth cannot be in the future'
      const age = (now.getTime() - d.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
      if (age < 18) errors.dob = 'You must be at least 18 years old'
      if (age > 100) errors.dob = 'Please check the date of birth'
    }
  }

  const gender = String(basic?.gender ?? '').trim()
  if (!gender) errors.gender = 'Gender is required'
  else if (!['female', 'male', 'other', 'prefer_not_say'].includes(gender)) {
    errors.gender = 'Select a valid option'
  }

  const address = String(basic?.address ?? '').trim()
  if (address.length > 500) errors.address = 'Address is too long (max 500 characters)'

  return { errors }
}

export function validateQualificationSection(qualification) {
  const errors = {}
  const degree = String(qualification?.degree ?? '').trim()
  if (!degree) errors.degree = 'Degree is required'
  else if (!isPhysioDegreeOption(degree)) errors.degree = 'Select BPT or MPT'

  const university = String(qualification?.university ?? '').trim()
  if (!university) errors.university = 'University is required'
  else if (university.length > 200) errors.university = 'University name is too long'

  if (qualification?.year != null && qualification.year !== '') {
    const y = Number(qualification.year)
    const current = new Date().getFullYear()
    if (!Number.isFinite(y)) errors.year = 'Enter a valid passing year'
    else if (y < 1950 || y > current + 1) errors.year = `Passing year must be between 1950 and ${current + 1}`
  } else {
    errors.year = 'Passing year is required'
  }

  const reg = String(qualification?.registrationNumber ?? '').trim()
  if (reg) {
    if (reg.length < 3) errors.registrationNumber = 'Council registration number is too short'
    else if (reg.length > 80) errors.registrationNumber = 'Council registration number is too long'
  }

  return { errors }
}

export function validatePracticeSection(practice, options = {}) {
  const errors = {}
  if (practice?.experience == null || practice.experience === '') {
    errors.experience = 'Experience (years) is required'
  } else {
    const e = Number(practice.experience)
    if (!Number.isFinite(e) || e < 0) errors.experience = 'Enter a valid number of years'
    else if (e > 80) errors.experience = 'Enter a realistic experience value'
  }

  const spec = String(practice?.specialization ?? '').trim()
  if (!spec && !options.specializationOptional) {
    errors.specialization = 'Specialization is required'
  } else if (spec && spec.length < 2) {
    errors.specialization = 'Specialization must be at least 2 characters'
  } else if (spec.length > 120) {
    errors.specialization = 'Specialization is too long'
  }

  const st = practice?.serviceType
  if (st != null && st !== '' && !['online', 'home', 'both'].includes(st)) {
    errors.serviceType = 'Invalid service type'
  }

  const raw = practice?.areas
  const areaList =
    typeof raw === 'string'
      ? raw.split(/[,;]/).map((s) => s.trim()).filter(Boolean)
      : Array.isArray(raw)
        ? raw.map((s) => String(s).trim()).filter(Boolean)
        : []
  if (areaList.length === 0) errors.areas = 'Add at least one service area'

  return { errors }
}

function hasUrl(s) {
  return Boolean(s && String(s).trim())
}

/**
 * @param {{
 *   name: string, email: string, location: string, dob?: string, gender?: string, address?: string,
 *   degree: string, university: string, year: string, registrationNumber: string,
 *   experience: string, specialization: string, serviceType: string, areas: string, feeMin: string,
 *   docCertificate: string, docAvatar: string, docIdProof: string, docRegistration: string, docSelfie: string,
 *   idProofType?: string,
 *   docSignedNda?: string, requireSignedNda?: boolean
 * }} values
 */
export function validateSubmitForm(values) {
  const errors = {}
  const basic = {
    name: values.name,
    email: values.email,
    location: values.location,
    dob: values.dob,
    gender: values.gender,
    address: values.address,
  }
  Object.assign(errors, validateBasicSection(basic).errors)

  Object.assign(
    errors,
    validateQualificationSection({
      degree: values.degree,
      university: values.university,
      year: values.year,
      registrationNumber: values.registrationNumber,
    }).errors
  )

  Object.assign(
    errors,
    validatePracticeSection({
      experience: values.experience,
      specialization: values.specialization,
      serviceType: values.serviceType,
      areas: values.areas,
    }).errors,
  )

  if (!hasUrl(values.docCertificate)) errors.certificate = 'Upload your BPT/MPT pass certificate'
  if (!hasUrl(values.docAvatar)) errors.avatar = 'Upload your profile photo'
  if (!hasUrl(values.docIdProof)) errors.idProof = 'Upload your GOVERNMENT ID'
  if (!hasUrl(values.docSelfie)) errors.selfieWithId = 'Upload a selfie with your ID'
  const internshipUrls = Array.isArray(values.docInternshipCertificates)
    ? values.docInternshipCertificates.filter((u) => hasUrl(u))
    : hasUrl(values.docInternship)
      ? [values.docInternship]
      : []
  if (internshipUrls.length === 0) {
    errors.internshipCertificate = 'Upload at least one internship certificate'
  }

  if (!isValidIdProofType(values.idProofType)) {
    errors.idProofType =
      'Select the GOVT ID type you uploaded (Aadhaar, PAN, Passport, or Voter ID)'
  }

  if (values.requireSignedNda && !hasUrl(values.docSignedNda)) {
    errors.signedNda = 'Download the NDA, sign it, and upload the signed copy'
  }

  if (values.requireQualificationDeclaration) {
    const accepted =
      values.qualificationDeclarationAccepted === true ||
      (values.qualificationDeclarationAcceptedAt != null &&
        String(values.qualificationDeclarationAcceptedAt).trim() !== '')
    const legacyNda = hasUrl(values.docSignedNda)
    if (!accepted && !legacyNda) {
      errors.qualificationDeclaration = 'Confirm the qualification declaration to continue'
    }
  }

  return { errors, ok: Object.keys(errors).length === 0 }
}

/** Must match server `MAX_UPLOAD_BYTES` (2MB) */
const MAX_FILE_BYTES = 2 * 1024 * 1024

export function validateFile(file, label = 'File') {
  if (!file) return { ok: true }
  if (file.size > MAX_FILE_BYTES) {
    return { ok: false, message: `${label} must be 2MB or smaller` }
  }
  const okType = /^image\//.test(file.type) || file.type === 'application/pdf'
  if (!okType) {
    return { ok: false, message: `${label} must be an image (JPEG, PNG, WebP) or PDF` }
  }
  return { ok: true }
}

export function validateAvatarFile(file) {
  if (!file) return { ok: true }
  if (file.size > MAX_FILE_BYTES) {
    return { ok: false, message: 'Profile photo must be 2MB or smaller' }
  }
  if (!/^image\//.test(file.type)) {
    return { ok: false, message: 'Profile photo must be an image' }
  }
  return { ok: true }
}

/** Phone + password for self-registration (not part of onboarding PATCH). */
export function validateRegistrationAccount({ phone, password }) {
  const errors = {}
  const pv = validateIndianMobile(phone)
  if (!pv.valid) errors.phone = pv.message
  if (!password || String(password).length < 6) {
    errors.password = 'Password must be at least 6 characters'
  }
  return { errors }
}

/**
 * @param {{
 *   fCertificate?: File | null,
 *   fIdProof?: File | null,
 *   fRegCert?: File | null,
 *   fSelfie?: File | null,
 *   fInternships?: File[],
 *   fSignedNda?: File | null
 * }} files
 * @param {{
 *   certificate?: string,
 *   idProof?: string,
 *   registration?: string,
 *   selfie?: string,
 *   signedNda?: string
 * }} existing
 * @param {{ requireSignedNda?: boolean, requireQualificationDeclaration?: boolean, declarationAccepted?: boolean, idProofType?: string }} [opts]
 */
export function validateDocumentsStep(files, existing = {}, opts = {}) {
  const errors = {}
  const has = (url, file) => Boolean(String(url || '').trim()) || Boolean(file)
  const hasInternship =
    (Array.isArray(files.fInternships) && files.fInternships.some(Boolean)) ||
    Boolean(files.fInternship) ||
    (Array.isArray(existing.internshipCertificates) &&
      existing.internshipCertificates.some((u) => String(u || '').trim())) ||
    Boolean(String(existing.internship || '').trim())

  if (!has(existing.certificate, files.fCertificate)) {
    errors.certificate = 'BPT/MPT pass certificate is required'
  }
  if (!hasInternship) {
    errors.internshipCertificate = 'Upload at least one internship certificate'
  }
  if (!has(existing.idProof, files.fIdProof)) {
    errors.idProof = 'GOVERNMENT ID is required'
  }
  if (!has(existing.selfie, files.fSelfie)) {
    errors.selfieWithId = 'Selfie with ID is required'
  }

  const idType = opts.idProofType != null ? String(opts.idProofType).trim().toLowerCase() : ''
  if (has(existing.idProof, files.fIdProof) && !isValidIdProofType(idType)) {
    errors.idProofType = 'Select GOVT ID type (Aadhaar, PAN, Passport, or Voter ID)'
  }
  if (opts.requireSignedNda && !has(existing.signedNda, files.fSignedNda)) {
    errors.signedNda = 'Download the NDA, sign it, and upload the signed copy'
  }
  if (opts.requireQualificationDeclaration && !opts.declarationAccepted) {
    errors.qualificationDeclaration = 'You must agree to the qualification declaration'
  }
  return { errors, ok: Object.keys(errors).length === 0 }
}
