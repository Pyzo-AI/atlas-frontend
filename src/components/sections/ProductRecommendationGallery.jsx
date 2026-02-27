import React from "react";
import Image from "next/image";

const ProductImageContent = ({ imageUrl }) => {
  const isMultiple = Array.isArray(imageUrl);
  if (isMultiple) {
    const slots = imageUrl.slice(0, Math.min(imageUrl.length, 2));
    return (
      <div className="w-full h-full flex gap-[2.5%] p-[3%]" style={{ boxSizing: "border-box" }}>
        {slots.map((url, i) => (
          <div key={i} className="relative flex-1 h-full overflow-hidden" style={{ background: "#FFFFFF", borderRadius: "12px" }}>
            <Image draggable={false} src={url} alt="" fill className="object-contain p-[8%]" unoptimized />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="relative w-full h-full p-[8%]">
      <Image draggable={false} src={imageUrl} alt="" fill className="object-contain" unoptimized />
    </div>
  );
};

const CardShell = ({ children, isSpacer, href, onClick }) => {
  const inner = (
    <div
      className="w-full h-full overflow-hidden relative"
      style={{ background: "#E2E5EE", borderRadius: "16px", border: "1px solid rgba(0,0,0,0.06)", opacity: isSpacer ? 0 : 1 }}
    >
      {children}
    </div>
  );
  if (href && href !== "#") {
    return <a href={href} target="_blank" rel="noopener noreferrer" onClick={onClick} className="w-full h-full block">{inner}</a>;
  }
  return inner;
};

// Pure CSS-transition snap — NO RAF scroll, no spring fighting React renders.
// scrollTo({ behavior: "smooth" }) is used ONLY after drag ends (not during).
// During drag: raw scrollLeft = 1:1 tracking, zero lag.

const ProductRecommendationGallery = ({
  images,
  isLooping = true,
  autoScroll = false,
  autoScrollInterval = 3000,
}) => {
  const originalLength = images.length;

  const virtualImages = React.useMemo(() => {
    if (originalLength === 0) return [];
    if (isLooping) return [...images, ...images, ...images, ...images, ...images];
    return [null, ...images, null];
  }, [images, isLooping, originalLength]);

  const middleStart = isLooping ? originalLength * 2 : 1;

  const [virtualActiveIndex, setVirtualActiveIndex] = React.useState(middleStart);
  const [isHovered, setIsHovered] = React.useState(false);

  const scrollRef  = React.useRef(null);
  const vIdxRef    = React.useRef(middleStart);
  const snapLock   = React.useRef(false); // prevent scroll handler from interfering during snap

  const commitIndex = React.useCallback((vIdx) => {
    vIdxRef.current = vIdx;
    setVirtualActiveIndex(vIdx);
  }, []);

  // Get the exact scrollLeft that centers a carousel item
  const getScrollFor = React.useCallback((idx) => {
    const el = scrollRef.current;
    if (!el) return 0;
    const items = el.querySelectorAll(".carousel-item");
    const item  = items[idx];
    if (!item) return el.scrollLeft;
    return item.offsetLeft + item.offsetWidth / 2 - el.offsetWidth / 2;
  }, []);

  // Native smooth scroll — browser handles the easing, zero jank
  const smoothScrollTo = React.useCallback((left) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left, behavior: "smooth" });
  }, []);

  const snapToIndex = React.useCallback((rawIdx) => {
    const el = scrollRef.current;
    if (!el) return;
    const total = virtualImages.length;
    const idx   = isLooping ? rawIdx : Math.max(1, Math.min(total - 2, rawIdx));

    snapLock.current = true;
    commitIndex(idx);
    smoothScrollTo(getScrollFor(idx));

    // Unlock after scroll settles, then reposition for infinite loop
    setTimeout(() => {
      snapLock.current = false;
      if (!isLooping) return;
      const items = el.querySelectorAll(".carousel-item");
      const itemW = items[0]?.offsetWidth ?? 0;
      if (!itemW) return;
      const span = itemW * originalLength;
      const sl   = el.scrollLeft;
      let shift = 0, idxShift = 0;
      if      (sl < span)     { shift =  span * 2; idxShift =  originalLength * 2; }
      else if (sl > span * 4) { shift = -span * 2; idxShift = -originalLength * 2; }
      if (shift) {
        el.scrollLeft = sl + shift;
        const n = idx + idxShift;
        vIdxRef.current = n;
        setVirtualActiveIndex(n);
      }
    }, 420);
  }, [isLooping, originalLength, virtualImages.length, getScrollFor, smoothScrollTo, commitIndex]);

  // Init
  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el || originalLength === 0) return;
    requestAnimationFrame(() => {
      el.scrollLeft = getScrollFor(middleStart);
      commitIndex(middleStart);
    });
  }, [originalLength, isLooping, middleStart, getScrollFor, commitIndex]);

  // ── Drag ──────────────────────────────────────────────────────────────────
  const isDragging  = React.useRef(false);
  const startX      = React.useRef(0);
  const startScroll = React.useRef(0);
  const startTime   = React.useRef(0);
  const hasDragged  = React.useRef(false);
  const moveRef     = React.useRef(null);
  const upRef       = React.useRef(null);

  const FLICK_DIST   = 55;
  const RELEASE_DIST = 36;
  const FLICK_VEL    = 0.26;

  const cleanup = () => {
    if (moveRef.current) { window.removeEventListener("mousemove", moveRef.current); moveRef.current = null; }
    if (upRef.current)   { window.removeEventListener("mouseup",   upRef.current);   upRef.current   = null; }
  };

  const finishDrag = React.useCallback((endX) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    cleanup();
    if (scrollRef.current) scrollRef.current.style.cursor = "grab";

    const dx  = endX - startX.current;
    const vel = Math.abs(dx) / Math.max(Date.now() - startTime.current, 1);
    let target = vIdxRef.current;
    if (Math.abs(dx) > RELEASE_DIST || vel > FLICK_VEL) {
      target = dx < 0 ? vIdxRef.current + 1 : vIdxRef.current - 1;
    }
    snapToIndex(target);
  }, [snapToIndex]);

  const handleMouseDown = React.useCallback((e) => {
    isDragging.current  = true;
    hasDragged.current  = false;
    startX.current      = e.pageX;
    startScroll.current = scrollRef.current.scrollLeft;
    startTime.current   = Date.now();
    scrollRef.current.style.cursor = "grabbing";

    moveRef.current = (ev) => {
      if (!isDragging.current) return;
      ev.preventDefault();
      const dx = ev.pageX - startX.current;
      if (Math.abs(dx) > 4) hasDragged.current = true;
      // Pure 1:1 tracking — no easing, no RAF, no state updates during drag
      scrollRef.current.scrollLeft = startScroll.current - dx;

      // Auto-snap when flicked far enough
      if (Math.abs(dx) > FLICK_DIST) {
        isDragging.current = false;
        scrollRef.current.style.cursor = "grab";
        cleanup();
        snapToIndex(dx < 0 ? vIdxRef.current + 1 : vIdxRef.current - 1);
      }
    };
    upRef.current = (ev) => finishDrag(ev.pageX);
    window.addEventListener("mousemove", moveRef.current);
    window.addEventListener("mouseup",   upRef.current);
  }, [finishDrag, snapToIndex]);

  React.useEffect(() => {
    const onBlur = () => { if (isDragging.current) finishDrag(startX.current); };
    window.addEventListener("blur", onBlur);
    return () => window.removeEventListener("blur", onBlur);
  }, [finishDrag]);

  const handleLinkClick = (e) => { if (hasDragged.current) e.preventDefault(); };

  // ── Touch ─────────────────────────────────────────────────────────────────
  const touchX       = React.useRef(0);
  const touchScroll  = React.useRef(0);
  const touchTime    = React.useRef(0);
  const touchSnapped = React.useRef(false);

  const handleTouchStart = (e) => {
    touchX.current      = e.touches[0].clientX;
    touchScroll.current = scrollRef.current.scrollLeft;
    touchTime.current   = Date.now();
    hasDragged.current  = false;
    touchSnapped.current = false;
  };

  const handleTouchMove = (e) => {
    if (touchSnapped.current) return;
    const dx = e.touches[0].clientX - touchX.current;
    if (Math.abs(dx) > 4) hasDragged.current = true;
    scrollRef.current.scrollLeft = touchScroll.current - dx;
    if (Math.abs(dx) > FLICK_DIST) {
      touchSnapped.current = true;
      snapToIndex(dx < 0 ? vIdxRef.current + 1 : vIdxRef.current - 1);
    }
  };

  const handleTouchEnd = (e) => {
    if (touchSnapped.current) return;
    const touch = e.changedTouches?.[0];
    const dx    = touch ? touch.clientX - touchX.current : 0;
    const vel   = Math.abs(dx) / Math.max(Date.now() - touchTime.current, 1);
    let target  = vIdxRef.current;
    if (Math.abs(dx) > RELEASE_DIST || vel > FLICK_VEL) {
      target = dx < 0 ? vIdxRef.current + 1 : vIdxRef.current - 1;
    }
    snapToIndex(target);
  };

  // ── Auto scroll ───────────────────────────────────────────────────────────
  React.useEffect(() => {
    if (!autoScroll || originalLength <= 1 || isHovered) return;
    const id = setInterval(() => snapToIndex(vIdxRef.current + 1), autoScrollInterval);
    return () => clearInterval(id);
  }, [autoScroll, autoScrollInterval, originalLength, isHovered, snapToIndex]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className="flex flex-col items-center justify-center w-full h-full overflow-hidden"
      style={{ background: "#EEF1F8", borderRadius: "16px" }}
    >
      <div
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        onMouseLeave={() => setIsHovered(false)}
        onMouseEnter={() => setIsHovered(true)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="flex items-center h-full overflow-x-hidden w-full no-scrollbar"
        style={{ cursor: "grab", paddingLeft: "10%", paddingRight: "10%", gap: "3%" }}
      >
        {virtualImages.map((item, idx) => {
          const isActive = idx === virtualActiveIndex;
          const distance = Math.abs(idx - virtualActiveIndex);
          const isSpacer = item === null;

          const scale      = isActive ? 1 : Math.max(0.38, 1 - distance * 0.28);
          const translateX = isActive ? 0 : idx < virtualActiveIndex ? (1 - scale) * 48 : -(1 - scale) * 48;
          const opacity    = isSpacer ? 0 : isActive ? 1 : Math.max(0.08, 1 - distance * 0.45);

          return (
            <div
              key={idx}
              className="carousel-item shrink-0 flex items-center justify-center h-full"
              style={{ width: "76%", zIndex: isActive ? 50 : Math.max(1, 20 - distance), position: "relative" }}
            >
              <div
                className="w-full"
                style={{
                  aspectRatio: "378/245",
                  transform: `scale(${scale}) translateX(${translateX}%)`,
                  opacity,
                  pointerEvents: isActive && !isSpacer ? "auto" : "none",
                  transition: "transform 0.45s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.4s ease-out",
                  willChange: "transform, opacity",
                }}
              >
                <CardShell isSpacer={isSpacer} href={item?.product_url || "#"} onClick={handleLinkClick}>
                  {!isSpacer && <ProductImageContent imageUrl={item.product_image_url} />}
                </CardShell>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProductRecommendationGallery;