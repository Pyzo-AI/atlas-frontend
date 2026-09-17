import React from "react";
import Image from "next/image";
import { LuCompass, LuMap, LuPhone, LuTriangle, LuZap } from "react-icons/lu";

// Fallback per-tool marks, used only when a product has no real mini icon.
// Ported from pyzo-central-frontend's ToolIcon.tsx so the sidebar tool
// switcher's glyphs stay consistent across every PYZO product frontend.
export const TOOL_ICON_STYLE = {
  compass: { icon: LuCompass, color: "#2877EE" },
  atlas: { icon: LuMap, color: "#8362EA" },
  echo: { icon: LuPhone, color: "#14B8A6" },
  prism: { icon: LuTriangle, color: "#FF8C00" },
  relay: { icon: LuZap, color: "#EF4444" },
};

export default function ToolIcon({ toolId, size = 20, miniIcon }) {
  if (miniIcon) {
    return (
      <span
        className="flex items-center justify-center rounded-full shrink-0 overflow-hidden bg-gray-100 border border-[#E5E7EB] relative"
        style={{ width: size, height: size }}>
        <Image src={miniIcon} alt="" fill className="object-contain p-0.5" unoptimized />
      </span>
    );
  }

  const style = TOOL_ICON_STYLE[toolId];
  if (!style) return null;
  const Icon = style.icon;
  return (
    <span
      className="flex items-center justify-center rounded-[6px] shrink-0"
      style={{ width: size, height: size, background: `${style.color}1A` }}>
      <Icon style={{ color: style.color, width: size * 0.6, height: size * 0.6 }} />
    </span>
  );
}
