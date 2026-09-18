import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { HiCheckCircle, HiInformationCircle, HiExclamationCircle, HiX } from 'react-icons/hi';
import { FiAlertTriangle } from 'react-icons/fi';

// Per-variant styling straight from Figma (node 142:3247): a top-to-bottom
// gradient background, a matching (lighter) gradient border on the top/left/
// right edges only, and a solid accent color for the icon + bottom progress
// bar. Ported as-is from compass-frontend's CustomToast so every product
// shares the same toast look.
const VARIANTS = {
  success: {
    icon: HiCheckCircle,
    accent: '#13BC6B',
    background: 'linear-gradient(180deg, rgba(232,249,243,1) 0%, rgba(255,255,255,1) 100%)',
    border: 'linear-gradient(180deg, rgba(219,245,237,0.7) 0%, rgba(255,255,255,1) 100%)',
  },
  info: {
    icon: HiInformationCircle,
    accent: '#2877EE',
    background: 'linear-gradient(180deg, rgba(236,244,255,1) 0%, rgba(255,255,255,1) 100%)',
    border: 'linear-gradient(180deg, rgba(219,230,245,0.7) 0%, rgba(248,248,248,1) 100%)',
  },
  error: {
    icon: HiExclamationCircle,
    accent: '#F04638',
    background: 'linear-gradient(180deg, rgba(254,242,242,1) 0%, rgba(255,255,255,1) 100%)',
    border: 'linear-gradient(180deg, rgba(245,219,219,0.6) 0%, rgba(248,248,248,1) 100%)',
  },
  warning: {
    icon: FiAlertTriangle,
    accent: '#FA9C3E',
    background: 'linear-gradient(180deg, rgba(254,246,233,1) 0%, rgba(255,255,255,1) 100%)',
    border: 'linear-gradient(180deg, rgba(245,236,219,0.7) 0%, rgba(248,248,248,1) 100%)',
  },
};

const CustomToast = ({ t, title, description, type = 'success', duration = 4000 }) => {
  const variant = VARIANTS[type];
  const Icon = variant.icon;
  // react-hot-toast itself pauses each toast's real dismiss timer while the
  // pointer is over it (tracked internally via the same hover events on the
  // wrapper it renders this component into) — without mirroring that here,
  // this bar's independent CSS animation keeps running to completion on its
  // own clock regardless, so it would visually empty out well before the
  // toast actually disappears whenever the user had hovered it even briefly.
  const [isPaused, setIsPaused] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`${
        t.visible ? 'animate-in fade-in slide-in-from-right-5 duration-200' : 'animate-out fade-out slide-out-to-right-5 duration-200'
      } pointer-events-auto relative flex items-start gap-2.5 w-[358px] p-3 rounded-xl overflow-hidden shadow-[0px_1px_11px_rgba(0,0,0,0.03)]`}
      style={{
        // Two-layer background is the standard CSS trick for a gradient
        // border: the first (padding-box) layer paints the fill, the second
        // (border-box) layer shows only through the 1px transparent border.
        backgroundImage: `${variant.background}, ${variant.border}`,
        backgroundOrigin: 'padding-box, border-box',
        backgroundClip: 'padding-box, border-box',
        border: '1px solid transparent',
      }}
    >
      <span className="shrink-0 w-6 h-6 flex items-center justify-center">
        <Icon className="w-4 h-4" style={{ color: variant.accent }} />
      </span>

      <div className="flex-1 flex flex-col gap-0.5 min-w-0">
        <p className="m-0 text-[14px] font-semibold text-[#111827] leading-tight">
          {title}
        </p>
        {description && (
          <p className="m-0 text-[12px] font-normal text-[#4B5563] leading-normal">
            {description}
          </p>
        )}
      </div>

      <button
        onClick={() => toast.dismiss(t.id)}
        className="shrink-0 w-6 h-6 flex items-center justify-center text-[#94A3B8] hover:text-[#1A1C29] transition-colors cursor-pointer"
        aria-label="Dismiss"
      >
        <HiX className="w-4 h-4" />
      </button>

      {/* Auto-dismiss countdown bar — shrinks to empty exactly as the toast
          disappears (matches the thin bar Figma shows along the bottom edge). */}
      {t.visible && (
        <div className="absolute left-0 right-0 bottom-0 h-[2.5px] rounded-b-[4px] bg-black/5 overflow-hidden">
          <div
            className="w-full h-full origin-left rounded-[4px]"
            style={{
              backgroundColor: variant.accent,
              animation: `custom-toast-countdown ${duration}ms linear forwards`,
              animationPlayState: isPaused ? 'paused' : 'running',
            }}
          />
        </div>
      )}
    </div>
  );
};

export default CustomToast;
