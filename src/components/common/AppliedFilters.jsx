"use client";

import React from "react";
import Image from "next/image";
import cross from "@/assets/svg/filter_cross.svg";

export default function AppliedFilters({
  appliedFilters = {},
  sections = [],
  onFilterChange,
  disabled = false,
  showDeleteButton = true,
}) {
  const hasAppliedFilters = Object.values(appliedFilters).some((filters) => filters.length > 0);

  if (!hasAppliedFilters) {
    return null;
  }

  const matches = (a, b) => String(a) === String(b);

  const clearAllFilters = () => {
    const clearedFilters = {};
    Object.keys(appliedFilters).forEach((key) => {
      clearedFilters[key] = [];
    });
    onFilterChange(clearedFilters);
  };

  const removeFilter = (paramName, value) => {
    const updatedFilters = {
      ...appliedFilters,
      [paramName]: value ? appliedFilters[paramName]?.filter((f) => !matches(f, value)) || [] : [],
    };

    if (value) {
      const clearDependentChildren = (parentParam, parentValue) => {
        sections
          .filter((s) => s.hierarchy)
          .forEach((section) => {
            section.hierarchy?.forEach((level) => {
              if (level.dependsOn === parentParam) {
                const currentChildValues = updatedFilters[level.paramName] || [];
                const filteredChildValues = currentChildValues.filter((childValue) => {
                  const childOption = level.options.find((opt) => matches(opt.value, childValue));
                  return !(childOption?.parentValue && matches(childOption.parentValue, parentValue));
                });
                updatedFilters[level.paramName] = filteredChildValues;
                const removedChildValues = currentChildValues.filter((cv) => !filteredChildValues.includes(cv));
                removedChildValues.forEach((removedChild) => {
                  clearDependentChildren(level.paramName, removedChild);
                });
              }
            });
          });
      };
      clearDependentChildren(paramName, value);
    } else {
      const clearAllDependentChildren = (parentParam) => {
        sections
          .filter((s) => s.hierarchy)
          .forEach((section) => {
            section.hierarchy?.forEach((level) => {
              if (level.dependsOn === parentParam) {
                updatedFilters[level.paramName] = [];
                clearAllDependentChildren(level.paramName);
              }
            });
          });
      };
      clearAllDependentChildren(paramName);
    }

    onFilterChange(updatedFilters);
  };

  const getSectionTitle = (paramName) => {
    const mainSection = sections.find((section) => section.paramName === paramName);
    if (mainSection) return mainSection.title;
    for (const section of sections) {
      if (section.hierarchy) {
        const hierarchyLevel = section.hierarchy.find((level) => level.paramName === paramName);
        if (hierarchyLevel) return hierarchyLevel.level;
      }
    }
    return paramName;
  };

  const getOptionLabel = (paramName, value) => {
    const mainSection = sections.find((s) => s.paramName === paramName);
    if (mainSection) {
      const direct = (mainSection.options || []).find((opt) => matches(opt.value, value));
      if (direct) return direct.label;
      if (mainSection.hierarchy) {
        for (const l of mainSection.hierarchy) {
          const hOpt = (l.options || []).find((opt) => matches(opt.value, value));
          if (hOpt) return hOpt.label;
        }
      }
    }
    for (const section of sections) {
      if (section.hierarchy) {
        const level = section.hierarchy.find((l) => l.paramName === paramName);
        if (level) {
          const hOpt = (level.options || []).find((opt) => matches(opt.value, value));
          if (hOpt) return hOpt.label;
        }
      }
    }
    return value;
  };

  return (
    <div className="bg-white border border-[#EDF0F6] rounded-lg px-2.5 py-1.5 mb-0 flex items-center justify-between mt-3">
      <div className="flex items-center gap-1 flex-wrap">
        {Object.entries(appliedFilters)
          .filter(([_, values]) => values.length > 0)
          .map(([paramName, values]) => (
            <div
              key={paramName}
              className="flex items-center bg-[#FCFCFC] border-[0.5px] border-[#EDF0F6] rounded-md px-2 py-1 gap-1">
              <span className="text-[10px] leading-3 font-lato">
                <span className="text-[#636974]">{getSectionTitle(paramName)}: </span>
                <span className="text-[#0B1B32]">
                  {values.map((value) => getOptionLabel(paramName, value)).join(", ")}
                </span>
              </span>
              {showDeleteButton && (
                <button
                  onClick={() => !disabled && removeFilter(paramName)}
                  className={`w-3 h-3 flex items-center justify-center ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}>
                  <Image src={cross} alt="Remove filter" width={10} height={10} />
                </button>
              )}
            </div>
          ))}
      </div>
      <button
        onClick={clearAllFilters}
        disabled={disabled}
        className="bg-[#FCFCFC] border-[0.5px] border-[#6B7685] rounded-md px-2 py-1 text-[10px] leading-3 text-[#0B1B32] font-lato whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
        Clear All
      </button>
    </div>
  );
}
