import React from "react";
import Image from "next/image";

const ProductRecommendationGallery = ({ images, isLooping = true, autoScroll = false, autoScrollInterval = 3000 }) => {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [virtualActiveIndex, setVirtualActiveIndex] = React.useState(0);
  const scrollRef = React.useRef(null);

  const originalLength = images.length;

  // Create virtual list: 5 sets for looping, or [null, ...images, null] for non-looping spacers
  const virtualImages = React.useMemo(() => {
    if (originalLength === 0) return [];
    if (isLooping) {
      return [...images, ...images, ...images, ...images, ...images];
    }
    // Add spacers to the start and end to keep the 'stack' wings visible at the edges
    return [null, ...images, null];
  }, [images, isLooping]);

  const middleStart = isLooping ? originalLength * 2 : originalLength > 0 ? 1 : 0;

  // Initialize scroll position
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

  // Handle Auto Scroll
  const activeIndexRef = React.useRef(virtualActiveIndex);
  React.useEffect(() => {
    activeIndexRef.current = virtualActiveIndex;
  }, [virtualActiveIndex]);

  React.useEffect(() => {
    if (!autoScroll || originalLength <= 1) return;

    const interval = setInterval(() => {
      const container = scrollRef.current;
      if (!container) return;

      const items = container.querySelectorAll(".carousel-item");
      if (!items.length) return;

      // Determine next index
      let nextIndex = virtualActiveIndex + 1;

      if (isLooping) {
        // Continuous flow
      } else {
        if (nextIndex >= virtualImages.length - 1) {
          nextIndex = 1; // Jump back to first image
        }
      }

      const targetItem = items[nextIndex];
      if (targetItem) {
        const itemCenter = targetItem.offsetLeft + targetItem.offsetWidth / 2;
        const containerCenter = container.offsetWidth / 2;
        container.scrollTo({
          left: itemCenter - containerCenter,
          behavior: "smooth",
        });
      }
    }, autoScrollInterval);

    return () => clearInterval(interval);
  }, [autoScroll, autoScrollInterval, isLooping, originalLength, virtualActiveIndex, virtualImages.length]);

  const handleScroll = (e) => {
    const container = e.target;
    const scrollLeft = container.scrollLeft;
    const firstItem = container.querySelector(".carousel-item");
    if (!firstItem) return;

    const itemWidth = firstItem.offsetWidth;

    // Looping silent reset
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
    // Clamping is managed naturally by CSS scroll-snap on .carousel-item
    // Spacer items (null) do not have snap-center, so they won't be centered by the browser.

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
      if (realIndex !== activeIndex) {
        setActiveIndex(realIndex);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-white rounded-xl overflow-hidden border border-gray-100">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex items-center h-full overflow-x-auto snap-x snap-mandatory w-full no-scrollbar px-[10%] py-4">
        {virtualImages.map((item, idx) => {
          const isActive = idx === virtualActiveIndex;
          const distance = Math.abs(idx - virtualActiveIndex);
          const isSpacer = item === null;

          return (
            <div
              key={idx}
              className={`carousel-item h-full flex-shrink-0 w-[80%] flex items-center justify-center pointer-events-none ${!isSpacer || isLooping ? "snap-center snap-always" : ""}`}
              style={{
                perspective: "1000px",
                zIndex: isActive ? 50 : 20 - distance,
                position: "relative",
              }}>
              <a
                href={item?.product_url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className={`
                  transition-all duration-500 ease-in-out relative
                  box-border bg-[#F1F2F4] rounded-[24px] overflow-hidden flex items-center justify-center shadow-md
                  ${isSpacer ? "opacity-0" : ""}
                `}
                style={{
                  width: "100%",
                  aspectRatio: "182/119",
                  transform: isActive
                    ? "scale(1.15) translateX(0) translateZ(0)"
                    : idx < virtualActiveIndex
                      ? "scale(0.85) translateX(35%) translateZ(-150px)"
                      : "scale(0.85) translateX(-35%) translateZ(-150px)",
                  opacity: isSpacer ? 0 : isActive ? 1 : Math.max(0.1, 1 - distance * 0.3),
                  pointerEvents: isActive && !isSpacer ? "auto" : "none",
                }}>
                {!isSpacer && (
                  <div className={`relative w-full h-full transition-all duration-300 ${isActive ? "p-0" : "p-4"}`}>
                    <Image src={item.product_image_url} alt="" fill className="object-contain" unoptimized />
                  </div>
                )}
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProductRecommendationGallery;
