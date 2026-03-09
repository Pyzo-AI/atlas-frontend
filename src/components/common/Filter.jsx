"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import MultiSelectDropdown from "./MultiSelectDropdown";
import Checkbox from "./Checkbox";
import RadioButton from "@/components/ui/RadioButton";
import DateRangePicker from "@/components/ui/DateRangePicker";
import filterIcon from "@/assets/svg/filter.svg";

export default function Filter({ sections = [], onFilterChange, appliedFilters = {}, disabled = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState(appliedFilters);
  const [expandedSections, setExpandedSections] = useState({});
  const [mounted, setMounted] = useState(false);

  // Flexible equality comparator for option values (handles number vs string mismatches)
  const matches = (a, b) => String(a) === String(b);

  // Initialize hierarchy selections from applied filters
  const initializeHierarchyFromFilters = () => {
    const hierarchySelections = {};
    Object.entries(appliedFilters).forEach(([paramName, values]) => {
      if (values.length > 0) {
        hierarchySelections[paramName] = values;
      }
    });
    return hierarchySelections;
  };

  const [hierarchySelections, setHierarchySelections] = useState(initializeHierarchyFromFilters);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setSelectedFilters(appliedFilters);
    const newHierarchySelections = {};
    Object.entries(appliedFilters).forEach(([paramName, values]) => {
      if (values.length > 0) {
        newHierarchySelections[paramName] = values;
      }
    });
    setHierarchySelections(newHierarchySelections);
  }, [appliedFilters]);

  const toggleFilter = (paramName, value, multipleChoice = true) => {
    setSelectedFilters((prev) => {
      const sectionFilters = prev[paramName] || [];
      if (multipleChoice) {
        const newSectionFilters = sectionFilters.includes(value)
          ? sectionFilters.filter((f) => !matches(f, value))
          : [...sectionFilters, value];
        return { ...prev, [paramName]: newSectionFilters };
      } else {
        const newSectionFilters = sectionFilters.includes(value) ? [] : [value];
        return { ...prev, [paramName]: newSectionFilters };
      }
    });
  };

  const selectRadio = (paramName, value) => {
    setSelectedFilters((prev) => ({ ...prev, [paramName]: [value] }));
  };

  const handleDateChange = (paramName, value) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [paramName]: value,
    }));
  };

  const clearSection = (section) => {
    setSelectedFilters((prev) => {
      const next = { ...prev, [section.paramName]: [] };
      // If section has customDateFields, clear those too
      if (section.customDateFields) {
        section.customDateFields.forEach((f) => {
          next[f.paramName] = "";
        });
      }
      return next;
    });
  };

  const clearAll = () => {
    setSelectedFilters({});
    setHierarchySelections({});
  };

  const hasValue = (v) => (Array.isArray(v) ? v.length > 0 : !!v);

  // Get all custom date field param names to exclude them from the main count
  const subParamNames = new Set();
  sections.forEach((s) => {
    if (s.customDateFields) {
      s.customDateFields.forEach((f) => subParamNames.add(f.paramName));
    }
  });

  const hasSelectedFilters = Object.values(selectedFilters).some(hasValue);
  const selectedFilterCount = Object.entries(selectedFilters).filter(
    ([p, v]) => !subParamNames.has(p) && hasValue(v)
  ).length;
  const hasAppliedFilters = Object.values(appliedFilters).some(hasValue);
  const appliedFilterCount = Object.entries(appliedFilters).filter(
    ([p, v]) => !subParamNames.has(p) && hasValue(v)
  ).length;

  const hasLocalChanges = (() => {
    const allParams = new Set([...Object.keys(selectedFilters), ...Object.keys(appliedFilters)]);
    for (const param of allParams) {
      const sVal = selectedFilters[param] ?? "";
      const aVal = appliedFilters[param] ?? "";
      if (Array.isArray(sVal) && Array.isArray(aVal)) {
        if (
          sVal.length !== aVal.length ||
          !sVal.every((v) => aVal.includes(v)) ||
          !aVal.every((v) => sVal.includes(v))
        ) {
          return true;
        }
      } else if (String(sVal) !== String(aVal)) {
        return true;
      }
    }
    return false;
  })();

  const hasLocalSelectedFilters =
    Object.values(selectedFilters).some(hasValue) || Object.values(hierarchySelections).some((s) => s.length > 0);

  const toggleSection = (sectionTitle) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle],
    }));
  };

  const handleHierarchyChange = (paramName, value) => {
    setHierarchySelections((prev) => {
      const current = prev[paramName] || [];
      const next = { ...prev };
      if (current.some((v) => matches(v, value))) {
        next[paramName] = current.filter((v) => !matches(v, value));
      } else {
        next[paramName] = [...current, value];
      }
      const hierarchySections = sections.filter((s) => s.hierarchy);
      const clearDeps = (parent) => {
        hierarchySections.forEach((s) => {
          s.hierarchy?.forEach((l) => {
            if (l.dependsOn === parent && next[l.paramName]) {
              next[l.paramName] = [];
              clearDeps(l.paramName);
            }
          });
        });
      };
      clearDeps(paramName);
      return next;
    });

    setSelectedFilters((prev) => {
      const current = prev[paramName] || [];
      const next = { ...prev };
      if (current.some((v) => matches(v, value))) {
        next[paramName] = current.filter((v) => !matches(v, value));
      } else {
        next[paramName] = [...current, value];
      }
      const hierarchySections = sections.filter((s) => s.hierarchy);
      const clearDeps = (parent) => {
        hierarchySections.forEach((s) => {
          s.hierarchy?.forEach((l) => {
            if (l.dependsOn === parent) {
              next[l.paramName] = [];
              clearDeps(l.paramName);
            }
          });
        });
      };
      clearDeps(paramName);
      return next;
    });
  };

  const getAvailableOptions = (hierarchy) => {
    if (!hierarchy.dependsOn) return hierarchy.options;
    const parentValues = hierarchySelections[hierarchy.dependsOn] || [];
    if (parentValues.length === 0) return [];
    return hierarchy.options.filter(
      (opt) => !opt.parentValue || parentValues.some((pv) => matches(pv, opt.parentValue))
    );
  };

  const getOptionLabel = (paramName, value) => {
    for (const s of sections) {
      if (s.paramName === paramName) {
        const found = (s.options || []).find((o) => matches(o.value, value));
        if (found) return found.label;
      }
      if (s.hierarchy) {
        for (const l of s.hierarchy) {
          if (l.paramName === paramName) {
            const found = (l.options || []).find((o) => matches(o.value, value));
            if (found) return found.label;
          }
        }
      }
    }
    return value;
  };

  const getSectionTitle = (paramName) => {
    const s = sections.find((sec) => sec.paramName === paramName);
    if (s) return s.title;
    for (const sec of sections) {
      if (sec.hierarchy) {
        const h = sec.hierarchy.find((l) => l.paramName === paramName);
        if (h) return h.level;
      }
    }
    return paramName;
  };

  return (
    <>
      <button
        onClick={() => !disabled && setIsOpen(true)}
        disabled={disabled}
        className={`relative flex items-center justify-center md:justify-start gap-1 px-0 md:px-3 py-2 bg-white rounded-[6px] hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed w-[32px] h-[32px] md:w-auto md:h-[30px] ${
          hasAppliedFilters ? "border border-[#2762EA]" : "border border-[#E5E7EB]"
        }`}>
        {hasAppliedFilters && appliedFilterCount > 0 && (
          <div className="absolute -top-[7px] -right-[7px] w-[18px] h-[18px] bg-[#1A1C29] text-white text-[10px] font-bold rounded-full flex items-center justify-center border border-white md:hidden animate-in zoom-in duration-300">
            {appliedFilterCount}
          </div>
        )}
        <Image
          src={filterIcon}
          alt="Filter Icon"
          width={16}
          height={16}
          style={{
            filter: hasAppliedFilters
              ? "brightness(0) saturate(100%) invert(27%) sepia(89%) saturate(1686%) hue-rotate(218deg) brightness(94%) contrast(89%)"
              : "none",
          }}
        />
        <span
          className={`hidden md:inline text-xs font-regular font-lato whitespace-nowrap ${
            hasAppliedFilters ? "text-[#2762EA]" : "text-[#667085]"
          }`}>
          More Filters{hasAppliedFilters ? ` (${appliedFilterCount})` : ""}
        </span>
      </button>

      {isOpen &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 z-[9999] overflow-hidden">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={(e) => e.target === e.currentTarget && setIsOpen(false)}
            />
            <div className="absolute right-0 top-0 h-full bg-white flex flex-col shadow-xl w-[90%] md:w-[352px]">
              <div className="h-12 bg-white border-b border-[#E5E5E5] flex items-center justify-between px-4 flex-shrink-0">
                <span className="font-lato font-semibold text-base text-[#2C313B]">
                  Filter by {hasSelectedFilters ? ` (${selectedFilterCount})` : ""}
                </span>
                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {hasLocalSelectedFilters && (
                <div className="flex flex-col gap-3 px-4 py-4 border-b border-[#F9F9FC] max-h-[160px] overflow-y-auto">
                  {Object.entries(selectedFilters)
                    .filter(([_, v]) => Array.isArray(v) && v.length > 0)
                    .map(([p, values]) => (
                      <div key={p} className="flex flex-col gap-1.5">
                        <span className="font-lato font-semibold text-xs text-[#0B1B32]">{getSectionTitle(p)}</span>
                        <div className="flex flex-wrap gap-1.5">
                          {values.map((v) => (
                            <div
                              key={v}
                              className="flex items-center gap-1 px-1.5 py-1 bg-[#F9F9FC] rounded-[41px] h-6">
                              <span className="font-lato font-normal text-[10px] leading-3 text-[#2762EA]">
                                {getOptionLabel(p, v)}
                              </span>
                              <button
                                onClick={() => {
                                  setSelectedFilters((prev) => {
                                    const next = { ...prev, [p]: prev[p].filter((val) => !matches(val, v)) };
                                    return next;
                                  });
                                  if (hierarchySelections[p]) {
                                    setHierarchySelections((prev) => ({
                                      ...prev,
                                      [p]: prev[p].filter((val) => !matches(val, v)),
                                    }));
                                  }
                                }}
                                className="w-4 h-4 flex items-center justify-center p-0.5 cursor-pointer">
                                <svg viewBox="0 0 16 16" fill="none">
                                  <path
                                    d="M4.5 4.5L11.5 11.5M4.5 11.5L11.5 4.5"
                                    stroke="#2762EA"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                  />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              )}

              <div className="flex-1 overflow-y-auto pt-2 pb-2">
                {sections.map((section, idx) => {
                  const isExpanded = expandedSections[section.title] ?? true;
                  return (
                    <div key={idx} className="flex flex-col">
                      <div
                        className="bg-[#F9F9FC] px-4 py-2 flex items-center justify-between cursor-pointer border-y border-[#F3F4F6]"
                        onClick={() => toggleSection(section.title)}>
                        <span className="font-lato text-sm font-semibold text-[#535353]">{section.title}</span>
                        <svg
                          className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor">
                          <path d="M19 9l-7 7-7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      {isExpanded && (
                        <div className="p-4 flex flex-col gap-4">
                          {section.hierarchy ? (
                            <div className="flex flex-col gap-4">
                              {section.hierarchy.map((h, hIdx) => {
                                const opts = getAvailableOptions(h);
                                const selected = hierarchySelections[h.paramName] || [];
                                const disabled =
                                  h.dependsOn &&
                                  (!hierarchySelections[h.dependsOn] || hierarchySelections[h.dependsOn].length === 0);
                                if (h.dependsOn && opts.length === 0) return null;
                                return (
                                  <div key={hIdx} className="flex flex-col gap-2">
                                    <span className="font-lato font-semibold text-xs text-[#111827]">{h.level}</span>
                                    <MultiSelectDropdown
                                      options={opts}
                                      selectedValues={selected}
                                      onChange={(val) => handleHierarchyChange(h.paramName, val)}
                                      disabled={disabled}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          ) : section.type === "radio" ? (
                            <>
                              <div
                                className={section.gridCols === 1 ? "flex flex-col gap-3" : "grid grid-cols-2 gap-3"}>
                                {section.options.map((option) => (
                                  <label
                                    key={option.value}
                                    className="flex items-center cursor-pointer"
                                    onClick={() => selectRadio(section.paramName, option.value)}>
                                    <RadioButton
                                      name={section.paramName}
                                      value={option.value}
                                      checked={(selectedFilters[section.paramName] || [])[0] === option.value}
                                      onChange={() => {}}
                                    />
                                    <span className="font-lato text-xs text-[#1D1F2C]">{option.label}</span>
                                  </label>
                                ))}
                              </div>
                              {/* Custom Date Range Picker */}
                              {section.customDateFields &&
                                (selectedFilters[section.paramName] || [])[0] === section.customTriggerValue && (
                                  <DateRangePicker
                                    fromDate={selectedFilters[section.customDateFields[0]?.paramName] || ""}
                                    toDate={selectedFilters[section.customDateFields[1]?.paramName] || ""}
                                    onFromChange={(val) =>
                                      handleDateChange(section.customDateFields[0]?.paramName, val)
                                    }
                                    onToChange={(val) => handleDateChange(section.customDateFields[1]?.paramName, val)}
                                  />
                                )}
                            </>
                          ) : (
                            <div className="grid grid-cols-2 gap-4">
                              {section.options.map((option) => (
                                <label
                                  key={option.value}
                                  className="flex items-center gap-2 cursor-pointer"
                                  onClick={() =>
                                    toggleFilter(section.paramName, option.value, section.multipleChoice !== false)
                                  }>
                                  <Checkbox
                                    checked={(selectedFilters[section.paramName] || []).includes(option.value)}
                                    onChange={() => {}}
                                  />
                                  <span className="font-lato text-xs text-[#1D1F2C]">{option.label}</span>
                                </label>
                              ))}
                            </div>
                          )}
                          <button
                            onClick={() => clearSection(section)}
                            className="text-left font-lato text-xs underline text-[#1D1F2C] cursor-pointer">
                            Clear
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="h-12 bg-[#F9F9F9] flex items-center justify-between px-4 flex-shrink-0 border-t border-[#E5E5E5]">
                <button
                  onClick={clearAll}
                  disabled={!hasLocalSelectedFilters}
                  className="w-[112px] h-[30px] bg-[#E8F0F9] rounded-md flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                  <span className="font-lato font-medium text-xs text-[#2762EA]">Clear All</span>
                </button>
                <button
                  onClick={() => {
                    onFilterChange?.(selectedFilters);
                    setIsOpen(false);
                  }}
                  disabled={!hasLocalChanges}
                  className="w-[112px] h-[30px] bg-[#2762EA] rounded-md flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                  <span className="font-lato font-medium text-xs text-white">Apply</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
