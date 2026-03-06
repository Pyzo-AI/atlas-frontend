"use client";

import React from "react";

const Checkbox = ({ checked, onChange, disabled = false }) => {
  return (
    <div
      className={`relative flex-none ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
      style={{ width: "16px", height: "16px" }}
      onClick={disabled ? undefined : onChange}>
      <div
        className="absolute inset-0"
        style={{
          background: disabled ? "#F3F4F6" : checked ? "#2762EA" : "#FFFFFF",
          border: `1px solid ${disabled ? "#D1D5DB" : checked ? "#2762EA" : "#E8E8E8"}`,
          borderRadius: "4px",
          boxSizing: "border-box",
          transition: "all 0.2s ease",
          opacity: disabled ? 0.7 : 1,
        }}
      />

      {checked && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none" style={{ marginTop: "1px" }}>
            <path
              d="M1 4L3.5 6.5L9 1"
              stroke="#FFFFFF"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
    </div>
  );
};

export default Checkbox;
