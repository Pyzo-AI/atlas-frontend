"use client";

import React from "react";
import Modal from "./Modal";
import Image from "next/image";
import { useTranslation } from "react-i18next";

export default function CertificatePreviewModal({ isOpen, onClose, imageUrl, title, onDownload }) {
  const { t } = useTranslation();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="custom"
      className="w-[95vw] md:w-[697px] h-auto bg-white rounded-[16px] shadow-xl overflow-hidden">
      <div className="flex flex-col w-full h-full">
        {/* Certificate Container */}
        <div className="w-full aspect-[697/504] bg-[#E5EAEF] flex items-center justify-center p-4 md:p-5">
          <div className="w-full h-full bg-white shadow-sm overflow-hidden relative">
            <Image src={imageUrl} alt={title} fill className="object-contain" priority />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex-1 flex items-center justify-center bg-white px-4 pt-3 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="w-[137px] h-[30px] bg-[#E8F0F9] rounded-[6px] flex items-center justify-center cursor-pointer font-lato font-medium text-[12px] text-[#2762EA] hover:bg-[#dbeafe] transition-colors">
              {t("certificates.close")}
            </button>
            <button
              onClick={onDownload}
              className="w-[137px] h-[30px] bg-[#2762EA] rounded-[6px] flex items-center justify-center cursor-pointer font-lato font-medium text-[12px] text-white hover:bg-primary-hover transition-colors">
              {t("certificates.downloadCertificate")}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
