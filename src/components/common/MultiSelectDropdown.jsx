"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import Checkbox from "./Checkbox";
import dropdownIcon from "@/assets/svg/dropdown-icon.svg";
import { useTranslation } from "react-i18next";

const MultiSelectDropdown = ({
  options = [],
  selectedValues = [],
  onChange,
  disabled = false,
  placeholder = "--Select--",
  className = "",
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  const matches = (a, b) => String(a) === String(b);

  const displayPlaceholder = useMemo(() => {
    return placeholder === "--Select--" ? t("filter.select") : placeholder;
  }, [placeholder, t]);

  const displayLabel = useMemo(() => {
    if (selectedValues.length === 0) return displayPlaceholder;
    if (selectedValues.length === 1) {
      const option = options.find((opt) => matches(opt.value, selectedValues[0]));
      return option ? option.label : displayPlaceholder;
    }
    return t("filter.selectedCount", { count: selectedValues.length });
  }, [selectedValues, options, displayPlaceholder, t]);

  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    return options.filter((opt) => opt.label.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [options, searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
    if (!isOpen) {
      setSearchTerm("");
    }
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className={`relative w-full ${className}`}>
      <div
        onClick={() => {
          if (!disabled && !isOpen) {
            setIsOpen(true);
          }
        }}
        className={`
          w-full h-8 px-[10px] py-0 flex items-center justify-between
          bg-white border border-[#E0E2E7] rounded-[6px]
          font-lato font-normal text-[12px] leading-[150%]
          ${disabled ? "text-[#B5BBC5] cursor-not-allowed bg-gray-50" : "text-[#111827] cursor-pointer"}
        `}>
        <div className="flex items-center gap-2 overflow-hidden w-full h-full">
          {isOpen ? (
            <input
              ref={inputRef}
              type="text"
              className="w-full bg-transparent outline-none border-none p-0 h-full text-[#111827] placeholder:text-[#B5BBC5]"
              placeholder={displayLabel}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="truncate">{displayLabel}</span>
          )}
        </div>
        <Image
          src={dropdownIcon}
          alt="dropdown"
          width={16}
          height={16}
          className={`transition-transform duration-200 flex-shrink-0 ${isOpen ? "rotate-180" : ""}`}
          onClick={(e) => {
            if (isOpen) {
              e.stopPropagation();
              setIsOpen(false);
            }
          }}
        />
      </div>

      {isOpen && !disabled && (
        <div
          className="absolute z-50 w-full bg-white border border-[#E5E7EB] rounded-b-[6px] shadow-lg"
          style={{
            top: "32px",
            left: "0px",
            filter: "drop-shadow(0px 4px 16px rgba(0, 0, 0, 0.1))",
            maxHeight: "200px",
            overflowY: "auto",
          }}>
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => {
              const isSelected = selectedValues.some((v) => matches(v, option.value));
              return (
                <div
                  key={option.value}
                  onClick={() => onChange(option.value)}
                  className="flex items-center px-4 py-[10px] bg-white border-b border-[#E3E7EF] cursor-pointer hover:bg-gray-50"
                  style={{
                    height: "36px",
                    gap: "12px",
                  }}>
                  <Checkbox checked={isSelected} onChange={() => {}} />
                  <span className="font-lato font-normal text-[12px] leading-[14px] text-[#465466] truncate">
                    {option.label}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="flex items-center justify-center h-8 text-gray-400 text-[10px]">{t("filter.noResults")}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default MultiSelectDropdown;
