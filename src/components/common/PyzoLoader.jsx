"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import pyzoLoader from "@/assets/gif/pyzo-loader.gif";

/**
 * Ported verbatim from pyzo-central-frontend's PyzoLoader.tsx so loading
 * states look identical across PYZO product frontends.
 *
 * @param {boolean} fullScreen - Reserves the full viewport (minus the 48px
 *   header) for a loader that stands in for the entire route. Set false when
 *   nesting inside page chrome that's already rendered.
 * @param {string} heightClassName - Fixed height (Tailwind classes, e.g.
 *   "min-h-[220px] sm:min-h-[490px]") matching the space the real content
 *   will occupy once loaded — e.g. a card grid — so swapping the loader in
 *   and out doesn't shift the page. When omitted (and fullScreen is false),
 *   falls back to measuring the remaining viewport height below the loader.
 */
export default function PyzoLoader({ fullScreen = true, heightClassName = "" }) {
  const containerRef = useRef(null);
  const [availableHeight, setAvailableHeight] = useState(null);
  const useDynamicHeight = !fullScreen && !heightClassName;

  useLayoutEffect(() => {
    if (!useDynamicHeight) return;

    const updateHeight = () => {
      if (!containerRef.current) return;
      const top = containerRef.current.getBoundingClientRect().top;
      const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
      setAvailableHeight(Math.max(0, viewportHeight - top));
    };

    updateHeight();
    window.addEventListener("resize", updateHeight);
    window.visualViewport?.addEventListener("resize", updateHeight);

    return () => {
      window.removeEventListener("resize", updateHeight);
      window.visualViewport?.removeEventListener("resize", updateHeight);
    };
  }, [useDynamicHeight]);

  return (
    <div
      ref={containerRef}
      className={`flex items-center justify-center bg-white w-full ${
        fullScreen ? "min-h-[calc(100vh-3rem)]" : heightClassName
      }`}
      style={useDynamicHeight && availableHeight !== null ? { height: availableHeight } : undefined}>
      <Image src={pyzoLoader} alt="Loading..." width={200} height={200} priority unoptimized />
    </div>
  );
}
