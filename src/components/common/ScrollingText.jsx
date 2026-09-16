"use client";

import { useCallback, useRef, useState } from "react";

// ChatGPT-style sidebar behavior (ported from compass-frontend's ScrollingText.tsx):
// a truncated row label scrolls left on hover just far enough to reveal the
// cut-off tail, then eases back to the start on mouse-leave - instead of a
// tooltip, which forces the eye off the row to read a second, disconnected
// copy of the text.
export default function ScrollingText({ text, className = "", style }) {
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const [isHovering, setIsHovering] = useState(false);
  const [overflow, setOverflow] = useState(0);

  const handleMouseEnter = useCallback(() => {
    const container = containerRef.current;
    const textEl = textRef.current;
    if (!container || !textEl) return;
    const diff = textEl.scrollWidth - container.clientWidth;
    if (diff <= 0) return; // Not truncated - nothing to reveal.
    setOverflow(diff);
    setIsHovering(true);
  }, []);

  const handleMouseLeave = useCallback(() => setIsHovering(false), []);

  // Constant scroll speed so a longer name takes proportionally longer to
  // reveal rather than all names racing across in the same fixed time.
  const PIXELS_PER_SECOND = 35;
  const scrollDuration = Math.max(overflow / PIXELS_PER_SECOND, 0.4);

  return (
    // `style` (font, color, text-align, ...) is applied here rather than on
    // the inner span: text-align only has an effect on the element whose box
    // the inline content sits inside, and every property here is inheritable
    // anyway, so the span picks it all up while still being free to carry
    // its own transform.
    <div
      ref={containerRef}
      className={`overflow-hidden ${className}`}
      style={style}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}>
      <span
        ref={textRef}
        className="inline-block whitespace-nowrap"
        style={{
          transform: `translateX(${isHovering ? -overflow : 0}px)`,
          transitionProperty: "transform",
          // Reveal: slow, constant-speed scroll so it can actually be read.
          // Return: clearly faster than the reveal, but still long enough
          // (and eased-out, so it decelerates into place) to read as a
          // snap-back animation rather than an instant jump.
          transitionDuration: isHovering ? `${scrollDuration}s` : "0.45s",
          transitionTimingFunction: isHovering ? "linear" : "ease-out",
          transitionDelay: isHovering ? "0.3s" : "0s",
        }}>
        {text}
      </span>
    </div>
  );
}
