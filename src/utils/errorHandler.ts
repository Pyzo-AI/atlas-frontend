/**
 * Standardized error handler for API responses
 * Handles RTK Query, backend response payloads, and legacy formats
 */

export interface ApiError {
  code?: string;
  message?: string;
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
   * Returns fallback or "Something went wrong. Please try again later." if message is unclear
   */
  static getErrorMessage(error: any, fallback?: string): string {
    if (!error) {
      return fallback || "Something went wrong. Please try again later.";
    }

    // 1. RTK Query / Backend Data Error payload
    if (error?.data?.message && typeof error.data.message === "string") {
      return error.data.message;
    }
    if (error?.data?.error && typeof error.data.error === "string") {
      return error.data.error;
    }
    if (error?.data?.details && typeof error.data.details === "string") {
      return error.data.details;
    }

    // 2. Standardized format: { error: { message: "..." } }
    if (error?.error?.message && typeof error.error.message === "string") {
      return error.error.message;
    }

    // 3. String error inside error property
    if (typeof error?.error === "string") {
      return error.error;
    }

    // 4. Direct string message property
    if (error?.message && typeof error.message === "string") {
      if (error.message === "Network Error" || error.status === "FETCH_ERROR") {
        return "Network error. Please check your internet connection.";
      }
      return error.message;
    }

    // 5. Direct string
    if (typeof error === "string") {
      return error;
    }

    // 6. Network / Timeout errors
    if (error?.status === "FETCH_ERROR") {
      return "Network error. Please check your internet connection.";
    }
    if (error?.status === "PARSING_ERROR") {
      return "Server response error. Please try again.";
    }
    if (error?.code === "ECONNABORTED") {
      return "Request timeout. Please try again.";
    }

    // 7. Default fallback
    return fallback || "Something went wrong. Please try again later.";
  }

  /**
   * Get error code for analytics/logging
   */
  static getErrorCode(error: any): string {
    return error?.error?.code || error?.code || "UNKNOWN_ERROR";
  }

  /**
   * Get full error details (for dev/debugging)
   */
  static getErrorDetails(error: any): string | undefined {
    return error?.error?.details || error?.details || error?.data?.details;
  }

  /**
   * Check if error is from standardized format
   */
  static isStandardizedError(error: any): boolean {
    return error?.success === false && Boolean(error?.error?.code || error?.data?.error);
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
 * Convenience function matching atlas-admin-frontend pattern
 */
export const getApiErrorMessage = (error: any, fallback?: string): string => {
  return ErrorHandler.getErrorMessage(error, fallback);
};

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

export default ErrorHandler;
