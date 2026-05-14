import React from "react";

const SecondaryButton = ({
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
      className={`flex items-center justify-center gap-1 border border-border-light rounded-md font-lato font-medium text-[11px] leading-[13px] text-primary hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      style={{ height, ...props.style }}
      {...props}>
      {children}
    </button>
  );
};

export default SecondaryButton;
