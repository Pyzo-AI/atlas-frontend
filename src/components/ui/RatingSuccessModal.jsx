import React from "react";
import rating_success from "@/assets/svg/rating_success.svg";
import close_icon from "@/assets/svg/close.svg";
import Image from "next/image";

const RatingSuccessModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full md:w-[420px] mx-4 md:mx-0">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="cursor-pointer absolute top-4 right-4 w-6 h-6 "
        >
          <Image src={close_icon} alt="Close" width={24} height={24} />
        </button>

        {/* Content */}
        <div className="flex flex-col items-center px-8 py-8 gap-5">
          <div className="flex flex-col items-center gap-8 w-full">
            {/* Icon and Text Section */}
            <div className="flex flex-col items-center gap-5">
              {/* Success Icon */}
              <Image
                src={rating_success}
                alt="Rating Success"
                width={80}
                height={80}
              />

              {/* Text Content */}
              <div className="flex flex-col items-center gap-2 text-center">
                <h2 className="font-lato font-bold text-2xl text-[#1A1C29] leading-[100%] tracking-[0%]">
                  Rating Submitted
                </h2>

                <p className="font-lato font-normal text-base text-[#1A1C29CC] leading-[100%] tracking-[0%]">
                  Thank you! Your feedback has been recorded.
                </p>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="cursor-pointer bg-[#744FFF] hover:bg-[#5F3FCC] text-white font-semibold text-base px-16 py-3 rounded-full transition-colors min-w-[219px] h-10 flex items-center justify-center"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RatingSuccessModal;
