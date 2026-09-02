"use client";

import React from "react";
import Image from "next/image";
import Modal from "@/components/common/Modal";
import { LuLogOut } from "react-icons/lu";
import Button from "@/components/common/Button";
import spinner from "@/assets/svg/spinner.svg";
import { useTranslation } from "react-i18next";

const LogoutModal = ({ isOpen, onClose, onConfirm, isLoggingOut = false }) => {
  const { t } = useTranslation();
  return (
    <Modal
      isOpen={isOpen}
      // Once logout is in flight, ignore backdrop clicks — the confirm/cancel
      // buttons below are also disabled, so there's no way to interrupt it.
      onClose={isLoggingOut ? () => {} : onClose}
      size="custom"
      className="!p-0 !bg-transparent shadow-none"
      showCloseButton={false}>
      {/* Main Container */}
      <div className="max-w-[440px] w-full bg-white rounded-[16px] p-5 flex flex-col items-center gap-5 animate-in fade-in zoom-in duration-300">
        {/* Inner Content Frame */}
        <div className="w-full flex flex-col items-center gap-6">
          {/* Icon + Text */}
          <div className="flex flex-col items-center gap-5 w-full">
            {/* Icon Circle - 64x64, bg: #FCEEED */}
            <div className="w-16 h-16 bg-[#FCEEED] rounded-full flex items-center justify-center shrink-0">
              <LuLogOut size={32} className="text-[#F04638]" />
            </div>

            {/* Text Section */}
            <div className="flex flex-col items-center gap-2 text-center w-full">
              <h2 className="font-lato font-bold text-[20px] leading-[24px] text-[#1A1C29]">{t("auth.logOutTitle")}</h2>
              <p className="font-lato font-normal text-[14px] leading-[19px] text-[rgba(26,28,41,0.8)] w-full">
                {t("auth.logOutDesc")}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-row items-center gap-3 h-[30px]">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={isLoggingOut}
              className="!w-[67px] !h-[30px] !p-0 !bg-[#E8F0F9] !text-[#2762EA] !rounded-[6px] !border-none !text-[12px] !leading-[14px] flex items-center justify-center">
              {t("auth.cancel")}
            </Button>
            <Button
              variant="primary"
              onClick={onConfirm}
              disabled={isLoggingOut}
              className={`!h-[30px] !p-0 !bg-[#F04638] hover:!bg-[#D6453A] !text-white !rounded-[6px] !border-none !text-[12px] !leading-[14px] flex items-center justify-center gap-[6px] disabled:!opacity-70 ${isLoggingOut ? "!w-[110px]" : "!w-[67px]"}`}>
              {isLoggingOut && (
                <Image src={spinner} alt="" width={14} height={14} className="animate-spin" style={{ animationDuration: "1.4s" }} />
              )}
              {isLoggingOut ? t("header.signingOut") : t("auth.logOutButton")}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default LogoutModal;
