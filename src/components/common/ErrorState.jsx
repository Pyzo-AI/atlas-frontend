"use client";
import Image from "next/image";
import ErrorConnectionIcon from "@/assets/svg/error-connection.svg";
import { useTranslation } from "react-i18next";

export default function ErrorState({
  message,
  onRetry
}) {
  const { t } = useTranslation();
  const displayMessage = message || t("common.somethingWentWrong");

  return (
    <div className="flex items-center justify-center px-4 min-h-[calc(100vh-45px)] bg-[#F9FAFB]">
      <div className="flex flex-col items-center gap-6 w-full max-w-[396px]">
        <Image
          src={ErrorConnectionIcon}
          alt=""
          className="w-[124px] h-[102px]"
        />
        <div className="flex flex-col items-center gap-2 w-full">
          <h3 className="font-lato font-bold text-base text-[#111827] text-center">{t("common.errorLoadingData")}</h3>
          <p className="font-lato text-xs leading-[18px] text-[#4B5563] text-center">{displayMessage}</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center justify-center px-4 py-[7px] border border-[#2762EA] rounded-md text-xs font-semibold text-[#2762EA] font-lato hover:bg-[#2762EA]/5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50"
          >
            {t("common.tryAgain")}
          </button>
        )}
      </div>
    </div>
  );
}
