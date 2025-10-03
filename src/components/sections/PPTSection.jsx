import React from "react";
import VideoPlaylist from "./VideoPlaylist";
import SlideVideoSection from "./SlideVideoSection";

const PPTSection = ({
  videos = [],
  loading = false,
  height = "calc(100vh - 240px)",
  width = "70%",
  currentVideoIndex = 0,
  currentVideoTime = 0,
  isVideoPlaying = false,
  videoDuration = 0,
  onVideoSelect,
  title,
  author,
  isMobileView = false,
  isPhoneView = false,
  canSkipVideo = true,
}) => {
  // Phone view - optimized for 70% width with compact layout
  if (isMobileView && isPhoneView) {
    return (
      <div className="flex flex-col h-full p-2">
        {/* Slide Section - Main content area */}
        <div className="flex-1 bg-white overflow-hidden mb-2">
          <SlideVideoSection
            videos={videos}
            currentVideoIndex={currentVideoIndex}
            currentVideoTime={currentVideoTime + 0.1}
            isVideoPlaying={isVideoPlaying}
            videoDuration={videoDuration}
          />
        </div>

        {/* Bottom info section - Compact for phones */}
        <div className="flex justify-between items-center">
          <p className="font-bold text-[10px] leading-[100%] tracking-[0.02em] font-lato truncate">
            {title || "Corporate Finance"}
          </p>
          <p className="font-semibold text-[8px] leading-[100%] tracking-[0.02em] font-lato">
            <span className="text-[#00000080]">By:</span>{" "}
            {author || "Giri Prathap"}
          </p>
        </div>

        {/* Video Playlist Section - Very compact for phones */}
        <div className="mt-0">
          <VideoPlaylist
            videos={videos}
            loading={loading}
            onVideoSelect={onVideoSelect}
            isMobile={true}
          />
        </div>
      </div>
    );
  }

  // Tablet view - adjust for landscape layout with proper padding
  if (isMobileView) {
    return (
      <div className="flex flex-col h-full p-4">
        {/* Slide Section - Main content area */}
        <div className="flex-1 bg-white overflow-hidden mb-3">
          <SlideVideoSection
            videos={videos}
            currentVideoIndex={currentVideoIndex}
            currentVideoTime={currentVideoTime + 0.1}
            isVideoPlaying={isVideoPlaying}
            videoDuration={videoDuration}
          />
        </div>

        {/* Bottom info section */}
        <div className="flex justify-between items-center">
          <p className="font-bold text-[16px] leading-[100%] tracking-[0.02em] font-lato">
            {title || "Corporate Finance"}
          </p>
          <p className="font-semibold text-[12px] leading-[100%] tracking-[0.02em] font-lato">
            <span className="text-[#00000080]">By:</span>{" "}
            {author || "Giri Prathap"}
          </p>
        </div>

        {/* Video Playlist Section - Compact for mobile */}
        <div className="mt-2">
          <VideoPlaylist
            videos={videos}
            loading={loading}
            onVideoSelect={onVideoSelect}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col h-[calc(100vh-156px)] pr-5 border-r border-[#E5E7EB] flex-shrink-0"
      style={{ width }}
    >
      {/* Video Section */}
      <div
        className="bg-white rounded-xl border border-[#E5E7EB] min-h-[400px] relative"
        style={{ height }}
      >
        <SlideVideoSection
          videos={videos}
          currentVideoIndex={currentVideoIndex}
          currentVideoTime={currentVideoTime + 0.1}
          isVideoPlaying={isVideoPlaying}
          videoDuration={videoDuration}
        />
      </div>
      <div className="mt-3 flex justify-between items-center pr-1">
        <p className="font-bold text-[20px] leading-[100%] tracking-[0.02em] font-lato">
          {title || "Untitled"}
        </p>

        <p className="font-semibold text-[14px] leading-[100%] tracking-[0.02em] font-lato">
          <span className="text-[#00000080]">By:</span> {author || "Unknown"}
        </p>
      </div>

      {/* Video Playlist Section */}
      <VideoPlaylist
        videos={videos}
        loading={loading}
        onVideoSelect={onVideoSelect}
        canSkipVideo={canSkipVideo}
      />
    </div>
  );
};

export default PPTSection;
