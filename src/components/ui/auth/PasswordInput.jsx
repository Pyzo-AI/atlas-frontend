import React, { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useTranslation } from "react-i18next";

const PasswordInput = ({ value, onChange, error, placeholder = "***************", labelKey = "auth.newPassword" }) => {
  const [showPassword, setShowPassword] = useState(false);
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-2">
      <label className="font-medium text-[16px] leading-[19px] text-[#111827]">{t(labelKey)}</label>
      <div className="flex flex-col gap-1">
        <div
          className={`relative w-full h-[44px] bg-white border rounded-[10px] flex items-center px-3 transition-colors ${
            error ? "border-[#F04638] focus-within:border-[#F04638]" : "border-[#E5E7EB] focus-within:border-[#2877EE]"
          }`}>
          <input
            type={showPassword ? "text" : "password"}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={`flex-1 bg-transparent outline-none font-normal text-black placeholder:text-black/50 autofill:shadow-[inset_0_0_0px_1000px_white] ${
              !showPassword
                ? `text-[21px] tracking-[2px] placeholder:text-[14px] ${value ? "-translate-y-[0.5px]" : "-translate-y-[-3px]"}`
                : `text-[14px] ${value ? "" : "-translate-y-[-4px]"}`
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="flex items-center justify-center p-1">
            {showPassword ? (
              <FiEye className="w-5 h-5 text-[#111827]" />
            ) : (
              <FiEyeOff className="w-5 h-5 text-[#111827]" />
            )}
          </button>
        </div>
        {error && <span className="text-[12px] leading-[14px] text-[#F04638]">{error}</span>}
      </div>
    </div>
  );
};

export default PasswordInput;
