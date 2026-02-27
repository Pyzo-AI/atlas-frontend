import React from "react";
import Image from "next/image";

/**
 * Renders product image(s).
 * Single: centered product on light-gray card bg.
 * Multi:  two white panels side-by-side inside a light-gray card bg.
 * Wing (neighbour card): same layout but visually smaller due to scale transform.
 */
const ProductImageContent = ({ imageUrl, isActive, isWing = false }) => {
  const isMultiple = Array.isArray(imageUrl);

  if (isMultiple) {
    const slots = imageUrl.slice(0, Math.min(imageUrl.length, 2));

    return (
      // Gray container fills entire card shell inner area, panels sit inside with padding
      <div
        className="w-full h-full flex gap-[2.5%] p-[3%]"
        style={{ boxSizing: "border-box" }}
      >
        {slots.map((url, i) => (
          <div
            key={i}
            className="relative flex-1 h-full overflow-hidden"
            style={{
              background: "#FFFFFF",
              borderRadius: "12px",
            }}
          >
            <Image
              draggable={false}
              src={url}
              alt=""
              fill
              className="object-contain p-[8%]"
              unoptimized
            />
          </div>
        ))}
      </div>
    );
  }

  // Single image — centered, no extra wrapper
  return (
    <div className="relative w-full h-full p-[8%]">
      <Image
        draggable={false}
        src={imageUrl}
        alt=""
        fill
        className="object-contain"
        unoptimized
      />
    </div>
  );
};

/**
 * Card shell.
 * Active card  : white bg, subtle border, rounded-2xl — matches Figma center card.
 * Wing card    : same shell but scaled down externally via transform.
 * Spacer       : invisible placeholder so the first/last real cards can be centred.
 */
const CardShell = ({ children, isSpacer, isActive, href, onClick }) => {
  const inner = (
    <div
      className="w-full h-full overflow-hidden relative"
      style={{
        background: "#1A1A1A12",
        borderRadius: "16px",
        boxSizing: "border-box",
        opacity: isSpacer ? 0 : 1,
        // border: "1px solid rgba(0,0,0,0.06)",
      }}
    >
      {children}
    </div>
  );

  if (href && href !== "#") {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" onClick={onClick} className="w-full h-full block">
        {inner}
      </a>
    );
  }
  return inner;
};

const ProductRecommendationGallery = ({
  images,
  isLooping = true,
  autoScroll = false,
  autoScrollInterval = 3000,
}) => {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [virtualActiveIndex, setVirtualActiveIndex] = React.useState(0);
  const [isHovered, setIsHovered] = React.useState(false);
  const scrollRef = React.useRef(null);

  // Drag-to-scroll
  const isDragging = React.useRef(false);
  const dragStartX = React.useRef(0);
  const dragScrollLeft = React.useRef(0);
  const hasDragged = React.useRef(false);

  const handleMouseDown = (e) => {
    isDragging.current = true;
    hasDragged.current = false;
    dragStartX.current = e.pageX;
    dragScrollLeft.current = scrollRef.current.scrollLeft;
    scrollRef.current.style.cursor = "grabbing";
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const dx = e.pageX - dragStartX.current;
    if (Math.abs(dx) > 5) hasDragged.current = true;
    scrollRef.current.scrollLeft = dragScrollLeft.current - dx;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    if (scrollRef.current) scrollRef.current.style.cursor = "grab";
  };

  const handleLinkClick = (e) => {
    if (hasDragged.current) e.preventDefault();
  };

  // Touch
  const touchStartX = React.useRef(0);
  const touchScrollLeft = React.useRef(0);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchScrollLeft.current = scrollRef.current.scrollLeft;
    hasDragged.current = false;
  };

  const handleTouchMove = (e) => {
    const dx = e.touches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 5) hasDragged.current = true;
    scrollRef.current.scrollLeft = touchScrollLeft.current - dx;
  };

  const originalLength = images.length;

  const virtualImages = React.useMemo(() => {
    if (originalLength === 0) return [];
    if (isLooping) {
      return [...images, ...images, ...images, ...images, ...images];
    }
    return [null, ...images, null];
  }, [images, isLooping]);

  const middleStart = isLooping ? originalLength * 2 : originalLength > 0 ? 1 : 0;

  React.useEffect(() => {
    if (scrollRef.current && originalLength > 0) {
      const container = scrollRef.current;
      const firstItem = container.querySelector(".carousel-item");
      if (firstItem) {
        const itemWidth = firstItem.offsetWidth;
        container.scrollLeft = itemWidth * middleStart;
        setVirtualActiveIndex(middleStart);
      }
    }
  }, [originalLength, isLooping]);

  const activeIndexRef = React.useRef(virtualActiveIndex);
  React.useEffect(() => {
    activeIndexRef.current = virtualActiveIndex;
  }, [virtualActiveIndex]);

  React.useEffect(() => {
    if (!autoScroll || originalLength <= 1 || isHovered) return;
    const interval = setInterval(() => {
      const container = scrollRef.current;
      if (!container) return;
      const items = container.querySelectorAll(".carousel-item");
      if (!items.length) return;
      let nextIndex = activeIndexRef.current + 1;
      if (!isLooping && nextIndex >= virtualImages.length - 1) nextIndex = 1;
      const targetItem = items[nextIndex];
      if (targetItem) {
        const itemCenter = targetItem.offsetLeft + targetItem.offsetWidth / 2;
        container.scrollTo({ left: itemCenter - container.offsetWidth / 2, behavior: "smooth" });
      }
    }, autoScrollInterval);
    return () => clearInterval(interval);
  }, [autoScroll, autoScrollInterval, isLooping, originalLength, virtualImages.length, isHovered]);

  const handleScroll = (e) => {
    const container = e.target;
    const scrollLeft = container.scrollLeft;
    const firstItem = container.querySelector(".carousel-item");
    if (!firstItem) return;
    const itemWidth = firstItem.offsetWidth;

    if (isLooping) {
      const originalWidth = itemWidth * originalLength;
      if (scrollLeft < originalWidth) {
        container.scrollLeft = scrollLeft + originalWidth * 2;
        return;
      } else if (scrollLeft > originalWidth * 4) {
        container.scrollLeft = scrollLeft - originalWidth * 2;
        return;
      }
    }

    const center = scrollLeft + container.offsetWidth / 2;
    let closestIndex = isLooping ? 0 : 1;
    let minDistance = Infinity;
    const items = container.querySelectorAll(".carousel-item");
    items.forEach((item, index) => {
      const itemCenter = item.offsetLeft + item.offsetWidth / 2;
      const distance = Math.abs(center - itemCenter);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    });

    if (closestIndex !== virtualActiveIndex) {
      setVirtualActiveIndex(closestIndex);
      const realIndex = isLooping
        ? closestIndex % originalLength
        : Math.max(0, Math.min(originalLength - 1, closestIndex - 1));
      if (realIndex !== activeIndex) setActiveIndex(realIndex);
    }
  };

  return (
    <div
      className="flex flex-col items-center justify-center w-full h-full overflow-hidden"
      style={{
        background: "#F8FAFF",
        borderRadius: "16px",
      }}
    >
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={(e) => { setIsHovered(false); handleMouseUp(e); }}
        onMouseEnter={() => setIsHovered(true)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        className="flex items-center h-full overflow-x-auto snap-x snap-mandatory w-full no-scrollbar"
        style={{ cursor: "grab", paddingLeft: "10%", paddingRight: "10%" }}
      >
        {virtualImages.map((item, idx) => {
          const isActive = idx === virtualActiveIndex;
          const distance = Math.abs(idx - virtualActiveIndex);
          const isSpacer = item === null;
          const isWing = !isSpacer && distance === 1;

          // Active = full size, wings ~0.52, further smaller
          const scale = isActive ? 1 : Math.max(0.38, 1 - distance * 0.28);

          // Nudge wing cards inward so they peek naturally
          const translateX = isActive
            ? 0
            : idx < virtualActiveIndex
              ? (1 - scale) * 48
              : -(1 - scale) * 48;

          // Wings clearly faded
          const opacity = isSpacer
            ? 0
            : isActive
              ? 1
              : Math.max(0.08, 1 - distance * 0.45);

          return (
            <div
              key={idx}
              className={`carousel-item shrink-0 flex items-center justify-center h-full ${
                !isSpacer || isLooping ? "snap-center snap-always" : ""
              }`}
              style={{
                width: "80%",
                zIndex: isActive ? 50 : Math.max(1, 20 - distance),
                position: "relative",
              }}
            >
              <div
                className="w-full transition-all duration-500 ease-in-out"
                style={{
                  // Aspect ratio from Figma: 378/245
                  aspectRatio: "378/245",
                  transform: `scale(${scale}) translateX(${translateX}%)`,
                  opacity,
                  pointerEvents: isActive && !isSpacer ? "auto" : "none",
                }}
              >
                <CardShell
                  isSpacer={isSpacer}
                  isActive={isActive}
                  href={item?.product_url || "#"}
                  onClick={handleLinkClick}
                >
                  {!isSpacer && (
                    <ProductImageContent
                      imageUrl={item.product_image_url}
                      isActive={isActive}
                      isWing={isWing}
                    />
                  )}
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