import React from "react";
import { useTranslation } from "react-i18next";

const EmailInput = ({ value, onChange, error, placeholder = "abc@gmail.com" }) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-2">
      <label className="font-medium text-[16px] leading-[19px] text-[#111827]">{t("auth.email")}</label>
      <div className="flex flex-col gap-1">
        <div
          className={`w-full h-[44px] bg-white border rounded-[10px] flex items-center px-3 transition-colors ${
            error ? "border-[#F04638] focus-within:border-[#F04638]" : "border-[#E5E7EB] focus-within:border-[#2877EE]"
          }`}>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-transparent outline-none font-normal text-[14px] leading-[17px] text-black placeholder:text-black/50 autofill:shadow-[inset_0_0_0px_1000px_white]"
          />
        </div>
        {error && <span className="text-[12px] leading-[14px] text-[#F04638]">{error}</span>}
      </div>
    </div>
  );
};

export default EmailInput;
