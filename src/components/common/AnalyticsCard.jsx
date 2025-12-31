import React from "react";

const AnalyticsCard = ({ title, value, onClick }) => {
  return (
    <div
      className={`flex flex-col items-start p-[14px] gap-2 w-full min-h-[69px] bg-white rounded-lg border border-border-card transition-all duration-200 ${
        onClick ? "cursor-pointer hover:shadow-lg hover:scale-105" : ""
      }`}
      onClick={onClick}>
      <span className="w-full font-lato font-medium text-[12px] leading-[14px] text-text-secondary">{title}</span>
      <span className="w-full font-lato font-bold text-[16px] leading-[19px] text-text-title">{value}</span>
    </div>
  );
};

export default AnalyticsCard;
