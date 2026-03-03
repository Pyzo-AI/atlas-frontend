"use client";

import React from "react";
import Modal from "@/components/common/Modal";
import { LuLogOut } from "react-icons/lu";
import Button from "@/components/common/Button";

const LogoutModal = ({ isOpen, onClose, onConfirm }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="custom"
      className="!p-0 !bg-transparent shadow-none"
      showCloseButton={false}>
      {/* Main Container - width: 440px, height: 244px, bg: #FFFFFF, radius: 16px, padding: 20px, gap: 20px */}
      <div className="w-[440px] h-[244px] bg-white rounded-[16px] p-5 flex flex-col items-center gap-5 animate-in fade-in zoom-in duration-300">
        {/* Frame 1686556268 - width: 400px, height: 204px */}
        <div className="w-[400px] h-[204px] flex flex-col items-center gap-6">
          {/* Frame 1686556267 - width: 400px, height: 204px, gap: 20px */}
          <div className="flex flex-col items-center gap-5 w-full">
            {/* Icon Circle - 64x64, bg: #FCEEED, radius: 94.8px */}
            <div className="w-16 h-16 bg-[#FCEEED] rounded-full flex items-center justify-center shrink-0">
              <LuLogOut size={32} className="text-[#F04638]" />
            </div>

            {/* Frame 1686556266 - Text Section, gap: 8px */}
            <div className="flex flex-col items-center gap-2 text-center w-full">
              {/* Title: Log Out? */}
              <h2 className="font-lato font-bold text-[20px] leading-[24px] text-[#1A1C29]">Log Out?</h2>
              {/* Body Text */}
              <p className="font-lato font-normal text-[14px] leading-[19px] text-[rgba(26, 28, 41, 0.8)] w-[400px]">
                Are you sure you want to log out? You’ll need to sign in again to continue.
              </p>
            </div>
          </div>

          {/* Action Buttons Frame - gap: 12px, height: 30px */}
          <div className="flex flex-row items-center gap-3 h-[30px]">
            {/* Cancel Button - bg: #E8F0F9, text: #2762EA, width: 67px, height: 30px */}
            <Button
              variant="secondary"
              onClick={onClose}
              className="!w-[67px] !h-[30px] !p-0 !bg-[#E8F0F9] !text-[#2762EA] !rounded-[6px] !border-none !text-[12px] !leading-[14px] flex items-center justify-center">
              Cancel
            </Button>
            {/* Log Out Button - bg: #F04638, text: #FFFFFF, width: 67px, height: 30px */}
            <Button
              variant="primary"
              onClick={onConfirm}
              className="!w-[67px] !h-[30px] !p-0 !bg-[#F04638] hover:!bg-[#D6453A] !text-white !rounded-[6px] !border-none !text-[12px] !leading-[14px] flex items-center justify-center">
              Log Out
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default LogoutModal;
