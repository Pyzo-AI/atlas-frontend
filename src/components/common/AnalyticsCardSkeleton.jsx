import React from "react";

const AnalyticsCardSkeleton = () => {
  return (
    <div className="flex flex-col items-start p-[14px] gap-2 w-full h-[69px] bg-white rounded-lg animate-pulse border border-border-card ">
      {/* Title skeleton */}
      <div className="w-3/4 h-[14px] bg-gray-200 rounded"></div>
      {/* Value skeleton */}
      <div className="w-1/2 h-[19px] bg-gray-200 rounded"></div>
    </div>
  );
};

export default AnalyticsCardSkeleton;
