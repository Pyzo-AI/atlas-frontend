/**
 * Centralized toast notification service
 * Handles error toasts with standardized error messages
 */

import { toast } from 'react-toastify';
import { getApiErrorMessage } from './errorHandler';

export const toastService = {
  /**
   * Show error toast with automatic message extraction
   */
  showError: (error: any, fallback?: string) => {
    const message = getApiErrorMessage(error, fallback);
    toast.error(message, {
      autoClose: 5000,
    });
  },

  /**
   * Show success toast
   */
  showSuccess: (message: string = 'Operation completed successfully') => {
    toast.success(message, { autoClose: 3000 });
  },

  /**
   * Show info toast
   */
  showInfo: (message: string) => {
    toast.info(message, { autoClose: 3000 });
  },

  /**
   * Show warning toast
   */
  showWarning: (message: string) => {
    toast.warning(message, { autoClose: 4000 });
  },

  /**
   * Show loading toast (return close function)
   */
  showLoading: (message: string) => {
    return toast.loading(message);
  },

  /**
   * Dismiss specific toast
   */
  dismiss: (toastId: string | number) => {
    toast.dismiss(toastId);
  },

  /**
   * Dismiss all toasts
   */
  dismissAll: () => {
    toast.dismiss();
  },
};

/**
 * Hook for using toast service
 */
export const useToast = () => toastService;

export default toastService;
