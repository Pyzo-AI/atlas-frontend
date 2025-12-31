import React from "react";

const InputField = ({
  id,
  name,
  type = "text",
  label,
  placeholder,
  value,
  onChange,
  required = false,
  autoComplete,
  className = "",
  labelClassName = "",
  inputClassName = "",
  rightIcon,
  onRightIconClick,
  ...props
}) => {
  const defaultInputClass =
    "w-full h-11 sm:h-[44px] bg-white border border-border-light rounded-[11px] px-3 py-2 sm:py-[9px] text-base sm:text-[14px] font-lato font-normal leading-tight sm:leading-[17px] text-black placeholder:text-text-placeholder focus:outline-none focus:border-primary transition-colors";
  const defaultLabelClass =
    "text-sm sm:text-[16px] font-lato font-semibold leading-tight sm:leading-[19px] text-primary-text";

  return (
    <div className={`flex flex-col gap-[11px] ${className}`}>
      {label && (
        <label htmlFor={id} className={labelClassName || defaultLabelClass}>
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          name={name}
          type={type}
          autoComplete={autoComplete}
          required={required}
          className={`${defaultInputClass} ${rightIcon ? "pr-12" : ""} ${inputClassName}`}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          {...props}
        />
        {rightIcon && (
          <button
            type="button"
            className="cursor-pointer absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 flex items-center justify-center"
            onClick={onRightIconClick}>
            {rightIcon}
          </button>
        )}
      </div>
    </div>
  );
};

export default InputField;
