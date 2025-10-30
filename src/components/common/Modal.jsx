"use client";

import { useEffect } from "react";

export default function Modal({
  isOpen,
  onClose,
  children,
  className = "",
  overlayClassName = "",
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = false,
  size = "md" // xs, sm, md, lg, xl, full
}) {
  // Handle escape key and body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e) => {
        if (e.key === 'Escape' && closeOnEscape) {
          onClose?.();
        }
      };

      document.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = 'unset';
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, closeOnEscape, onClose]);

  // Handle overlay click
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose?.();
    }
  };

  if (!isOpen) return null;

  // Size classes
  const sizeClasses = {
    xs: "max-w-xs w-full",
    sm: "max-w-sm w-full",
    md: "max-w-md w-full",
    lg: "max-w-lg w-full",
    xl: "max-w-xl w-full",
    "2xl": "max-w-2xl w-full",
    "3xl": "max-w-3xl w-full",
    "4xl": "max-w-4xl w-full",
    full: "w-full h-full"
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with blur effect */}
      <div
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm ${overlayClassName}`}
        onClick={handleOverlayClick}
      />

      {/* Modal Content */}
      <div className={`relative bg-white rounded-lg shadow-xl ${sizeClasses[size]} ${className}`}>
        {/* Close button */}
        {showCloseButton && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg
              className="w-5 h-5 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}

        {/* Modal content */}
        {children}
      </div>
    </div>
  );
}