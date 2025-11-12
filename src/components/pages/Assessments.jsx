import React from "react";
import AnalyticsCardSkeleton from "../common/AnalyticsCardSkeleton";
import AnalyticsCard from "../common/AnalyticsCard";


export default function Assessments({
  isLoading,
  analyticsData,
}) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, index) => (
              <AnalyticsCardSkeleton key={index} />
            ))
          : analyticsData.map((item, index) => (
              <AnalyticsCard
                key={index}
                title={item.title}
                value={item.value}
                onClick={item.onClick}
              />
            ))}
      </div>
    </div>
  );
}
