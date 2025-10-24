"use client";

import { useRouter } from "next/navigation";
import Modal from "@/components/common/Modal";

export default function FeedbackSuccessModal({ isOpen, onClose }) {
  const router = useRouter();

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
            {/* Outer circle */}
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              {/* Inner circle */}
              <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center">
                {/* Checkmark */}
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-gray-900">Rating Submitted</h2>

        {/* Message */}
        <p className="text-gray-600 mb-8">Thank you! Your feedback has been recorded.</p>

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="w-2/3 bg-[#744FFF] hover:bg-[#6B46E5] text-white py-2 rounded-4xl font-semibold text-lg transition-all duration-200 shadow-lg">
          Close
        </button>
      </div>
    </Modal>
  );
}
