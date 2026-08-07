/**
 * Standardized API client with automatic error handling
 * Wraps fetch and automatically shows error toasts
 */

import { ErrorHandler, ApiResponse } from './errorHandler';
import { toastService } from './toastService';

export interface ApiClientOptions {
  showErrorToast?: boolean;
  showSuccessToast?: boolean;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  token?: string;
}

class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseUrl: string = process.env.NEXT_PUBLIC_API_URL || '') {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  /**
   * Make API request with standardized error handling
   */
  async request<T = any>(
    endpoint: string,
    options: ApiClientOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      showErrorToast = true,
      showSuccessToast = false,
      method = 'GET',
      headers = {},
      body,
      token,
    } = options;

    try {
      const url = `${this.baseUrl}${endpoint}`;
      
      const fetchOptions: RequestInit = {
        method,
        headers: {
          ...this.defaultHeaders,
          ...headers,
        },
      };

      // Add authorization token
      if (token) {
        fetchOptions.headers = {
          ...fetchOptions.headers,
          Authorization: `Bearer ${token}`,
        };
      }

      // Add body if provided
      if (body && method !== 'GET') {
        fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
      }

      const response = await fetch(url, fetchOptions);
      const data: ApiResponse<T> = await response.json();

      // Handle HTTP errors
      if (!response.ok) {
        const error = data.error || { message: `HTTP ${response.status}` };
        throw {
          success: false,
          error,
          status: response.status,
        };
      }

      // Show success toast if enabled
      if (showSuccessToast && data.message) {
        toastService.showSuccess(data.message);
      }

      return data;
    } catch (error: any) {
      // Show error toast if enabled
      if (showErrorToast) {
        toastService.showError(error);
      }

      // Re-throw for component-level handling
      throw error;
    }
  }

  // Convenience methods
  async get<T>(endpoint: string, options?: Omit<ApiClientOptions, 'method'>) {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, body?: any, options?: Omit<ApiClientOptions, 'method' | 'body'>) {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  async put<T>(endpoint: string, body?: any, options?: Omit<ApiClientOptions, 'method' | 'body'>) {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body });
  }

  async patch<T>(endpoint: string, body?: any, options?: Omit<ApiClientOptions, 'method' | 'body'>) {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body });
  }

  async delete<T>(endpoint: string, options?: Omit<ApiClientOptions, 'method'>) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export class for testing/custom instances
export default ApiClient;
