import React from "react";

// Ported from pyzo-central-frontend's FormInput.tsx (compact 32px labeled
// input used in its drawers/forms).
const FormInput = ({ label, value, onChange, type = "text", placeholder = "", error, className = "" }) => {
  return (
    <div className={`flex flex-col items-start gap-2 ${className}`}>
      <label className="font-lato text-[12px] font-bold leading-[16px] capitalize text-[#1D1F2C] w-full">{label}</label>
      <div className="flex flex-col gap-1 w-full">
        <div
          className={`w-full h-[32px] border rounded-[6px] flex items-center px-2 transition-colors duration-200 ${
            error
              ? "bg-white border-[#F04638] focus-within:border-[#F04638]"
              : "bg-white border-[#E5E7EB] hover:bg-[#F9F9F9] focus-within:bg-white focus-within:hover:bg-white focus-within:border-[#2877EE]"
          }`}>
          <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-transparent outline-none font-lato text-[12px] font-normal leading-[150%] text-black placeholder:text-[#858D9D]"
          />
        </div>
        {error && <span className="font-lato text-[12px] leading-[14px] text-[#F04638]">{error}</span>}
      </div>
    </div>
  );
};

export default FormInput;
