"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { LuChevronDown, LuSearch } from "react-icons/lu";
import { useTranslation } from "react-i18next";
import { COUNTRY_CODES } from "@/utils/countryCodes";
import { useOverlayTransition } from "@/hooks/useOverlayTransition";

// Ported from pyzo-central-frontend's PhoneInput.tsx: country-code
// dropdown (searchable) + digits-only number field.
const PhoneInput = ({
  value,
  onChange,
  countryCode,
  onCountryCodeChange,
  placeholder,
  isError = false,
  errorMessage = "",
  disabled = false,
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);
  const searchInputRef = useRef(null);
  const { shouldRender, transitionStyle, dropdownTransitionClassName } = useOverlayTransition(isOpen, false);

  // Approximate rendered height of the panel (search bar + list + borders) —
  // used to decide whether it fits below the trigger or must flip above it.
  const DROPDOWN_HEIGHT = 224;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const filteredCountries = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return COUNTRY_CODES;
    return COUNTRY_CODES.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.code.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex flex-row items-start p-0 gap-[10px] w-full h-[32px] self-stretch">
        {/* Country Code Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            ref={triggerRef}
            type="button"
            disabled={disabled}
            onClick={() => {
              if (!isOpen && triggerRef.current) {
                const rect = triggerRef.current.getBoundingClientRect();
                setOpenUpward(window.innerHeight - rect.bottom < DROPDOWN_HEIGHT);
              }
              setIsOpen(!isOpen);
            }}
            className={`box-border flex flex-row justify-between items-center px-1.5 py-2 gap-0.5 min-w-[55px] w-auto h-[32px] border rounded-md focus:outline-none transition-colors duration-200 ${
              disabled
                ? "bg-[#FAFAFA] border-[#E5E7EB] text-[#6A6A6A] cursor-not-allowed"
                : isError
                  ? "bg-white border-[#F04638] cursor-pointer"
                  : isOpen
                    ? "bg-white border-[#2877EE] cursor-pointer"
                    : "bg-white border-[#E5E7EB] hover:bg-[#F9F9F9] focus:border-[#2877EE] focus:bg-white focus:hover:bg-white cursor-pointer"
            }`}
          >
            <span className="font-lato font-normal text-[12px] leading-[150%] text-[#111827] whitespace-nowrap">
              {countryCode}
            </span>
            <LuChevronDown className={`w-3.5 h-3.5 text-[#667085] flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </button>

        {shouldRender && (
          <div
            className={`absolute left-0 w-[240px] origin-top bg-white border border-[#E0E2E7] rounded-[6px] shadow-lg z-[100] flex flex-col ${dropdownTransitionClassName}`}
            style={{ ...(openUpward ? { bottom: `calc(32px + 4px)` } : { top: `calc(32px + 4px)` }), ...transitionStyle }}
          >
            {/* Search Input */}
            <div className="p-2 border-b border-[#E3E7EF] flex items-center gap-2">
              <LuSearch className="w-3.5 h-3.5 text-[#667085]" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder={t("common.searchCountry")}
                className="w-full font-lato text-xs outline-none text-[#111827] placeholder-[#B5BBC5]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* List */}
            <div className="overflow-y-auto h-[170px]">
              {filteredCountries.length > 0 ? (
                filteredCountries.map((item, index) => {
                  const isSelected = item.code === countryCode;
                  
                  return (
                    <div
                      key={`${item.code}-${index}`}
                      className={`px-3 flex items-center font-lato text-xs ${
                        isSelected
                          ? "text-[#667085] cursor-not-allowed bg-[#F9F9FC]"
                          : "text-[#111827] hover:bg-gray-50 cursor-pointer"
                      } ${
                        index < filteredCountries.length - 1 ? "border-b border-[#E3E7EF]" : ""
                      }`}
                      style={{ minHeight: "32px", padding: "8px 12px" }}
                      onClick={() => {
                        if (!isSelected) {
                          onCountryCodeChange(item.code);
                          setIsOpen(false);
                        }
                      }}
                    >
                      {item.label}
                    </div>
                  );
                })
              ) : (
                <div className="px-3 py-4 text-center font-lato text-xs text-[#667085]">
                  {t("common.noResultsFound")}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Phone Number Input */}
      <div className={`box-border flex flex-row justify-between items-center p-2 gap-[10px] isolation-isolate flex-1 min-w-0 h-[32px] border rounded-md transition-colors duration-200 ${
        disabled
          ? "bg-[#FAFAFA] border-[#E5E7EB]"
          : isError
            ? "bg-white border-[#F04638]"
            : "bg-white border-[#E5E7EB] hover:bg-[#F9F9F9] focus-within:bg-white focus-within:hover:bg-white focus-within:border-[#2877EE]"
      }`}>
        <input
          type="tel"
          value={value}
          disabled={disabled}
          onChange={(e) => {
            const numericValue = e.target.value.replace(/\D/g, "");
            onChange(numericValue);
          }}
          placeholder={placeholder ?? t("common.enterPhoneNumber")}
          className={`w-full h-full font-lato font-normal text-[12px] leading-[150%] placeholder-[#858D9D] border-none outline-none bg-transparent ${disabled ? "text-[#6A6A6A] cursor-not-allowed" : "text-[#1D1F2C]"}`}
        />
      </div>
    </div>
    {isError && errorMessage && (
      <span className="font-lato font-normal text-[10px] leading-[12px] text-[#F04638]">
        {errorMessage}
      </span>
    )}
  </div>
  );
};

export default PhoneInput;
