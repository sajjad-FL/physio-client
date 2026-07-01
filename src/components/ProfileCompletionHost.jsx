import { useProfileCompletionPoller } from '../hooks/useProfileCompletionPoller'
import { getToken } from '../auth/session'
import ProfileCompletionOverlay from './ProfileCompletionOverlay'

/** Non-blocking profile completion reminder (60s poll while incomplete). */
export default function ProfileCompletionHost() {
  const token = getToken()
  const { profile, isComplete, missingFields, showPrompt, dismissPrompt, refresh } =
    useProfileCompletionPoller(Boolean(token))

  const modalVisible = Boolean(showPrompt && token && !isComplete && profile?.role === 'user')

  return (
    <ProfileCompletionOverlay
      open={modalVisible}
      onDismiss={dismissPrompt}
      profile={profile}
      missingFields={missingFields}
      refresh={refresh}
    />
  )
}
