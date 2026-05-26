'use client'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useLocalizedRouter } from "@/hooks/useLocalizedRouter"
import { getTokens, getUserDetailsFromToken } from '@/store/utils/token'
import { usePostHog } from '@/hooks/usePostHog'

const PrivateRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useLocalizedRouter()
  const pathname = usePathname()
  const { identify } = usePostHog()

  // Match /login, /en/login, /de/login etc.
  const isLoginPage = pathname === '/login' || pathname.endsWith('/login')

  useEffect(() => {
    // Skip auth check for login page
    if (isLoginPage) {
      return
    }

    const tokens = getTokens()

    // Simple check: if access token exists, user is authenticated
    if (tokens.access_token) {
      setIsAuthenticated(true)

      // Identify user in PostHog for existing sessions
      const userDetails = getUserDetailsFromToken()
      if (userDetails) {
        identify(userDetails.sub || userDetails.user_id, {
          username: userDetails.username || userDetails.preferred_username,
          name: userDetails.name,
          roles: userDetails.roles || userDetails.groups,
          session_start: new Date().toISOString(),
        })
      }
    } else {
      // Redirect to login — middleware will prepend the locale automatically
      router.push('/login')
    }
  }, [pathname, router, isLoginPage])

  // For login page, render without auth check
  if (isLoginPage) {
    return children
  }

  // For other pages, render if authenticated
  if (isAuthenticated) {
    return children
  }

  // Return null while redirecting to login
  return null
}

export default PrivateRoute
