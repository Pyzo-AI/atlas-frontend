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
  author
}) => {
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
      />
    </div>
  );
};

export default PPTSection;
