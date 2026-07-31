'use client'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useLocalizedRouter } from "@/hooks/useLocalizedRouter"
import { getTokens, getUserDetailsFromToken } from '@/store/utils/token'
import { logout } from '@/utils/auth'
import { usePostHog } from '@/hooks/usePostHog'
import { usePyzoSessionSync, AccessDeniedScreen, hasProductAccess, refreshSession, getAuthTokens } from '@esmagico/pyzo-auth-sdk'

const PRODUCT_NAME = 'atlas'
const REFRESH_BASE_URL = process.env.NEXT_PUBLIC_LOGIN_BASE_URL || ''

// Browser-persisted state that belongs to one learner. None of it is keyed by
// user, so it has to be dropped whenever the signed-in account changes.
const USER_SCOPED_STORAGE_KEYS = [
  'video_progress',
  'assessmentProgress',
  'resultModalState',
  'trainboost_conversation_history',
]

const PrivateRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useLocalizedRouter()
  const pathname = usePathname()
  const [permissionDenied, setPermissionDenied] = useState(false)

  // Match /login, /en/login, /de/login etc.
  const isLoginPage = pathname === '/login' || pathname.endsWith('/login')

  // Cross-tab session sync: refreshes tokens on every tab switch to get latest permissions,
  // then checks product access (no admin check for user app).
  usePyzoSessionSync({
    onLogout: () => {
      if (!isLoginPage) {
        logout()
      }
    },
    onLogin: () => router.push('/'),
    loginPath: isLoginPage ? pathname : '/login',
    productName: PRODUCT_NAME,
    refreshBaseUrl: REFRESH_BASE_URL,
    onPermissionDenied: () => {
      // Token exists but product check failed — user IS logged in, just lacks access.
      // If on /login, navigate to home first so AccessDeniedScreen renders there.
      setPermissionDenied(true)
      if (isLoginPage) {
        router.push('/')
      }
    },
    onPermissionGranted: () => {
      setPermissionDenied(false)
    },
    // A sibling *.pyzo.ai tab signed a different account into the shared
    // session cookie. Everything below is learner-specific and keyed to no one,
    // so without this the new account inherits the previous learner's video
    // position, assessment answers and chat history. The reload then rebuilds
    // the store and every mounted component for whoever signed in.
    onUserChange: () => {
      USER_SCOPED_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key))
      window.location.reload()
    },
  })

  const { identify } = usePostHog()

  useEffect(() => {
    const checkAuth = async () => {
      const tokens = getTokens()

      if (isLoginPage) {
        if (tokens.access_token) {
          router.push('/')
        }
        return
      }

      if (!tokens.access_token) {
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`)
        return
      }

      // Refresh tokens to get latest permissions on page load
      await refreshSession(REFRESH_BASE_URL)
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
