import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { preparePyzoHeaders, createPyzoBaseQuery } from '@esmagico/pyzo-auth-sdk';
import { logout } from '@/utils/auth';
import { toastService } from '@/utils/toastService';
import { ErrorHandler } from '@/utils/errorHandler';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Custom error handler that shows toasts
const handleBaseQueryError = (error) => {
  if (error) {
    try {
      const errorData = error?.data || error;
      toastService.showError(errorData);
    } catch (e) {
      // Fallback error message
      toastService.showError({ message: 'Something went wrong. Please try again later.' });
    }
  }
};

export const baseQueryWithReauth = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers) => preparePyzoHeaders(headers, {
    baseUrl: process.env.NEXT_PUBLIC_LOGIN_BASE_URL || API_BASE_URL || ''
  }),
});

// Wrapper around baseQuery to handle errors with toasts
const baseQueryWithErrorHandling = async (args, api, extraOptions) => {
  const result = await baseQueryWithReauth(args, api, extraOptions);
  
  // Show error toast if there's an error
  if (result.error) {
    handleBaseQueryError(result.error);
  }
  
  return result;
};

export const baseQueryWithReauthAndRetry = createPyzoBaseQuery(baseQueryWithErrorHandling, {
  baseUrl: process.env.NEXT_PUBLIC_LOGIN_BASE_URL || API_BASE_URL || '',
  publicRoutes: ['/login'],
  loginPath: '/login',
  onLogout: (loginUrl) => logout(loginUrl)
});