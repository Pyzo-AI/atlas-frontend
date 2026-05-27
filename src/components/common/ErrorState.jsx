"use client";
import Image from "next/image";
import ErrorWarningIcon from "@/assets/svg/error_warning.svg";
import { useTranslation } from "react-i18next";

export default function ErrorState({ 
  message, 
  onRetry 
}) {
  const { t } = useTranslation();
  const displayMessage = message || t("common.somethingWentWrong");

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="text-center">
        <Image
          src={ErrorWarningIcon}
          alt="Error warning"
          className="mx-auto h-12 w-12 mb-4"
        />
        <h3 className="text-lg font-medium text-gray-900 mb-2">{t("common.errorLoadingData")}</h3>
        <p className="text-sm text-gray-500 mb-4">{displayMessage}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50"
          >
            {t("common.tryAgain")}
          </button>
        )}
      </div>
    </div>
  );
}