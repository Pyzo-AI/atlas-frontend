import { isRejectedWithValue } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import { getApiErrorMessage } from "@/utils/errorHandler";

/**
 * Catches every RTK Query rejection across all API slices in one place,
 * instead of each call site handling status codes individually (most
 * currently don't — a 403 is either silently swallowed or shown as a
 * generic page-level error with no user feedback).
 */
export const rtkQueryErrorMiddleware = () => (next) => (action) => {
  if (isRejectedWithValue(action)) {
    const status = action.payload?.status;
    if (status === 403) {
      // A page load can fire several parallel requests that all 403 at
      // once (e.g. certificates + notifications + config) — a fixed
      // toastId collapses those into a single visible toast instead of
      // stacking one per request.
      toast.error(
        getApiErrorMessage(
          action.payload,
          "You don't have the required permission to perform this action."
        ),
        { toastId: "permission-denied-403" }
      );
    }
  }
  return next(action);
};

export default rtkQueryErrorMiddleware;
