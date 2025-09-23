import { posthog } from '@/utils/posthog'

export function usePostHog() {
  const capture = (eventName, properties = {}) => {
    if (typeof window !== 'undefined') {
      posthog.capture(eventName, properties)
    }
  }

  const identify = (userId, properties = {}) => {
    if (typeof window !== 'undefined') {
      posthog.identify(userId, properties)
    }
  }

  const reset = () => {
    if (typeof window !== 'undefined') {
      posthog.reset()
    }
  }

  const setPersonProperties = (properties) => {
    if (typeof window !== 'undefined') {
      posthog.setPersonProperties(properties)
    }
  }

  return {
    capture,
    identify,
    reset,
    setPersonProperties,
    posthog: typeof window !== 'undefined' ? posthog : null
  }
}