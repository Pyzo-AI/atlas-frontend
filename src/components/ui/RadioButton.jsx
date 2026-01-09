import React from "react";

const RadioButton = ({ name, value, checked, onChange, className = "", ...props }) => {
  return (
    <input
      type="radio"
      name={name}
      value={value}
      checked={checked}
      onChange={onChange}
      className={`mt-0.5 mr-2 sm:mr-3 w-3 h-3 sm:w-4 sm:h-4 text-accent accent-accent ${className}`}
      style={{
        accentColor: "var(--color-accent)",
      }}
      {...props}
    />
  );
};

export default RadioButton;
