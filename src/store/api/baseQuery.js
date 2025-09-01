import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { getValidAccessToken } from '@/utils/auth';

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
      console.error('Failed to get valid access token:', error);
      // Token refresh failed, user will be redirected to login
    }
    
    return headers;
  },
});

// Alternative base query with retry logic for additional robustness
export const baseQueryWithReauthAndRetry = async (args, api, extraOptions) => {
  let result = await baseQueryWithReauth(args, api, extraOptions);
  
  // If we get a 401, try to refresh token and retry once
  if (result.error && result.error.status === 401) {
    try {
      // Force token refresh
      const newToken = await getValidAccessToken();
      
      if (newToken) {
        // Retry the original request with new token
        result = await baseQueryWithReauth(args, api, extraOptions);
      }
      // If no valid token, just return the 401 error - don't logout
    } catch (error) {
      console.error('Token refresh failed during retry:', error);
      // Don't logout, just return the original error
    }
  }
  
  return result;
};