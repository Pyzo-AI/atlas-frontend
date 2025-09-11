import { posthog } from 'posthog-js'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./src/utils/posthog')
  }
}