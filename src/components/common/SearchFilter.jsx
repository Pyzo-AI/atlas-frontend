"use client";

import React from "react";
import SearchBar from "./SearchBar";
import Filter from "./Filter";
import AppliedFilters from "./AppliedFilters";
import { useTranslation } from "react-i18next";

export default function SearchFilter({
  searchTerm,
  onSearchChange,
  searchPlaceholder,
  showSearch = true,
  filterSections = [],
  onFilterChange,
  appliedFilters = {},
  showFilter = true,
  marginTop = "20px",
  actionButton,
  disabled = false,
}) {
  const { t } = useTranslation();
  const actualSearchPlaceholder = searchPlaceholder || t("search.placeholder");

  return (
    <div>
      <div className="flex justify-between items-center md:items-end" style={{ marginTop }}>
        <div className="flex flex-1 gap-3 md:gap-2.5 items-center md:items-end w-full md:w-auto">
          {showSearch && (
            <SearchBar
              searchTerm={searchTerm}
              onSearchChange={onSearchChange}
              placeholder={actualSearchPlaceholder}
              disabled={disabled}
            />
          )}
          {showFilter && filterSections.length > 0 && (
            <Filter
              sections={filterSections}
              onFilterChange={onFilterChange}
              appliedFilters={appliedFilters}
              disabled={disabled}
            />
          )}
        </div>
        {actionButton && <div>{actionButton}</div>}
      </div>
      {showFilter && onFilterChange && (
        <AppliedFilters
          appliedFilters={appliedFilters}
          sections={filterSections}
          onFilterChange={onFilterChange}
          disabled={disabled}
        />
      )}
    </div>
  );
}
