import { decodeJWT } from "./jwt";

// Get the refresh token URL from environment or fallback
const REFRESH_TOKEN_URL = process.env.NEXT_PUBLIC_LOGIN_BASE_URL
  ? `${process.env.NEXT_PUBLIC_LOGIN_BASE_URL}/auth/refresh-token`
  : "https://xstk67r5-3001.inc1.devtunnels.ms/auth/refresh-token";

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
      throw new Error("Failed to refresh token");
    }
  } catch (error) {
    // Don't clear tokens or redirect - just throw the error
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
    // If refresh fails, return the expired token anyway
    return tokens.access_token;
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
  localStorage.removeItem("trainboost_tokens");
  window.location.href = "/login";
};
