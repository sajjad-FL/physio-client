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

  if (basic?.dob != null && String(basic.dob).trim()) {
    const d = new Date(basic.dob)
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
  if (gender && !['female', 'male', 'other', 'prefer_not_say'].includes(gender)) {
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
  else if (degree.length > 200) errors.degree = 'Degree is too long'

  const university = String(qualification?.university ?? '').trim()
  if (!university) errors.university = 'University is required'
  else if (university.length > 200) errors.university = 'University name is too long'

  if (qualification?.year != null && qualification.year !== '') {
    const y = Number(qualification.year)
    const current = new Date().getFullYear()
    if (!Number.isFinite(y)) errors.year = 'Enter a valid graduation year'
    else if (y < 1950 || y > current + 1) errors.year = `Year must be between 1950 and ${current + 1}`
  } else {
    errors.year = 'Graduation year is required'
  }

  const reg = String(qualification?.registrationNumber ?? '').trim()
  if (!reg) errors.registrationNumber = 'Registration number is required'
  else if (reg.length < 3) errors.registrationNumber = 'Registration number is too short'
  else if (reg.length > 80) errors.registrationNumber = 'Registration number is too long'

  return { errors }
}

export function validatePracticeSection(practice) {
  const errors = {}
  if (practice?.experience == null || practice.experience === '') {
    errors.experience = 'Experience (years) is required'
  } else {
    const e = Number(practice.experience)
    if (!Number.isFinite(e) || e < 0) errors.experience = 'Enter a valid number of years'
    else if (e > 80) errors.experience = 'Enter a realistic experience value'
  }

  const spec = String(practice?.specialization ?? '').trim()
  if (!spec) errors.specialization = 'Specialization is required'
  else if (spec.length < 2) errors.specialization = 'Specialization must be at least 2 characters'
  else if (spec.length > 120) errors.specialization = 'Specialization is too long'

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

  if (practice?.fees == null || practice.fees === '') {
    errors.fees = 'Fee per session is required'
  } else {
    const fee = Number(practice.fees)
    if (!Number.isFinite(fee) || fee <= 0) errors.fees = 'Enter a valid fee greater than zero (₹)'
    else if (fee > 500000) errors.fees = 'Fee seems unreasonably high — please check'
  }

  return { errors }
}

function hasUrl(s) {
  return Boolean(s && String(s).trim())
}

/**
 * @param {{
 *   name: string, email: string, location: string, dob?: string, gender?: string, address?: string,
 *   degree: string, university: string, year: string, registrationNumber: string,
 *   experience: string, specialization: string, serviceType: string, areas: string, fees: string,
 *   docCertificate: string, docIdProof: string, docRegistration: string, docSelfie: string
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
      fees: values.fees,
    }).errors
  )

  if (!hasUrl(values.docCertificate)) errors.certificate = 'Upload your qualification certificate'
  if (!hasUrl(values.docIdProof)) errors.idProof = 'Upload ID proof'
  if (!hasUrl(values.docRegistration)) errors.registrationCertificate = 'Upload registration certificate'
  if (!hasUrl(values.docSelfie)) errors.selfieWithId = 'Upload a selfie with your ID'

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

/**
 * @param {{ fCertificate?: File | null, fIdProof?: File | null, fRegCert?: File | null, fSelfie?: File | null }} files
 * @param {{ certificate?: string, idProof?: string, registration?: string, selfie?: string }} existing Server URLs already saved
 */
export function validateDocumentsStep(files, existing = {}) {
  const errors = {}
  const has = (url, file) => Boolean(String(url || '').trim()) || Boolean(file)
  if (!has(existing.certificate, files.fCertificate)) {
    errors.certificate = 'Qualification certificate is required'
  }
  if (!has(existing.idProof, files.fIdProof)) {
    errors.idProof = 'ID proof is required'
  }
  if (!has(existing.registration, files.fRegCert)) {
    errors.registrationCertificate = 'Registration certificate is required'
  }
  if (!has(existing.selfie, files.fSelfie)) {
    errors.selfieWithId = 'Selfie with ID is required'
  }
  return { errors, ok: Object.keys(errors).length === 0 }
}
