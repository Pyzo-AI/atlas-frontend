import { posthog } from 'posthog-js'

if (typeof window !== 'undefined') {
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  if (posthogKey) {
    posthog.init(posthogKey, {
      api_host: posthogHost || 'https://us.i.posthog.com',
      person_profiles: 'identified_only',
      // Enable debug mode in development
      loaded: (ph) => {
        if (process.env.NODE_ENV === 'development') ph.debug()
      }
    })
  } else {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[PostHog] NEXT_PUBLIC_POSTHOG_KEY is not defined. Tracking is disabled.');
    }
  }
}

export { posthog }