import React from "react";

const TextArea = ({ value, onChange, placeholder, rows = 6, className = "", ...props }) => {
  const defaultClass =
    "w-full p-3 border border-gray-200 rounded-lg focus:border-accent focus:outline-none resize-none transition-colors duration-200";

  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className={`${defaultClass} ${className}`}
      {...props}
    />
  );
};

export default TextArea;
