import { decodeJWT } from "./jwt";
import { trackLogout } from "./authTracking";
import { getAuthTokens, setAuthTokens, logout as sdkLogout, refreshSession } from "@esmagico/pyzo-auth-sdk";

export const refreshAccessToken = async () => {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_LOGIN_BASE_URL || "";
    const success = await refreshSession(baseUrl);

    if (success) {
      const tokens = getAuthTokens();
      return tokens?.access_token;
    } else {
      // Refresh token is expired or invalid - logout user
      logout();
      return null;
    }
  } catch (error) {
    logout();
    throw error;
  }
};

export const getValidAccessToken = async () => {
  const tokens = getAuthTokens() || {};

  if (!tokens.access_token) {
    return null;
  }

  const decoded = decodeJWT(tokens.access_token);

  // Check if token is expired (with 30 second buffer)
  if (decoded && decoded.exp > Date.now() / 1000 + 30) {
    return tokens.access_token;
  }

  // Token is expired, try to refresh
  try {
    return await refreshAccessToken();
  } catch (error) {
    // If refresh fails, user has been logged out
    return null;
  }
};

// Check if token is expired without refreshing
export const isTokenExpired = (token) => {
  if (!token) return true;

  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) return true;

  // Check if token is expired (with 30 second buffer)
  return decoded.exp <= Date.now() / 1000 + 30;
};

// Logout utility
export const logout = (loginUrl = "/login") => {
  // Get user ID for tracking before clearing tokens
  const tokens = getAuthTokens() || {};
  let userId = null;
  if (tokens.access_token) {
    const decoded = decodeJWT(tokens.access_token);
    userId = decoded?.sub;
  }
  
  // Track session end event
  if (userId) {
    trackLogout(userId);
  }
  
  // Use SDK logout to revoke session on Keycloak
  sdkLogout({
    loginUrl,
    baseUrl: process.env.NEXT_PUBLIC_LOGIN_BASE_URL || "",
    refreshToken: tokens?.refresh_token,
  });
};
