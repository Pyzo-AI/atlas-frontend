import { getAuthTokens } from "@esmagico/pyzo-auth-sdk";

export const getTokens = () => {
  if (typeof window !== 'undefined') {
    return getAuthTokens() || {};
  }
  return {};
};

export const getUserDetailsFromToken = () => {
  try {
    const tokens = getTokens();
    if (!tokens.access_token) return null;
    
    // Split the token into its parts
    const base64Url = tokens.access_token.split('.')[1];
    if (!base64Url) return null;
    
    // Convert base64Url to base64 and then parse the JSON
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(window.atob(base64));
    
    // Return the username from the token payload
    return payload;
  } catch (error) {
    console.log('Error decoding token:', error);
    return null;
  }
};