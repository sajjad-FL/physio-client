/** True when the API blocked the request because the patient profile is incomplete. */
export function isProfileIncompleteError(err) {
  return err?.response?.status === 403 && err?.response?.data?.code === 'PROFILE_INCOMPLETE'
}
