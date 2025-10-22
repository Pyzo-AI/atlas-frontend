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
  return (
    <div
      className={`flex flex-col ${isPhoneView
        ? "h-full p-2"
        : isMobileView
          ? "h-full p-4"
          : "h-[calc(100vh-156px)] pr-5 border-r border-[#E5E7EB] flex-shrink-0"
        }`}
      style={{ width: isPhoneView ? '100%' : isMobileView ? '100%' : width }}
    >
      {/* Video Section */}
      <div
        className={`bg-white  ${isPhoneView
          ? "flex-1 overflow-hidden mb-2"
          : isMobileView
            ? "flex-1 overflow-hidden mb-3"
            : "rounded-xl border border-[#E5E7EB] min-h-[400px] relative"
          }`}
        style={{ height: isPhoneView ? 'auto' : isMobileView ? 'auto' : height }}
      >
        <SlideVideoSection
          videos={videos}
          currentVideoIndex={currentVideoIndex}
          currentVideoTime={currentVideoTime + 0.1}
          isVideoPlaying={isVideoPlaying}
          videoDuration={videoDuration}
        />
      </div>

      {/* Title and Author Info */}
      <div
        className={`flex justify-between items-center ${isPhoneView
          ? "mt-0"
          : isMobileView
            ? "mt-2"
            : "mt-3 pr-1"
          }`}
      >
        <p
          className={`font-bold font-lato leading-[100%] tracking-[0.02em] m-0 ${isPhoneView
            ? "text-[10px] overflow-hidden text-ellipsis whitespace-nowrap"
            : isMobileView
              ? "text-[16px]"
              : "text-[20px]"
            }`}
        >
          {title || (isPhoneView ? "Corporate Finance" : isMobileView ? "Corporate Finance" : "Untitled")}
        </p>
        <p
          className={`font-semibold font-lato leading-[100%] tracking-[0.02em] m-0 ${isPhoneView
            ? "text-[8px]"
            : isMobileView
              ? "text-[12px]"
              : "text-[14px]"
            }`}
        >
          <span className="text-[#00000080]">By:</span> {author || (isPhoneView ? "Giri Prathap" : isMobileView ? "Giri Prathap" : "Unknown")}
        </p>
      </div>

      {/* Video Playlist Section */}
      <div
        className={
          isPhoneView
            ? "mt-0"
            : isMobileView
              ? "mt-2"
              : ""
        }
      >
        <VideoPlaylist
          videos={videos}
          loading={loading}
          onVideoSelect={onVideoSelect}
          canSkipVideo={canSkipVideo}
          isMobile={isPhoneView}
        />
      </div>
    </div>
  );
};

export default PPTSection;
