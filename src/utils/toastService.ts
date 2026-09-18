/**
 * Centralized toast notification service
 * Handles error toasts with standardized error messages
 */

import { showToast } from './toast';
import { getApiErrorMessage } from './errorHandler';

export const toastService = {
  /**
   * Show error toast with automatic message extraction
   */
  showError: (error: any, fallback?: string) => {
    const message = getApiErrorMessage(error, fallback);
    showToast.error(message);
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
