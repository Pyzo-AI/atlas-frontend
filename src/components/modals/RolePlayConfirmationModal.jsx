"use client";

import React from "react";
import Modal from "@/components/common/Modal";

export default function RolePlayConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={isLoading ? () => {} : onClose}
      closeOnOverlayClick={!isLoading}
      closeOnEscape={!isLoading}
      size="sm"
      className="overflow-hidden mx-4 sm:mx-0 rounded-xl shadow-xl"
    >
      <div className="p-4 sm:p-5 bg-white flex flex-col items-center text-center">
        {/* Compact Icon Badge */}
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#EFF6FF] border border-[#DBEAFE] text-[#2762EA] flex items-center justify-center mb-2.5 shrink-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4 sm:w-5 sm:h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" x2="12" y1="19" y2="22" />
          </svg>
        </div>

        {/* Title */}
        <h3 className="font-lato font-bold text-sm sm:text-base text-[#111827] mb-1">
          Ready to start your assessment?
        </h3>

        {/* Preparation Subtext */}
        <p className="font-lato text-[11px] sm:text-xs text-[#667085] max-w-xs mb-3 leading-snug">
          Please ensure you are in a quiet environment with your microphone connected and ready.
        </p>

        {/* Compact Notice Callout Box */}
        <div className="w-full bg-[#FFFBEB] border border-[#FDE68A] rounded-lg p-2 sm:p-2.5 mb-4 text-left flex items-start gap-2">
          <div className="w-4 h-4 rounded-full bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0 mt-0.5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="9"
              height="9"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-lato font-semibold text-[11px] sm:text-xs text-[#92400E] leading-tight">
              30-Minute Lock Period
            </h4>
            <p className="font-lato text-[10px] sm:text-[11px] text-[#B45309] mt-0.5 leading-tight">
              Once started, this assessment will remain locked for 30 minutes while in progress.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-2.5 w-full">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-1.5 sm:py-2 px-3 rounded-lg text-xs font-medium text-[#374151] bg-[#F3F4F6] hover:bg-[#E5E7EB] border border-[#E5E7EB] transition-all disabled:opacity-50 cursor-pointer"
          >
            Not Now
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 py-1.5 sm:py-2 px-3 rounded-lg text-xs font-semibold text-white bg-[#2762EA] hover:bg-[#1E4FD9] shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {isLoading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Starting...</span>
              </>
            ) : (
              <span>Start Assessment</span>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
