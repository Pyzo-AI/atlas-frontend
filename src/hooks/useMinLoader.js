"use client";

import { useEffect, useRef, useState } from "react";

// Same 500ms minimum the full-screen loaders on Home, Chats and Certificates use.
export const MIN_LOADER_MS = 500;

/**
 * In-area loader timing: true as soon as `isLoading` turns true, and kept
 * true for at least `minMs` from then even if loading finishes sooner, so a
 * fast response doesn't just flash the loader for a frame. If loading starts
 * again later, the loader comes back with the same minimum.
 */
export const useMinAreaLoader = (isLoading, minMs = MIN_LOADER_MS) => {
  const [active, setActive] = useState(isLoading);
  const startRef = useRef(0);

  // Latched during render so the loader shows on the same frame loading starts.
  if (isLoading && !active) setActive(true);

  useEffect(() => {
    if (active) startRef.current = Date.now();
  }, [active]);

  useEffect(() => {
    if (!active || isLoading) return;
    const remaining = Math.max(0, minMs - (Date.now() - startRef.current));
    const timer = setTimeout(() => setActive(false), remaining);
    return () => clearTimeout(timer);
  }, [active, isLoading, minMs]);

  return active;
};
