import React from "react";

const CertificateCardSkeleton = () => {
  return (
    <div className="bg-white rounded-lg p-3 flex flex-col gap-[10px] md:gap-4 shadow-[0px_1px_12px_rgba(0,0,0,0.04)] border border-[#E5E7EB] animate-pulse">
      {/* Top Icon and Label Skeleton */}
      <div className="flex flex-col gap-2">
        {/* Icon Skeleton */}
        <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>

        {/* Text Skeletons */}
        <div className="flex flex-col gap-[8px]">
          {/* Title bar 1 */}
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          {/* Title bar 2 (optional shorter) */}
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>

          {/* Instructor bar */}
          <div className="h-3 bg-gray-100 rounded w-1/2 mt-1"></div>

          {/* Date bar */}
          <div className="h-2.5 bg-gray-50 rounded w-1/3 mt-0.5"></div>
        </div>
      </div>

      {/* Actions Skeleton */}
      <div className="flex items-center gap-3 mt-1">
        <div className="flex-1 h-9 bg-gray-100 rounded-md"></div>
        <div className="flex-1 h-9 bg-gray-200 rounded-md"></div>
      </div>
    </div>
  );
};

export default CertificateCardSkeleton;
