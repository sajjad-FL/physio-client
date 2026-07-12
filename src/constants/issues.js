/** Problem types shown on landing, booking form, and services section; sent as `issue` to the API. */
export const ISSUE_OPTIONS = [
  'Lower Back Pain',
  'Knee & Joint Pain',
  'Neck & Spine Pain',
  'Stroke / Paralysis',
  'Orthopedic Care',
  'Neuro Rehab',
  'Pediatric Rehab',
  'Post-Op Rehab',
  'Elderly Care',
  'Cupping Therapy',
  'Dry Needling',
  'Kinesio Taping',
  'IASTM',
]

/** Select value when user chooses "Other"; final `issue` text comes from a separate text field. */
export const ISSUE_OTHER_VALUE = '__other__'

/** Pass as `location.state.selectedIssue` from home/dashboard to pre-select “Other” on /book. */
export const ISSUE_OTHER_SENTINEL = 'Other condition'
