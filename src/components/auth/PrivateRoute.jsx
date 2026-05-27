'use client'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useLocalizedRouter } from "@/hooks/useLocalizedRouter"
import { getTokens, getUserDetailsFromToken } from '@/store/utils/token'
import { logout } from '@/utils/auth'
import { usePostHog } from '@/hooks/usePostHog'
import { usePyzoSessionSync, AccessDeniedScreen, hasProductAccess, refreshSession, getAuthTokens } from '@esmagico/pyzo-auth-sdk'

const PRODUCT_NAME = 'atlas'
const REFRESH_URL = `${process.env.NEXT_PUBLIC_LOGIN_BASE_URL}/auth/refresh`

const PrivateRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useLocalizedRouter()
  const pathname = usePathname()
  const [permissionDenied, setPermissionDenied] = useState(false)

  // Cross-tab session sync: refreshes tokens on every tab switch to get latest permissions,
  // then checks product access (no admin check for user app).
  usePyzoSessionSync({
    onLogout: () => {
      if (!isLoginPage) {
        logout()
      }
    },
    onLogin: () => router.push('/'),
    productName: PRODUCT_NAME,
    refreshUrl: REFRESH_URL,
    onPermissionDenied: () => {
      // Token exists but product check failed — user IS logged in, just lacks access.
      // If on /login, navigate to home first so AccessDeniedScreen renders there.
      setPermissionDenied(true)
      if (window.location.pathname === '/login') {
        router.push('/')
      }
    },
    onPermissionGranted: () => {
      setPermissionDenied(false)
    },
  })

  const { identify } = usePostHog()

  // Match /login, /en/login, /de/login etc.
  const isLoginPage = pathname === '/login' || pathname.endsWith('/login')

  useEffect(() => {
    // Skip auth check for login page
    if (isLoginPage) {
      return
    }

    const checkAuth = async () => {
      const tokens = getTokens()

      if (!tokens.access_token) {
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`)
        return
      }

      // Refresh tokens to get latest permissions on page load
      await refreshSession(REFRESH_URL)
      const freshTokens = getAuthTokens() || tokens

      // Check product access on the refreshed token
      if (freshTokens.access_token && !hasProductAccess(freshTokens.access_token, PRODUCT_NAME)) {
        setPermissionDenied(true)
        return
      }

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
    }

    checkAuth()
  }, [pathname, router])

  // For login page, render without auth check
  if (isLoginPage) {
    return children
  }

  // Access denied — show screen without clearing the session cookie
  if (permissionDenied) {
    return (
      <AccessDeniedScreen
        productName="Atlas"
        onSwitchAccount={() => {
          logout()
        }}
      />
    )
  }

  // For other pages, render if authenticated
  if (isAuthenticated) {
    return children
  }

  // Return null while redirecting to login
  return null
}

export default PrivateRoute
