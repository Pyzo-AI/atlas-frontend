import { decodeJWT } from "./jwt";
import { trackLogout } from "./authTracking";

// Get the refresh token URL from environment or fallback
const REFRESH_TOKEN_URL = `${process.env.NEXT_PUBLIC_LOGIN_BASE_URL}/auth/refresh-token`;

export const refreshAccessToken = async () => {
  try {
    const tokens = JSON.parse(
      localStorage.getItem("trainboost_tokens") || "{}"
    );

    if (!tokens.refresh_token) {
      throw new Error("No refresh token available");
    }

    const response = await fetch(REFRESH_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh_token: tokens.refresh_token }),
    });

    if (response.ok) {
      const data = await response.json();

      // Store new tokens
      localStorage.setItem(
        "trainboost_tokens",
        JSON.stringify({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        })
      );

      return data.access_token;
    } else {
      // Refresh token is expired or invalid - logout user
      logout();
    }
  } catch (error) {
    // If it's a network error, don't logout
    if (error.message === "Refresh token expired") {
      throw error;
    }
    // For other errors (network issues), logout as well
    logout();
    throw error;
  }
};

export const getValidAccessToken = async () => {
  const tokens = JSON.parse(localStorage.getItem("trainboost_tokens") || "{}");

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
export const logout = () => {
  // Get user ID for tracking before clearing tokens
  const tokens = JSON.parse(localStorage.getItem("trainboost_tokens") || "{}");
  let userId = null;
  if (tokens.access_token) {
    const decoded = decodeJWT(tokens.access_token);
    userId = decoded?.sub;
  }
  
  // Track session end event
  if (userId) {
    trackLogout(userId);
  }
  
  localStorage.removeItem("trainboost_tokens");
  window.location.href = "/login";
};
