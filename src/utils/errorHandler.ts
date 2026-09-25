export const ACCESS_DENIED_MESSAGE = "You don't have access to perform this action.";

/**
 * True when an API error is a 403 (Forbidden) — RTK Query's
 * FetchBaseQueryError and apiClient's thrown object both carry `status`.
 */
export const isAccessDeniedError = (error: unknown): boolean =>
  !!error && typeof error === "object" && (error as { status?: unknown }).status === 403;

/**
 * Extract a user-facing error message from an API error. A 403 always shows
 * the same access-denied message regardless of the backend's prose.
 * Priority order:
 *  1. error.data.error.message  – standardized backend shape { success: false, error: { message } }
 *  2. error.data.message        – flat data message
 *  3. error.error.message       – top-level error object
 *  4. error.message             – plain JS Error / network error
 *  5. string error              – raw string
 *  6. Network / timeout codes
 *  7. fallback
 */
export const getApiErrorMessage = (error: any, fallback?: string): string => {
  if (isAccessDeniedError(error)) {
    return ACCESS_DENIED_MESSAGE;
  }

  if (!error) {
    return fallback || "Something went wrong. Please try again later.";
  }

  // 1. Standardized backend: { success: false, error: { message } }
  if (typeof error?.data?.error?.message === "string") {
    return error.data.error.message;
  }

  // 2. Flat data message
  if (typeof error?.data?.message === "string") {
    return error.data.message;
  }

  // 3. Top-level error object
  if (typeof error?.error?.message === "string") {
    return error.error.message;
  }
  if (typeof error?.error === "string") {
    return error.error;
  }

  // 4. Plain JS Error / network error
  if (typeof error?.message === "string") {
    if (error.message === "Network Error" || error.status === "FETCH_ERROR") {
      return "Network error. Please check your internet connection.";
    }
    return error.message;
  }

  // 5. Raw string
  if (typeof error === "string") {
    return error;
  }

  // 6. Network / timeout status codes
  if (error?.status === "FETCH_ERROR") {
    return "Network error. Please check your internet connection.";
  }
  if (error?.status === "PARSING_ERROR") {
    return "Server response error. Please try again.";
  }
  if (error?.code === "ECONNABORTED") {
    return "Request timeout. Please try again.";
  }

  return fallback || "Something went wrong. Please try again later.";
};

export default getApiErrorMessage;
