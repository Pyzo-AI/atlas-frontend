import React, { useRef, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setCurrentVideoIndex } from "@/store/features/videoSlice";

const VideoPlaylist = ({ videos = [], loading = false, onVideoSelect }) => {
  const dispatch = useDispatch();
  const { currentVideoIndex } = useSelector((state) => state.video);
  const scrollContainerRef = useRef(null);
  const videoItemRefs = useRef([]);
  const [showFade, setShowFade] = useState(false);

  const formatDuration = (duration) => {
    if (!duration) return "0:00";
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Check if fade should be shown based on scroll position
  const checkScrollPosition = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const isScrolledToEnd = container.scrollLeft + container.clientWidth >= container.scrollWidth - 10; // 10px threshold
      setShowFade(!isScrolledToEnd);
    }
  };

  // Auto-scroll to current video when currentVideoIndex changes
  useEffect(() => {
    if (videoItemRefs.current[currentVideoIndex] && scrollContainerRef.current) {
      const currentVideoElement = videoItemRefs.current[currentVideoIndex];
      const container = scrollContainerRef.current;

      // Get the position of the current video item relative to the container
      const containerRect = container.getBoundingClientRect();
      const itemRect = currentVideoElement.getBoundingClientRect();
      const containerScrollLeft = container.scrollLeft;
      const itemOffsetLeft = currentVideoElement.offsetLeft;

      // Calculate if the item is out of view
      const isOutOfViewLeft = itemRect.left < containerRect.left;
      const isOutOfViewRight = itemRect.right > containerRect.right;

      // Calculate scroll position to center the item
      if (isOutOfViewLeft || isOutOfViewRight) {
        const scrollTo = itemOffsetLeft - (container.clientWidth / 2) + (itemRect.width / 2);
        container.scrollTo({
          left: scrollTo,
          behavior: 'smooth'
        });
      }
    }
  }, [currentVideoIndex]);

  // Check scroll position on mount and when videos change
  useEffect(() => {
    checkScrollPosition();
  }, [videos]);

  // Add scroll event listener to update fade visibility
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollPosition);
      return () => container.removeEventListener('scroll', checkScrollPosition);
    }
  }, []);

  const handleVideoSelect = (index) => {
    if (onVideoSelect) {
      // Use the callback from VideoPanel if provided
      onVideoSelect(index);
    } else {
      // Fallback to direct dispatch if no callback provided
      if (index !== currentVideoIndex) {
        dispatch(setCurrentVideoIndex(index));
      }
    }
  };

  if (loading) {
    return (
      <div className="mt-3 bg-white rounded-xl border border-[#E5E7EB]">
        <div className="px-5 py-4">
          <div className="flex overflow-x-auto gap-2 pb-2 pt-1 pr-1">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex-shrink-0 w-[119px] h-[68px] bg-white border border-[#E5E7EB] rounded-lg animate-pulse"
              >
                <div className="p-2 flex flex-col gap-1.5">
                  <div className="h-7 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl relative">
      <div 
        ref={scrollContainerRef} 
        className="overflow-x-auto overflow-y-visible"
        style={{ scrollBehavior: 'smooth' }}
      >
        <div className="flex gap-2 pb-1.5 pt-5 overflow-y-visible">
          {videos.map((video, index) => (
            <div
              key={index}
              ref={(el) => (videoItemRefs.current[index] = el)}
              onClick={() => handleVideoSelect(index)}
              className={`relative flex-shrink-0 w-[119px] h-[68px] rounded-lg cursor-pointer transition-all duration-200 overflow-visible scroll-ml-4 ${
                currentVideoIndex === index
                  ? "bg-[#E7F0FE] border-2 border-[#5396FF] shadow-md"
                  : "bg-white border border-[#E5E7EB] hover:bg-[#F8F9FA]"
              }`}
            >
              {/* Video Info Container - using padding instead of absolute positioning */}
              <div className="p-2 flex flex-col gap-1.5">
                <h4 className="font-lato font-medium text-[12px] leading-[14px] tracking-[0.02em] text-[#1A1C29] line-clamp-2">
                  {video.title || "Untitled Video"}
                </h4>
                <div className="font-lato font-normal text-[10px] leading-[100%] align-middle text-[rgba(26,28,41,0.7)]">
                  {formatDuration(video.duration) || "0:00"}
                </div>
              </div>

              {/* Status indicator - keeping absolute position as requested */}
              {currentVideoIndex > index && (
                <div className="absolute w-3 h-3 -right-1 -top-1 bg-[#1EA356] rounded-full flex items-center justify-center z-50 overflow-visible">
                  <svg
                    className="w-[9.6px] h-[9.6px] text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      {/* Conditional fade effect - only show when there are more videos to scroll to */}
      {showFade && (
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-r from-transparent to-white pointer-events-none"></div>
      )}
    </div>
  );
};

export default VideoPlaylist;