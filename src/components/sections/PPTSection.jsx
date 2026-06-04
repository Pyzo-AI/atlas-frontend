import React, { useRef } from "react";
import VideoPlaylist from "./VideoPlaylist";
import SlideVideoSection from "./SlideVideoSection";
import { useTranslation } from "react-i18next";

const PPTSection = React.forwardRef(
  (
    {
      videos = [],
      loading = false,
      height = null,
      width = "70%",
      currentVideoIndex = 0,
      currentVideoTime = 0,
      isVideoPlaying = false,
      videoDuration = 0,
      title,
      author,
      isMobileView = false,
      isPhoneView = false,
      canSkipVideo = true,
      assessmentDetails = [],
      presentationId,
      onVideoIndexChange,
      isOnlyVideoMode,
      assessmentId,
      showQueryRelatedSlides = false,
      passingScore,
    },
    ref
  ) => {
    const slideVideoRef = useRef(null);
    // Expose pause method to parent component
    React.useImperativeHandle(ref, () => ({
      pauseSlideVideo: () => {
        if (slideVideoRef.current) {
          slideVideoRef.current.pauseSlideVideo();
        }
      },
    }));
    const { t } = useTranslation();
    const effectiveHeight =
      height ||
      (isOnlyVideoMode
        ? isPhoneView
          ? "calc(100vh - 100px)"
          : isMobileView
            ? "calc(100vh - 140px)"
            : "calc(100vh - 200px)"
        : isPhoneView
          ? "calc(100vh - 148px)"
          : isMobileView
            ? "calc(100vh - 180px)"
            : "calc(100vh - 280px)");

    return (
      <div
        className={`flex flex-col ${isOnlyVideoMode ? "overflow-y-auto" : ""} ${
          isPhoneView
            ? "h-full p-2"
            : isMobileView
              ? "h-full p-4"
              : "h-[calc(100vh-156px)] pr-5 border-r border-border-light flex-shrink-0"
        }`}
        style={{ width: isPhoneView ? "100%" : isMobileView ? "100%" : width }}>
        {/* Video Section */}
        <div
          className={`bg-white  ${
            isOnlyVideoMode
              ? isPhoneView
                ? "flex-shrink-0 overflow-hidden mb-2 aspect-video"
                : isMobileView
                  ? "flex-shrink-0 overflow-hidden mb-3 aspect-video"
                  : "rounded-xl border border-border-light flex-shrink-0 aspect-video relative"
              : isPhoneView
                ? "flex-shrink-0 overflow-hidden mb-2 aspect-video"
                : isMobileView
                  ? "flex-shrink-0 overflow-hidden mb-3 aspect-video"
                  : "rounded-xl border border-border-light aspect-video relative mx-auto"
          }`}
          style={{
            width: "100%",
            aspectRatio: "16 / 9",
            maxHeight: effectiveHeight,
            maxWidth: `calc((${effectiveHeight}) * 16 / 9)`,
            margin: "0 auto",
          }}>
          <SlideVideoSection
            ref={slideVideoRef}
            videos={videos}
            currentVideoTime={currentVideoTime + 0.1}
            isVideoPlaying={isVideoPlaying}
            videoDuration={videoDuration}
            assessmentDetails={assessmentDetails}
            isOnlyVideoMode={isOnlyVideoMode}
            presentationId={presentationId}
            onVideoIndexChange={onVideoIndexChange}
            canSkipVideo={canSkipVideo}
            assessmentId={assessmentId}
            showQueryRelatedSlides={showQueryRelatedSlides}
            passingScore={passingScore}
          />
        </div>

        {/* Title and Author Info */}
        <div
          className={`flex justify-between items-center ${isPhoneView ? "mt-2" : isMobileView ? "mt-2" : "mt-3 pr-1"}`}>
          <p
            className={`font-bold font-lato leading-[100%] tracking-[0.02em] m-0 ${
              isPhoneView
                ? "text-[10px] overflow-hidden text-ellipsis whitespace-nowrap"
                : isMobileView
                  ? "text-[16px]"
                  : "text-[20px]"
            }`}>
            {title || t("lectures.untitledPresentation")}
          </p>
          <p
            className={`font-semibold font-lato leading-[100%] tracking-[0.02em] m-0 ${
              isPhoneView ? "text-[8px]" : isMobileView ? "text-[12px]" : "text-[14px]"
            }`}>
            <span className="text-primary-text-muted">{t("lectures.by")}</span>{" "}
            {author || t("lectures.unknownAuthor")}
          </p>
        </div>

        {/* Video Playlist Section */}
        {!isOnlyVideoMode && (
          <div
            className={`flex-1 min-h-0 ${
              isPhoneView ? "mt-1" : isMobileView ? "mt-2" : ""
            }`}>
            <VideoPlaylist
              videos={videos}
              loading={loading}
              canSkipVideo={canSkipVideo}
              isMobile={isPhoneView}
              assessmentDetails={assessmentDetails}
            />
          </div>
        )}
      </div>
    );
  }
);

PPTSection.displayName = "PPTSection";

export default PPTSection;
