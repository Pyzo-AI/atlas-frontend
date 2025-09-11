import { posthog } from '@/utils/posthog'

export const trackLogout = (userId) => {
  if (typeof window !== 'undefined') {
    posthog.capture('user_logout', {
      user_id: userId,
      timestamp: new Date().toISOString(),
      session_duration: 'calculated_by_posthog'
    })
    
    // Reset PostHog user identification
    posthog.reset()
  }
}

export const trackSessionTimeout = (userId) => {
  if (typeof window !== 'undefined') {
    posthog.capture('session_timeout', {
      user_id: userId,
      timestamp: new Date().toISOString(),
      reason: 'token_expired'
    })
    
    // Reset PostHog user identification
    posthog.reset()
  }
}