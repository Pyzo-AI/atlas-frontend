/**
 * Standardized error handler for API responses
 * Handles both new standardized format and legacy formats
 */

export interface ApiError {
  code: string;
  message: string;
  details?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  error?: ApiError;
  data?: T;
  message?: string;
}

export class ErrorHandler {
  /**
   * Extract user-facing error message from API response
   * Returns "Something went wrong. Please try again later." if message is unclear
   */
  static getErrorMessage(error: any): string {
    // Standardized format: {success: false, error: {message: "..."}}
    if (error?.error?.message) {
      return error.error.message;
    }

    // Legacy format: {error: "message"}
    if (typeof error?.error === 'string') {
      return error.error;
    }

    // Legacy format: {message: "error"}
    if (error?.message && typeof error.message === 'string') {
      return error.message;
    }

    // Network error
    if (error?.message === 'Network Error') {
      return 'Network error. Please check your connection.';
    }

    // Timeout
    if (error?.code === 'ECONNABORTED') {
      return 'Request timeout. Please try again.';
    }

    // Default fallback
    return 'Something went wrong. Please try again later.';
  }

  /**
   * Get error code for analytics/logging
   */
  static getErrorCode(error: any): string {
    return error?.error?.code || error?.code || 'UNKNOWN_ERROR';
  }

  /**
   * Get full error details (for dev/debugging)
   */
  static getErrorDetails(error: any): string | undefined {
    return error?.error?.details || error?.details;
  }

  /**
   * Check if error is from standardized format
   */
  static isStandardizedError(error: any): boolean {
    return error?.success === false && error?.error?.code;
  }

  /**
   * Format error for logging
   */
  static formatForLogging(error: any): object {
    return {
      code: this.getErrorCode(error),
      message: this.getErrorMessage(error),
      details: this.getErrorDetails(error),
      raw: error,
    };
  }
}

/**
 * Hook-friendly error handler
 */
export const useErrorHandler = () => {
  return {
    getMessage: ErrorHandler.getErrorMessage,
    getCode: ErrorHandler.getErrorCode,
    getDetails: ErrorHandler.getErrorDetails,
    isStandardized: ErrorHandler.isStandardizedError,
  };
};
