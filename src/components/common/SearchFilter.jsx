"use client";

import React from "react";
import SearchBar from "./SearchBar";
import Filter from "./Filter";
import AppliedFilters from "./AppliedFilters";

export default function SearchFilter({
  searchTerm,
  onSearchChange,
  searchPlaceholder = "Search...",
  showSearch = true,
  filterSections = [],
  onFilterChange,
  appliedFilters = {},
  showFilter = true,
  marginTop = "20px",
  actionButton,
  disabled = false,
}) {
  return (
    <div>
      <div className="flex justify-between items-end" style={{ marginTop }}>
        <div className="flex gap-2.5 items-end">
          {showSearch && (
            <SearchBar
              searchTerm={searchTerm}
              onSearchChange={onSearchChange}
              placeholder={searchPlaceholder}
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
