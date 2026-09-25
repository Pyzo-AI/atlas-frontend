/**
 * Centralized toast notification service
 * Handles error toasts with standardized error messages
 */

import { showToast } from './toast';
import { getApiErrorMessage, isAccessDeniedError } from './errorHandler';

export const toastService = {
  /**
   * Show error toast with automatic message extraction. A 403 shows an
   * "Access Denied" heading with the shared access-denied message as its
   * description, matching Pyzo Central and Compass.
   */
  showError: (error: any, fallback?: string) => {
    const message = getApiErrorMessage(error, fallback);
    if (isAccessDeniedError(error)) {
      showToast.error('Access Denied', message);
    } else {
      showToast.error(message);
    }
  },

  /**
   * Show success toast
   */
  showSuccess: (message: string = 'Operation completed successfully') => {
    showToast.success(message);
  },

  /**
   * Show info toast
   */
  showInfo: (message: string) => {
    showToast.info(message);
  },

  /**
   * Show warning toast
   */
  showWarning: (message: string) => {
    showToast.warning(message);
  },
};

/**
 * Hook for using toast service
 */
export const useToast = () => toastService;

export default toastService;
