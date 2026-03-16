import React from "react";

const PrimaryButton = ({
  children,
  onClick,
  className = "",
  disabled = false,
  type = "button",
  height = "25px",
  ...props
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center gap-1 bg-primary rounded-md font-lato font-medium text-[11px] leading-[13px] text-white hover:bg-primary-hover transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      style={{ height, ...props.style }}
      {...props}>
      {children}
    </button>
  );
};

export default PrimaryButton;
