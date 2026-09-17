"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { IoClose } from "react-icons/io5";
import { useOverlayTransition } from "@/hooks/useOverlayTransition";

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
  const { shouldRender, transitionStyle, backdropTransitionClassName, modalTransitionClassName } = useOverlayTransition(isOpen);

  // Escape key handling — body scroll lock is already handled by useOverlayTransition.
  useEffect(() => {
    if (!shouldRender) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && closeOnEscape) {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shouldRender, closeOnEscape, onClose]);

  // Handle overlay click
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose?.();
    }
  };

  if (!shouldRender) return null;

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
    full: "w-full h-full",
    custom: "" // No size constraints for custom sizing
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
      {/* Backdrop with blur effect */}
      <div
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm ${backdropTransitionClassName} ${overlayClassName}`}
        style={transitionStyle}
        onClick={handleOverlayClick}
      />

      {/* Modal Content */}
      <div
        className={`relative ${size === 'custom' ? '' : 'bg-white rounded-lg shadow-xl'} ${sizeClasses[size]} ${modalTransitionClassName} ${className}`}
        style={transitionStyle}>
        {/* Close button */}
        {showCloseButton && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <IoClose className="w-5 h-5 text-gray-500" />
          </button>
        )}

        {/* Modal content */}
        {children}
      </div>
    </div>,
    document.body
  );
}
