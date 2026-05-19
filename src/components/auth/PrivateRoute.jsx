'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getTokens, getUserDetailsFromToken } from '@/store/utils/token'
import { logout } from '@/utils/auth'
import { usePostHog } from '@/hooks/usePostHog'
import { usePyzoSessionSync } from '@esmagico/pyzo-auth-sdk'

const PrivateRoute = ({ children }) => {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  usePyzoSessionSync({
    onLogout: logout,
    onLogin: () => router.push('/'),
  })
  const { identify } = usePostHog()

  useEffect(() => {
    // Skip auth check for login page
    if (pathname === '/login') {
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
      router.push('/login')
    }
  }, [pathname, router])

  // For login page, render without auth check
  if (pathname === '/login') {
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
