"use client";

import React, { useLayoutEffect, useRef, useState } from "react";

/**
 * Ported from pyzo-central-frontend's Tooltip.tsx, trimmed to the
 * dark/default variant used by the collapsed sidebar's nav-item labels.
 */
const Tooltip = ({ children, content, position = "top", className = "", disabled = false }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [resolvedPosition, setResolvedPosition] = useState(position);
  const bubbleRef = useRef(null);

  useLayoutEffect(() => {
    if (!isVisible || (position !== "top" && position !== "bottom")) {
      setResolvedPosition(position);
      return;
    }
    const el = bubbleRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (position === "bottom" && rect.bottom > window.innerHeight) {
      setResolvedPosition("top");
    } else if (position === "top" && rect.top < 0) {
      setResolvedPosition("bottom");
    } else {
      setResolvedPosition(position);
    }
  }, [isVisible, position]);

  if (disabled || !content) return children;

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  const arrowClasses = {
    top: "top-full left-1/2 -translate-x-1/2 border-t-gray-800 border-l-transparent border-r-transparent border-b-transparent",
    bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-gray-800 border-l-transparent border-r-transparent border-t-transparent",
    left: "left-full top-1/2 -translate-y-1/2 border-l-gray-800 border-t-transparent border-b-transparent border-r-transparent",
    right: "right-full top-1/2 -translate-y-1/2 border-r-gray-800 border-t-transparent border-b-transparent border-l-transparent",
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}>
      {children}
      {isVisible && (
        <div
          ref={bubbleRef}
          className={`absolute z-[999] rounded-[4px] whitespace-nowrap px-2.5 py-1.5 text-[12px] leading-[14px] font-medium text-white bg-gray-800 animate-in fade-in duration-200 ${positionClasses[resolvedPosition]}`}>
          {content}
          <div className={`absolute border-[4px] ${arrowClasses[resolvedPosition]}`} style={{ width: 0, height: 0 }} />
        </div>
      )}
    </div>
  );
};

export default Tooltip;
