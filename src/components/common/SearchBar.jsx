"use client";

import React, { useState, useEffect, useRef } from "react";

/**
 * Ported from pyzo-central-frontend's SearchBar.tsx so search inputs look and
 * behave identically across the pyzo.ai suite (icon, spacing, debounce).
 */
export default function SearchBar({
  initialValue = "",
  onSearchChange,
  placeholder = "Search by Name",
  disabled = false,
  width = "260px",
  height = "30px",
  debounceMs = 500,
  className = "",
}) {
  const [value, setValue] = useState(initialValue);
  const isInitialMount = useRef(true);

  // Keep track of the latest callback to avoid re-triggering the effect
  // when the parent re-renders and passes a new function reference
  const onSearchChangeRef = useRef(onSearchChange);
  useEffect(() => {
    onSearchChangeRef.current = onSearchChange;
  }, [onSearchChange]);

  // Sync internal state with external initialValue change (e.g. on URL reset)
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const handler = setTimeout(() => {
      onSearchChangeRef.current(value);
    }, debounceMs);

    return () => clearTimeout(handler);
  }, [value, debounceMs]);

  return (
    <div className={`relative ${disabled ? "opacity-60" : ""} ${className}`} style={{ width, height }}>
      <svg
        className="absolute left-2 top-1/2 transform -translate-y-1/2 w-[14px] h-[14px] pointer-events-none"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#4B5563"
        strokeWidth="2">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
      <input
        type="text"
        disabled={disabled}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className={`w-full h-full pl-7 pr-3 font-lato text-[12px] leading-[14px] font-normal text-[#4B5563] border border-[#E5E7EB] rounded-[6px] outline-none placeholder:text-[rgba(75,85,99,0.6)] transition-colors duration-200 focus:border-[#2877EE] ${
          disabled ? "bg-gray-50 cursor-not-allowed" : "bg-white hover:bg-[#F9F9F9] focus:bg-white focus:hover:bg-white"
        }`}
        placeholder={placeholder}
      />
    </div>
  );
}
