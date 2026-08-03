/** Allowed spoken languages for physiotherapist profiles (NE India focus). */
export const PHYSIO_LANGUAGE_VALUES = Object.freeze([
  'Hindi',
  'English',
  'Assamese',
  'Bodo',
  'Bengali',
  'Manipuri (Meitei)',
  'Mizo',
  'Khasi',
  'Garo',
  'Nagamese',
  'Nepali',
  'Karbi',
  'Dimasa',
  'Kokborok',
  'Ao',
  'Angami',
])

export function isValidPhysioLanguage(v) {
  return PHYSIO_LANGUAGE_VALUES.includes(String(v ?? '').trim())
}
