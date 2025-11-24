import React, { useRef, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setSelectedAssessmentId } from "@/store/features/videoSlice";
import InModuleAssessment from "./InModuleAssessment";
import VideoPlayerContainer from "../VideoPlayerContainer";

const SlideVideoSection = React.forwardRef(({
  videos,
  // currentVideoTime = 0,
  isVideoPlaying = false,
  videoDuration = 0,
  assessmentDetails = [],
  isOnlyVideoMode = false,
  onVideoIndexChange,
  presentationId,
  canSkipVideo,
  assessmentId
}, ref) => {
  const dispatch = useDispatch();
  const { currentVideoIndex ,currentVideoTime} = useSelector((state) => state.video);
  const slideVideoRef = useRef(null);
  const preloadSlideVideoRef = useRef(null);
  const videoPlayerContainerRef = useRef(null);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [preloadedSlideIndex, setPreloadedSlideIndex] = useState(-1);
  const [hasSlideInitialized, setHasSlideInitialized] = useState(false);
  const [lastSlideSrc, setLastSlideSrc] = useState("");
  const [canPlay, setCanPlay] = useState(false);
  const [isLoadingNewVideo, setIsLoadingNewVideo] = useState(false);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(false);
  const playPromiseRef = useRef(null);
  const { answerPptIndex, selectedAssessmentId,isQuestionMode } = useSelector((state) => state.video);

  // Expose pause method to parent component
  React.useImperativeHandle(ref, () => ({
    pauseSlideVideo: () => {
      if (isOnlyVideoMode && videoPlayerContainerRef.current) {
        videoPlayerContainerRef.current.pauseVideo();
      } else if (slideVideoRef.current && !slideVideoRef.current.paused) {
        slideVideoRef.current.pause();
      }
    }
  }));

  // Sync slide video with trainer video time
  useEffect(() => {
    if (answerPptIndex !== null) {
      return;
    }

    if (slideVideoRef.current && videos?.[currentVideoIndex]?.slide_video) {
      const slideVideo = slideVideoRef.current;
      const timeDifference = Math.abs(slideVideo.currentTime - currentVideoTime);

      if (timeDifference > 0.1 && slideVideo.readyState >= 2) {
        try {
          slideVideo.currentTime = currentVideoTime;
        } catch (error) {
          console.warn("Failed to sync slide video time:", error);
        }
      }
    }
  }, [currentVideoTime, videos, currentVideoIndex, answerPptIndex]);

  // Sync play/pause state with trainer video
  useEffect(() => {
    if (slideVideoRef.current && canPlay && !isLoadingNewVideo) {
      const slideVideo = slideVideoRef.current;

      if (answerPptIndex !== null) {
        if (!slideVideo.paused) {
          slideVideo.pause();
        }
        return;
      }

      if (isVideoPlaying && slideVideo.paused && slideVideo.readyState >= 3) {
        if (playPromiseRef.current) {
          playPromiseRef.current.catch(() => {});
        }

        playPromiseRef.current = slideVideo.play();
        playPromiseRef.current
          .then(() => {
            playPromiseRef.current = null;
          })
          .catch((error) => {
            playPromiseRef.current = null;
            if (error.name !== "AbortError") {
              console.warn("Failed to play slide video:", error);
            }
          });
      } else if (!isVideoPlaying && !slideVideo.paused) {
        if (playPromiseRef.current) {
          playPromiseRef.current.catch(() => {});
          playPromiseRef.current = null;
        }
        slideVideo.pause();
      }
    }
  }, [isVideoPlaying, canPlay, isLoadingNewVideo, answerPptIndex]);

  // Initialize slide video on first load
  useEffect(() => {
    if (slideVideoRef.current && videos?.length > 0 && !hasSlideInitialized) {
      console.log("Initializing slide video player...");
      setHasSlideInitialized(true);
    }
  }, [videos, hasSlideInitialized]);

  // Handle slide video index changes
  useEffect(() => {
    if (slideVideoRef.current && hasSlideInitialized && videos?.length > 0) {
      const slideVideo = slideVideoRef.current;
      const videoIndex = answerPptIndex !== null ? answerPptIndex : currentVideoIndex;
      const videoData = videos[videoIndex];

      if (!videoData?.slide_video) {
        return;
      }

      const newSrc = videoData.slide_video;

      if (newSrc && newSrc !== lastSlideSrc) {
        setLastSlideSrc(newSrc);
        setIsLoadingNewVideo(true);
        setCanPlay(false);
        console.log(`Switching to slide video ${videoIndex}...`);

        if (!slideVideo.paused) {
          slideVideo.pause();
        }

        if (
          preloadedSlideIndex === videoIndex &&
          preloadSlideVideoRef.current &&
          preloadSlideVideoRef.current.readyState >= 2
        ) {
          try {
            slideVideo.src = preloadSlideVideoRef.current.src;
            slideVideo.load();
            preloadSlideVideoRef.current.src = "";
            setPreloadedSlideIndex(-1);
          } catch (error) {
            slideVideo.load();
            setPreloadedSlideIndex(-1);
          }
        } else {
          slideVideo.load();
          if (preloadedSlideIndex === videoIndex) {
            setPreloadedSlideIndex(-1);
          }
        }

        if (answerPptIndex !== null) {
          slideVideo.currentTime = 0;
        } else {
          slideVideo.currentTime = 0;
        }
      }
    }
  }, [currentVideoIndex, videos, preloadedSlideIndex, hasSlideInitialized, answerPptIndex]);

  // Preload next slide video
  useEffect(() => {
    const preloadThreshold = 10;

    if (videoDuration > 0 && currentVideoTime > 0 && videos && videos.length > 0) {
      const timeRemaining = videoDuration - currentVideoTime;
      const nextVideoIndex = currentVideoIndex + 1;

      if (
        timeRemaining <= preloadThreshold &&
        nextVideoIndex < videos.length &&
        preloadedSlideIndex !== nextVideoIndex &&
        videos[nextVideoIndex] &&
        videos[nextVideoIndex].slide_video &&
        typeof videos[nextVideoIndex].slide_video === "string" &&
        videos[nextVideoIndex].slide_video.trim() !== ""
      ) {
        try {
          if (!preloadSlideVideoRef.current) {
            preloadSlideVideoRef.current = document.createElement("video");
            preloadSlideVideoRef.current.preload = "auto";
            preloadSlideVideoRef.current.style.display = "none";
            preloadSlideVideoRef.current.muted = true;
            document.body.appendChild(preloadSlideVideoRef.current);
          }

          const nextVideoUrl = videos[nextVideoIndex].slide_video;

          if (nextVideoUrl && typeof nextVideoUrl === "string" && nextVideoUrl.startsWith("http")) {
            preloadSlideVideoRef.current.src = nextVideoUrl;
            preloadSlideVideoRef.current.onerror = () => {
              setPreloadedSlideIndex(-1);
            };
            preloadSlideVideoRef.current.load();
            setPreloadedSlideIndex(nextVideoIndex);
          }
        } catch (error) {
          setPreloadedSlideIndex(-1);
        }
      }
    }
  }, [currentVideoTime, currentVideoIndex, videos, preloadedSlideIndex, videoDuration]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (playPromiseRef.current) {
        playPromiseRef.current.catch(() => {});
        playPromiseRef.current = null;
      }
      if (preloadSlideVideoRef.current) {
        document.body.removeChild(preloadSlideVideoRef.current);
        preloadSlideVideoRef.current = null;
      }
    };
  }, []);

  const videoIndex = answerPptIndex !== null ? answerPptIndex : currentVideoIndex;

  if (selectedAssessmentId) {
    return <InModuleAssessment videos={videos} assessmentDetails={assessmentDetails} />;
  }

  if (isOnlyVideoMode) {
    return (
      <div className="w-full h-full bg-black rounded-xl overflow-hidden flex justify-center relative">
        {/* wrapper on top of slide video to avoid clicks when question mode is enabled */}
        {isQuestionMode && (
            <div
              className="absolute inset-0 z-50 bg-transparent cursor-not-allowed"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            />
          )}
        <VideoPlayerContainer
          ref={videoPlayerContainerRef}
          key={`video-player-${currentVideoIndex}`}
          videos={videos}
          currentVideoIndex={currentVideoIndex}
          presentationId={presentationId}
          canSkipVideo={canSkipVideo}
          className="w-[calc(100%-230px)] h-full max-w-full"
          autoPlayEnabled={autoPlayEnabled}
          isOnlyVideoMode={true}
          showRemainingDuration={true}
          onVideoEnd={() => {
            const currentVideo = videos[currentVideoIndex];
            const currentVideoAssessmentId = currentVideo?.slide_assessments?.[0]?.id;
            if (currentVideoAssessmentId) {
              dispatch(setSelectedAssessmentId(currentVideoAssessmentId));
              setAutoPlayEnabled(true);
              return;
            }
            const nextIndex = currentVideoIndex + 1;
            if (nextIndex < videos.length && onVideoIndexChange) {
              onVideoIndexChange(nextIndex);
              setAutoPlayEnabled(true);
            } else {
              dispatch(setSelectedAssessmentId(assessmentId));
            }
          }}
        />
      </div>
    );
  }

  if (!videos?.[videoIndex]?.slide_video) {
    return (
      <div className="w-full h-full bg-gray-100 rounded-xl flex items-center justify-center">
        <p className="text-gray-500">No slide video available</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-black rounded-xl overflow-hidden relative">
      {isVideoLoading && (
        <div className="absolute inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-10">
          <div className="text-white text-center">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm">Loading slide video...</p>
          </div>
        </div>
      )}
      <video
        key={`slide-video-${videoIndex}`}
        ref={slideVideoRef}
        src={videos[videoIndex].slide_video}
        className="w-full h-full object-fill" 
        muted
        playsInline
        onLoadStart={() => {
          if (!isVideoLoading) {
            setIsVideoLoading(true);
            setCanPlay(false);
          }
        }}
        onLoadedData={() => {
          if (isVideoLoading) {
            setIsVideoLoading(false);
            setIsLoadingNewVideo(false);
          }
        }}
        onCanPlay={() => {
          if (!canPlay) {
            setCanPlay(true);
            if (slideVideoRef.current) {
              if (answerPptIndex !== null) {
                slideVideoRef.current.currentTime = 0;
              } else {
                slideVideoRef.current.currentTime = currentVideoTime;
              }
            }
          }
        }}
        onCanPlayThrough={() => {
          if (!canPlay) {
            setCanPlay(true);
            if (slideVideoRef.current) {
              if (answerPptIndex !== null) {
                slideVideoRef.current.currentTime = 0;
              } else {
                slideVideoRef.current.currentTime = currentVideoTime;
              }
            }
          }
        }}
        onError={() => {
          setIsVideoLoading(false);
          setIsLoadingNewVideo(false);
          setCanPlay(false);
        }}
      />
    </div>
  );
});

SlideVideoSection.displayName = "SlideVideoSection";

export default SlideVideoSection;