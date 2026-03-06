"use client";

import React from "react";

export default function SearchBar({
  searchTerm,
  onSearchChange,
  placeholder = "Search by certificate name",
  disabled = false,
}) {
  return (
    <div
      className={`relative w-[320px] h-[30px] bg-white border border-[#E5E7EB] rounded-[6px] overflow-hidden ${disabled ? "opacity-60" : ""}`}>
      <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-[6px] pointer-events-none">
        <svg className="w-3 h-3 text-[#4B5563]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      </div>
      <input
        type="text"
        disabled={disabled}
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className={`w-full h-full pl-[26px] pr-3 border-none bg-transparent outline-none font-lato font-normal !text-[12px] leading-[14px] text-[#111827] placeholder:!text-[rgba(75,85,99,0.6)] transition-all duration-200 ${
          disabled ? "cursor-not-allowed" : "cursor-text"
        }`}
        placeholder={placeholder}
      />
    </div>
  );
}
