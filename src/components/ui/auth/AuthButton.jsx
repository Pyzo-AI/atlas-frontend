import React from "react";

const AuthButton = ({
  title,
  loadingTitle,
  isLoading = false,
  type = "submit",
  disabled = false,
  onClick,
  className = "",
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`w-full h-[44px] bg-[#2762EA] rounded-[10px] flex items-center justify-center transition-opacity hover:opacity-90 disabled:opacity-50 ${className}`}>
      <span className="font-semibold text-[16px] leading-[19px] text-white">
        {isLoading ? loadingTitle || title : title}
      </span>
    </button>
  );
};

export default AuthButton;
