import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { getValidAccessToken, logout } from '@/utils/auth';

// Get environment variables with fallbacks
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Enhanced base query with automatic token refresh
export const baseQueryWithReauth = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: async (headers) => {
    headers.set('Accept', 'application/json');

    try {
      // Get valid access token (will refresh if needed)
      const accessToken = await getValidAccessToken();
      
      if (accessToken) {
        headers.set('Authorization', `Bearer ${accessToken}`);
      }
    } catch (error) {
      console.log('Failed to get valid access token:', error);
      // Token refresh failed, user will be redirected to login
    }
    
    return headers;
  },
});

// Alternative base query with retry logic for additional robustness
export const baseQueryWithReauthAndRetry = async (args, api, extraOptions) => {
  let result = await baseQueryWithReauth(args, api, extraOptions);
  
  if (result.error && result.error.status === 401) {
    try {
      // Try to get a valid token (refreshes if needed)
      const newToken = await getValidAccessToken();
      
      if (newToken) {
        // Retry the original request with new token
        result = await baseQueryWithReauth(args, api, extraOptions);
        
        // If it STILL fails with 401 after retry, logout
        if (result.error && result.error.status === 401) {
          logout();
        }
      } else {
        // If getValidAccessToken returned null, it means refresh failed
        logout();
      }
    } catch (error) {
      console.log('Token refresh failed during retry:', error);
      logout();
    }
  }
  
  return result;
};