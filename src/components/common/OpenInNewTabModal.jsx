"use client";

import React from "react";
import { LuExternalLink } from "react-icons/lu";
import Modal from "./Modal";
import PrimaryButton from "./PrimaryButton";
import SecondaryButton from "./SecondaryButton";

/**
 * Confirms navigating away to another PYZO tool, ported from
 * pyzo-central-frontend's OpenInNewTabModal.tsx (adapted to this app's own
 * Modal/PrimaryButton/SecondaryButton instead of Central's equivalents).
 */
const OpenInNewTabModal = ({ isOpen, onClose, onConfirm }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="custom" className="!p-0 !bg-transparent shadow-none">
      <div className="flex flex-col items-stretch w-[400px] max-w-full p-6 gap-6 bg-white rounded-[12px]">
        <div className="flex justify-center w-full">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-[#E9F2FE]">
            <LuExternalLink className="w-8 h-8 text-[#2877EE]" />
          </div>
        </div>

        <div className="flex flex-col items-stretch gap-2 w-full">
          <h3 className="font-lato font-bold text-[18px] leading-[22px] text-center text-[#1A1C29]">Open in New Tab</h3>
          <p className="font-lato font-normal text-[12px] leading-[1.5] text-center text-[#1A1C29]/80">
            This tool will open in a separate browser tab. You can return here anytime.
          </p>
        </div>

        <div className="flex items-stretch gap-3 w-full">
          <SecondaryButton className="!flex-1 !h-[30px] !text-[12px] !font-semibold !rounded-[6px]" onClick={onClose}>
            Cancel
          </SecondaryButton>
          <PrimaryButton
            className="!flex-1 !h-[30px] !text-[12px] !font-semibold !rounded-[6px]"
            onClick={() => {
              onConfirm();
              onClose();
            }}>
            Continue
          </PrimaryButton>
        </div>
      </div>
    </Modal>
  );
};

export default OpenInNewTabModal;
