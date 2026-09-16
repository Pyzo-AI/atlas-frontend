"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import dropdownIcon from "@/assets/svg/dropdown-icon.svg";
import { useOverlayTransition } from "@/hooks/useOverlayTransition";

const OPTION_ROW_HEIGHT = 30;

/**
 * "Status: X ▾" style quick-filter pill, ported from pyzo-central-frontend's
 * QuickFilter.tsx so filter dropdowns look identical across the pyzo.ai suite.
 */
export default function QuickFilter({
  value,
  onChange,
  options,
  placeholder,
  width,
  className = "",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { shouldRender, transitionStyle, dropdownTransitionClassName } = useOverlayTransition(isOpen, false);

  const selectedOption = useMemo(() => options.find((opt) => opt.id === value), [options, value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (optionId) => {
    onChange(optionId);
    setIsOpen(false);
  };

  const displayLabel = selectedOption ? `${placeholder.split(":")[0]}: ${selectedOption.label}` : placeholder;

  return (
    <div ref={dropdownRef} className={`relative inline-block ${className}`} style={{ minWidth: width || "auto" }}>
      <div
        className={`w-full min-w-max px-3 border rounded-[6px] flex items-center justify-between transition-colors duration-200 cursor-pointer gap-2 ${
          isOpen ? "border-[#2877EE] bg-white" : "border-[#E5E7EB] bg-white hover:bg-[#F9F9F9]"
        }`}
        style={{ height: "30px" }}
        onClick={() => setIsOpen((o) => !o)}
        role="combobox"
        aria-expanded={isOpen}>
        <div className="flex items-center overflow-hidden h-full flex-1">
          <span className="whitespace-nowrap font-lato text-[12px] leading-[16px] font-normal" style={{ color: "#667085" }}>
            {displayLabel}
          </span>
        </div>
        <Image
          src={dropdownIcon}
          alt="dropdown"
          width={16}
          height={16}
          className={`transition-transform duration-200 flex-shrink-0 ${isOpen ? "rotate-180" : ""}`}
        />
      </div>

      {shouldRender && (
        <div
          className={`absolute left-0 w-full origin-top bg-white border border-[#E0E2E7] rounded-[6px] shadow-lg z-50 mt-1 flex flex-col ${dropdownTransitionClassName}`}
          style={transitionStyle}>
          <div className="overflow-y-auto" style={{ maxHeight: options.length * OPTION_ROW_HEIGHT }}>
            {options.map((option, index) => {
              const isSelected = option.id === value;
              return (
                <div
                  key={option.id}
                  className={`px-3 flex items-center font-lato text-[12px] ${
                    isSelected ? "text-[#667085] cursor-not-allowed bg-[#F9F9FC]" : "text-[#111827] hover:bg-gray-50 cursor-pointer"
                  } ${index < options.length - 1 ? "border-b border-[#E3E7EF]" : ""}`}
                  style={{ height: OPTION_ROW_HEIGHT }}
                  onClick={() => {
                    if (!isSelected) handleSelect(option.id);
                  }}>
                  <span className="truncate">{option.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
