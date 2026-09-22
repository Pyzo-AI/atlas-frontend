"use client";
import React from "react";
import Image from "next/image";
import accessIcon from "@/assets/svg/access.svg";

// Sibling to ErrorState (icon, title, description, centered), but for the
// distinct "you're not allowed here" case rather than "something broke": no
// retry button (retrying changes nothing when the blocker is a missing
// permission), and a "Need Access?" info box instead. Ported 1:1 from
// pyzo-central-frontend's AccessDeniedState so both products render the
// same screen for a 403.
export default function AccessDeniedState({
  title = "You don't have access to this",
  description = "Ask an organization admin to grant you the required permission.",
  className = "",
  // false lets this render inside a smaller host (e.g. the notification
  // drawer) that already constrains its own height, instead of forcing the
  // viewport-height page layout.
  fullScreen = true,
}) {
  return (
    <div
      className={`flex items-center justify-center px-4 transition-all duration-300 ${
        fullScreen ? "min-h-[calc(100vh-45px)] bg-[#F9FAFB]" : "h-full"
      } ${className}`}>
      <div className="flex flex-col items-stretch gap-6 w-full max-w-[400px] px-6 py-10 bg-white rounded-xl animate-in fade-in zoom-in duration-300">
        <div className="flex flex-col items-center gap-4">
          <Image
            src={accessIcon}
            alt="Access Denied"
            width={64}
            height={64}
            className="w-16 h-16 shrink-0"
          />
          <div className="flex flex-col items-center gap-2 text-center">
            <h3 className="text-lg font-bold text-[#1A1C29]">{title}</h3>
            <p className="text-[12px] font-normal leading-[16px]" style={{ color: "rgba(26, 28, 41, 0.8)" }}>
              {description}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-1 px-5 py-3 rounded-[4px] text-left" style={{ backgroundColor: "#F2F6FD" }}>
          <p className="text-[12px] font-bold leading-[1.5] text-[#252323] m-0">Need Access?</p>
          <p className="text-[12px] font-normal leading-[1.5] text-[#1D1F2C] m-0">
            Contact your system administrator to request access.
          </p>
        </div>
      </div>
    </div>
  );
}
