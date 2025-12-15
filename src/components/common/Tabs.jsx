"use client";

import React from "react";

const Tabs = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className="flex items-center">
      {tabs.map((tab, index) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex justify-center items-center px-4 py-2 h-[33px] rounded-t-lg ${
            activeTab === tab.id
              ? " border-b-2 border-primary"
              : "border-b-2 border-transparent hover:bg-[#f0f3f5] cursor-pointer"
          }`}
          // style={activeTab === tab.id ? { boxShadow: '0px 4px 4px 0px #00000014' } : {}}
        >
          <span
            className={`font-lato text-[14px] leading-[17px] ${
              activeTab === tab.id
                ? "font-semibold text-primary"
                : "font-medium text-[#1D1F2C]"
            }`}
          >
            {tab.label}
          </span>
        </button>
      ))}
    </div>
  );
};

export default Tabs;