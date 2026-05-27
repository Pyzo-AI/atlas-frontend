"use client";

import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

function formatDate(dateStr, monthNames) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDate();
  const month = monthNames[d.getMonth()].slice(0, 3);
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

function toDateString(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default function DateRangePicker({ fromDate, toDate, onFromChange, onToChange }) {
  const { t } = useTranslation();
  const MONTH_NAMES = t("dateRange.months", { returnObjects: true });
  const DAY_NAMES = t("dateRange.days", { returnObjects: true });

  const today = new Date();
  const initialYear = fromDate ? new Date(fromDate + "T00:00:00").getFullYear() : today.getFullYear();
  const initialMonth = fromDate ? new Date(fromDate + "T00:00:00").getMonth() : today.getMonth();

  const [viewYear, setViewYear] = useState(initialYear);
  const [viewMonth, setViewMonth] = useState(initialMonth);
  const [selectingField, setSelectingField] = useState("from"); // "from" or "to"

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const calendarDays = useMemo(() => {
    const days = [];
    // Empty cells for days before the 1st
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(d);
    }
    return days;
  }, [daysInMonth, firstDay]);

  const goToPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleDayClick = (day) => {
    if (!day || isFutureDate(day)) return;
    const dateStr = toDateString(viewYear, viewMonth, day);

    // If both are set OR neither is set, start a new selection (set From, clear To)
    if ((fromDate && toDate) || (!fromDate && !toDate)) {
      onFromChange(dateStr);
      onToChange("");
      setSelectingField("to");
    } else {
      // We have exactly one date set
      if (fromDate && !toDate) {
        if (dateStr < fromDate) {
          // Clicked before From: clicked date becomes From, old From becomes To
          onFromChange(dateStr);
          onToChange(fromDate);
        } else {
          // Clicked after From: just set To
          onToChange(dateStr);
        }
        setSelectingField("from"); // Range complete, next click will start over
      } else if (!fromDate && toDate) {
        if (dateStr > toDate) {
          // Clicked after To: old To becomes From, clicked date becomes To
          onFromChange(toDate);
          onToChange(dateStr);
        } else {
          // Clicked before To: just set From
          onFromChange(dateStr);
        }
        setSelectingField("from");
      }
    }
  };

  const isInRange = (day) => {
    if (!day || !fromDate || !toDate) return false;
    const dateStr = toDateString(viewYear, viewMonth, day);
    return dateStr > fromDate && dateStr < toDate;
  };

  const isFrom = (day) => {
    if (!day || !fromDate) return false;
    return toDateString(viewYear, viewMonth, day) === fromDate;
  };

  const isTo = (day) => {
    if (!day || !toDate) return false;
    return toDateString(viewYear, viewMonth, day) === toDate;
  };

  const isFutureDate = (day) => {
    if (!day) return false;
    const date = new Date(viewYear, viewMonth, day);
    date.setHours(0, 0, 0, 0);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return date > now;
  };

  const isToday = (day) => {
    if (!day) return false;
    return viewYear === today.getFullYear() && viewMonth === today.getMonth() && day === today.getDate();
  };

  return (
    <div className="flex flex-col gap-3 mt-2">
      {/* From / To display fields */}
      <div className="flex gap-3">
        <div className={`flex-1 flex flex-col gap-1 cursor-pointer`} onClick={() => setSelectingField("from")}>
          <span className="font-lato font-medium text-xs text-[#535353]">{t("dateRange.from")}</span>
          <div
            className={`h-[36px] px-3 py-2 border rounded-lg font-lato text-xs bg-white flex items-center justify-between ${
              selectingField === "from" ? "border-[#2762EA]" : "border-[#E5E7EB]"
            }`}>
            <span className={fromDate ? "text-[#1D1F2C]" : "text-[#9CA3AF]"}>
              {fromDate ? formatDate(fromDate, MONTH_NAMES) : t("dateRange.selectDate")}
            </span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M5.33 1.33V3.33M10.67 1.33V3.33M2.33 6.06H13.67M14 5.67V11.33C14 13.33 13 14.67 10.67 14.67H5.33C3 14.67 2 13.33 2 11.33V5.67C2 3.67 3 2.33 5.33 2.33H10.67C13 2.33 14 3.67 14 5.67Z"
                stroke="#667085"
                strokeWidth="1"
                strokeMiterlimit="10"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
        <div className={`flex-1 flex flex-col gap-1 cursor-pointer`} onClick={() => setSelectingField("to")}>
          <span className="font-lato font-medium text-xs text-[#535353]">{t("dateRange.to")}</span>
          <div
            className={`h-[36px] px-3 py-2 border rounded-lg font-lato text-xs bg-white flex items-center justify-between ${
              selectingField === "to" ? "border-[#2762EA]" : "border-[#E5E7EB]"
            }`}>
            <span className={toDate ? "text-[#1D1F2C]" : "text-[#9CA3AF]"}>
              {toDate ? formatDate(toDate, MONTH_NAMES) : t("dateRange.selectDate")}
            </span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M5.33 1.33V3.33M10.67 1.33V3.33M2.33 6.06H13.67M14 5.67V11.33C14 13.33 13 14.67 10.67 14.67H5.33C3 14.67 2 13.33 2 11.33V5.67C2 3.67 3 2.33 5.33 2.33H10.67C13 2.33 14 3.67 14 5.67Z"
                stroke="#667085"
                strokeWidth="1"
                strokeMiterlimit="10"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="border border-[#E5E7EB] rounded-lg bg-white p-3">
        {/* Month/Year header */}
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={goToPrevMonth}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 cursor-pointer">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M7.5 9L4.5 6L7.5 3"
                stroke="#535353"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <span className="font-lato font-semibold text-xs text-[#1D1F2C]">
            {MONTH_NAMES[viewMonth]} {viewYear}
          </span>
          <button
            type="button"
            onClick={goToNextMonth}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 cursor-pointer">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M4.5 3L7.5 6L4.5 9"
                stroke="#535353"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Day name headers */}
        <div className="grid grid-cols-7 gap-0 mb-1">
          {DAY_NAMES.map((d) => (
            <div key={d} className="h-7 flex items-center justify-center">
              <span className="font-lato font-medium text-[10px] text-[#9CA3AF]">{d}</span>
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-0">
          {calendarDays.map((day, idx) => {
            if (!day) {
              return <div key={`empty-${idx}`} className="h-7" />;
            }

            const isStart = isFrom(day);
            const isEnd = isTo(day);
            const inRange = isInRange(day);
            const isTodayDate = isToday(day);
            const isFuture = isFutureDate(day);

            let cellClasses = "h-7 flex items-center justify-center text-[11px] font-lato relative transition-colors";
            if (!isFuture) cellClasses += " cursor-pointer";

            let textClasses = "w-7 h-7 flex items-center justify-center rounded-full transition-colors";

            if (isStart || isEnd) {
              textClasses += " bg-[#2762EA] text-white font-semibold";
            } else if (inRange) {
              cellClasses += " bg-[#EBF1FF]";
              textClasses += " text-[#1D1F2C]";
            } else if (isTodayDate) {
              textClasses += " border border-[#2762EA] text-[#2762EA] font-semibold";
            } else if (isFuture) {
              textClasses += " text-[#B5BBC5]";
            } else {
              textClasses += " text-[#1D1F2C] hover:bg-[#F3F4F6]";
            }

            // Range background extensions
            let bgExtension = "";
            if (isStart && toDate && fromDate !== toDate) {
              bgExtension =
                "after:absolute after:right-0 after:top-0 after:w-1/2 after:h-full after:bg-[#EBF1FF] after:-z-10";
            }
            if (isEnd && fromDate && fromDate !== toDate) {
              bgExtension =
                "before:absolute before:left-0 before:top-0 before:w-1/2 before:h-full before:bg-[#EBF1FF] before:-z-10";
            }

            return (
              <div
                key={day}
                className={`${cellClasses} ${inRange ? "" : ""} ${bgExtension}`}
                onClick={() => handleDayClick(day)}>
                <span className={textClasses}>{day}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
