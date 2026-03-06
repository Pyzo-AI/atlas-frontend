"use client";

import React from "react";
import Modal from "./Modal";
import Image from "next/image";

export default function CertificatePreviewModal({ isOpen, onClose, imageUrl, title, onDownload }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="custom"
      className="w-[697px] h-[566px] bg-white rounded-[16px] shadow-xl overflow-hidden">
      <div className="flex flex-col w-full h-full">
        {/* Certificate Container */}
        <div className="w-[697px] h-[504px] bg-[#E5EAEF] flex items-center justify-center p-5">
          <div className="w-[657px] h-[464.28px] bg-white shadow-sm overflow-hidden relative">
            <Image src={imageUrl} alt={title} fill className="object-contain" priority />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex-1 flex items-center justify-center bg-white px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="w-[137px] h-[30px] bg-[#E8F0F9] rounded-[6px] flex items-center justify-center cursor-pointer font-lato font-medium text-[12px] text-[#2762EA] hover:bg-[#dbeafe] transition-colors">
              Close
            </button>
            <button
              onClick={onDownload}
              className="w-[137px] h-[30px] bg-[#2762EA] rounded-[6px] flex items-center justify-center cursor-pointer font-lato font-medium text-[12px] text-white hover:bg-primary-hover transition-colors">
              Download Certificate
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
