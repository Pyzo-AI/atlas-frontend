import React from "react";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi2";

const Pagination = ({ page, totalPages, onPageChange }) => {
  if (!totalPages || totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex items-center gap-1.5 py-4">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="flex items-center justify-center w-[30px] h-[30px] rounded-lg bg-[#F2F2F8] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
        <HiChevronLeft className="w-4 h-4 text-primary-text" />
      </button>

      {pages.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onPageChange(p)}
          className={`flex items-center justify-center w-[30px] h-[30px] rounded-lg font-lato font-semibold text-sm cursor-pointer ${
            p === page ? "bg-primary text-white" : "bg-[#F2F2F8] text-primary"
          }`}>
          {p}
        </button>
      ))}

      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="flex items-center justify-center w-[30px] h-[30px] rounded-lg bg-[#F2F2F8] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
        <HiChevronRight className="w-4 h-4 text-primary-text" />
      </button>
    </div>
  );
};

export default Pagination;
