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
  if (isMobileView) {
    // Dynamic adjustments for phone vs larger mobile
    const padding = isPhoneView ? "p-2" : "p-4";
    const marginBottom = isPhoneView ? "mb-2" : "mb-3";
    const marginTop = isPhoneView ? "mt-0" : "mt-2";
    const titleText = isPhoneView ? "text-[10px]" : "text-[16px]";
    const authorText = isPhoneView ? "text-[8px]" : "text-[12px]";

    return (
      <div className={`flex flex-col h-full ${padding}`}>
        {/* Slide Section - Main content area */}
        <div className={`flex-1 bg-white overflow-hidden ${marginBottom}`}>
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
          <p
            className={`font-bold ${titleText} leading-[100%] tracking-[0.02em] font-lato ${
              isPhoneView ? "truncate" : ""
            }`}>
            {title || "Corporate Finance"}
          </p>
          <p className={`font-semibold ${authorText} leading-[100%] tracking-[0.02em] font-lato`}>
            <span className="text-[#00000080]">By:</span> {author || "Giri Prathap"}
          </p>
        </div>

        {/* Video Playlist Section */}
        <div className={marginTop}>
          <VideoPlaylist
            videos={videos}
            loading={loading}
            onVideoSelect={onVideoSelect}
            canSkipVideo={canSkipVideo}
            isMobile={isPhoneView ? true : false}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-156px)] pr-5 border-r border-[#E5E7EB] flex-shrink-0" style={{ width }}>
      {/* Video Section */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] min-h-[400px] relative" style={{ height }}>
        <SlideVideoSection
          videos={videos}
          currentVideoIndex={currentVideoIndex}
          currentVideoTime={currentVideoTime + 0.1}
          isVideoPlaying={isVideoPlaying}
          videoDuration={videoDuration}
        />
      </div>
      <div className="mt-3 flex justify-between items-center pr-1">
        <p className="font-bold text-[20px] leading-[100%] tracking-[0.02em] font-lato">{title || "Untitled"}</p>

        <p className="font-semibold text-[14px] leading-[100%] tracking-[0.02em] font-lato">
          <span className="text-[#00000080]">By:</span> {author || "Unknown"}
        </p>
      </div>

      {/* Video Playlist Section */}
      <VideoPlaylist videos={videos} loading={loading} onVideoSelect={onVideoSelect} canSkipVideo={canSkipVideo} />
    </div>
  );
};

export default PPTSection;
