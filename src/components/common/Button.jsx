// Button.jsx
import React from "react";

const Button = ({
  children,
  onClick,
  disabled = false,
  variant = "primary",
  type = "button",
  className = "",
  ...props
}) => {
  const baseClasses = "px-4 py-2 rounded-[8px] font-lato font-medium transition-colors";

  const variantClasses = {
    primary: disabled
      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
      : "bg-accent text-light hover:bg-accent-hover cursor-pointer",
    secondary: disabled
      ? "border border-gray-300 text-gray-400 cursor-not-allowed bg-gray-50"
      : "border border-border-light text-text-muted hover:bg-gray-50 cursor-pointer bg-white",
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${className}`;

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={classes} {...props}>
      {children}
    </button>
  );
};

export default Button;
