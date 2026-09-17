"use client";

import React from "react";
import Image from "next/image";
import Modal from "@/components/common/Modal";
import { LuLogOut } from "react-icons/lu";
import spinner from "@/assets/svg/spinner.svg";
import { useTranslation } from "react-i18next";

// Ported from pyzo-central-frontend's LogoutModal.tsx (copy, icon, spinner
// button) so logout looks and feels identical across PYZO product frontends.
const LogoutModal = ({ isOpen, onClose, onConfirm, isLoggingOut = false }) => {
  const { t } = useTranslation();
  return (
    <Modal
      isOpen={isOpen}
      onClose={isLoggingOut ? () => {} : onClose}
      size="custom"
      className="!p-0 !bg-transparent shadow-none"
      showCloseButton={false}
      closeOnOverlayClick={!isLoggingOut}
      closeOnEscape={!isLoggingOut}>
      <div className="max-w-[448px] w-full bg-white rounded-[16px] p-6 flex flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-5 w-full">
          <div className="w-16 h-16 bg-[#FCEEED] rounded-full flex items-center justify-center shrink-0">
            <LuLogOut size={22} className="text-[#F04638]" />
          </div>

          <div className="flex flex-col items-center gap-2 text-center w-full">
            <h2 className="font-lato font-bold text-[20px] leading-[100%] text-[#1A1C29]">{t("auth.logOutTitle")}</h2>
            <p className="font-lato font-normal text-[14px] leading-[19px] text-[rgba(26,28,41,0.8)] w-full">
              {t("auth.logOutDesc")}
            </p>
          </div>
        </div>

        <div className="flex flex-row items-center gap-[17px]">
          <button
            onClick={onClose}
            disabled={isLoggingOut}
            className="w-[136px] min-w-[136px] h-[30px] px-3 py-[7px] flex items-center justify-center border border-[#2877EE] rounded-[6px] text-[#2877EE] text-[12px] font-semibold hover:bg-[#ECF3FF] transition-colors cursor-pointer bg-white disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white">
            {t("auth.cancel")}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoggingOut}
            className="flex flex-row justify-center items-center py-[7px] px-[12px] gap-[6px] w-[136px] min-w-[136px] h-[30px] bg-[#E25247] rounded-[6px] transition-colors hover:bg-[#D6453A] cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:bg-[#E25247]">
            {isLoggingOut && (
              <Image src={spinner} alt="" width={14} height={14} className="animate-spin" style={{ animationDuration: "1.4s" }} unoptimized />
            )}
            <span className="font-lato font-medium text-[14px] leading-[17px] text-white">
              {isLoggingOut ? t("auth.loggingOut") : t("auth.logOutButton")}
            </span>
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default LogoutModal;
