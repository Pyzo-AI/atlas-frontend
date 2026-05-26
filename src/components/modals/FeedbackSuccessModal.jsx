"use client";

import React from "react";
import { useLocalizedRouter } from "@/hooks/useLocalizedRouter";
import { useTranslation } from "react-i18next";
import Modal from "@/components/common/Modal";
import feedback_success_image from "@/assets/svg/feedback_success.svg";
import Image from "next/image";

export default function FeedbackSuccessModal({ isOpen, onClose }) {
  const router = useLocalizedRouter();
  const { t } = useTranslation();

  const handleClose = () => {
    onClose();
    // Remove the success parameter from URL and redirect to home
    router.push("/");
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      closeOnOverlayClick={true}
      closeOnEscape={true}
      size="md"
      className="overflow-hidden mx-4 sm:mx-0 rounded-3xl"
      showCloseButton={true}>
      <div className="p-8 bg-white text-center">
        {/* Success Icon */}
        <div className="w-24 h-24 mx-auto">
          <div className="relative w-full h-full">
            <Image src={feedback_success_image} alt="Success" className="w-20 h-20" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-gray-900">Rating Submitted</h2>

        {/* Message */}
        <p className="text-gray-600 mb-8">Thank you! Your feedback has been recorded.</p>

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="cursor-pointer w-2/3 bg-accent hover:bg-accent-hover text-light py-2 rounded-4xl font-semibold text-lg transition-all duration-200 shadow-lg">
          Close
        </button>
      </div>
    </Modal>
  );
}
