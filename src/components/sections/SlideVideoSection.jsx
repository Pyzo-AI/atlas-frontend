import React, { useRef, useEffect, useState } from "react";
import { useSelector } from "react-redux";

const SlideVideoSection = ({
  videos,
  currentVideoIndex,
  currentVideoTime = 0,
  isVideoPlaying = false,
  videoDuration = 0,
}) => {
  const slideVideoRef = useRef(null);
  const preloadSlideVideoRef = useRef(null); // For preloading next slide video
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [preloadedSlideIndex, setPreloadedSlideIndex] = useState(-1);
  const [hasSlideInitialized, setHasSlideInitialized] = useState(false);
  const [lastSlideSrc, setLastSlideSrc] = useState("");
  const [canPlay, setCanPlay] = useState(false);
  const [isLoadingNewVideo, setIsLoadingNewVideo] = useState(false);
  const playPromiseRef = useRef(null);
  const answerPptIndex = useSelector((state) => state.video.answerPptIndex);

  // Sync slide video with trainer video time
  useEffect(() => {
    // Don't sync timing when answerPptIndex is not null
    if (answerPptIndex !== null) {
      return;
    }

    if (slideVideoRef.current && videos?.[currentVideoIndex]?.slide_video) {
      const slideVideo = slideVideoRef.current;
      const timeDifference = Math.abs(
        slideVideo.currentTime - currentVideoTime
      );

      // Only sync if there's a significant time difference (more than 0.1 seconds)
      // and the video is loaded and ready
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

      // If answerPptIndex is not null, keep video paused
      if (answerPptIndex !== null) {
        if (!slideVideo.paused) {
          slideVideo.pause();
        }
        return;
      }

      if (isVideoPlaying && slideVideo.paused && slideVideo.readyState >= 3) {
        // Cancel any pending play promise
        if (playPromiseRef.current) {
          playPromiseRef.current.catch(() => {
            // Ignore the error if the promise was cancelled
          });
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
        // Cancel any pending play promise before pausing
        if (playPromiseRef.current) {
          playPromiseRef.current.catch(() => {
            // Ignore the error if the promise was cancelled
          });
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

  // Handle slide video index changes (only when actually changing)
  useEffect(() => {
    if (slideVideoRef.current && hasSlideInitialized && videos?.length > 0) {
      const slideVideo = slideVideoRef.current;
      const videoIndex =
        answerPptIndex !== null ? answerPptIndex : currentVideoIndex;
      const videoData = videos[videoIndex];

      if (!videoData?.slide_video) {
        return;
      }

      const newSrc = videoData.slide_video;

      // Only reload if the source is actually different
      if (newSrc && newSrc !== lastSlideSrc) {
        setLastSlideSrc(newSrc);
        setIsLoadingNewVideo(true);
        setCanPlay(false);
        console.log(`Switching to slide video ${videoIndex}...`);
        console.log(`New slide video URL:`, newSrc);

        // Pause current video before switching
        if (!slideVideo.paused) {
          slideVideo.pause();
        }

        // Check if we have a preloaded slide video for this index
        if (
          preloadedSlideIndex === videoIndex &&
          preloadSlideVideoRef.current &&
          preloadSlideVideoRef.current.readyState >= 2
        ) {
          console.log(`Using preloaded slide video for index ${videoIndex}`);

          try {
            // Copy the preloaded video source to main slide video
            slideVideo.src = preloadSlideVideoRef.current.src;
            slideVideo.load();

            // Clean up the preloaded video
            preloadSlideVideoRef.current.src = "";
            setPreloadedSlideIndex(-1);
          } catch (error) {
            console.log(
              "Error using preloaded slide video, falling back to normal load:",
              error
            );
            slideVideo.load();
            setPreloadedSlideIndex(-1);
          }
        } else {
          // Load video normally if not preloaded or preload failed
          slideVideo.load();
          if (preloadedSlideIndex === videoIndex) {
            setPreloadedSlideIndex(-1); // Reset if preload was attempted but failed
          }
        }

        // Reset time based on mode when loading new video
        if (answerPptIndex !== null) {
          // When showing answer slide, start from beginning
          slideVideo.currentTime = 0;
        } else {
          // Normal behavior - reset to 0 for new video
          slideVideo.currentTime = 0;
        }
      }
    }
  }, [
    currentVideoIndex,
    videos,
    preloadedSlideIndex,
    hasSlideInitialized,
    answerPptIndex,
  ]);

  // Preload next slide video based on trainer video progress
  useEffect(() => {
    const preloadThreshold = 10; // Start preloading 10 seconds before video ends

    if (
      videoDuration > 0 &&
      currentVideoTime > 0 &&
      videos &&
      videos.length > 0
    ) {
      const timeRemaining = videoDuration - currentVideoTime;
      const nextVideoIndex = currentVideoIndex + 1;

      // Check if we should preload the next slide video
      if (
        timeRemaining <= preloadThreshold &&
        nextVideoIndex < videos.length &&
        preloadedSlideIndex !== nextVideoIndex &&
        videos[nextVideoIndex] &&
        videos[nextVideoIndex].slide_video &&
        typeof videos[nextVideoIndex].slide_video === "string" &&
        videos[nextVideoIndex].slide_video.trim() !== ""
      ) {
        console.log(`Preloading slide video ${nextVideoIndex}...`);

        try {
          // Create preload slide video element if it doesn't exist
          if (!preloadSlideVideoRef.current) {
            preloadSlideVideoRef.current = document.createElement("video");
            preloadSlideVideoRef.current.preload = "auto";
            preloadSlideVideoRef.current.style.display = "none";
            preloadSlideVideoRef.current.muted = true;
            document.body.appendChild(preloadSlideVideoRef.current);
          }

          // Set source and start preloading
          const nextVideoUrl = videos[nextVideoIndex].slide_video;

          // Validate URL before setting
          if (
            nextVideoUrl &&
            typeof nextVideoUrl === "string" &&
            nextVideoUrl.startsWith("http")
          ) {
            preloadSlideVideoRef.current.src = nextVideoUrl;
            preloadSlideVideoRef.current.onerror = (e) => {
              console.warn(`Failed to preload slide video ${nextVideoIndex}:`, {
                url: nextVideoUrl,
                error: e.type || "unknown error",
              });
              setPreloadedSlideIndex(-1);
            };
            preloadSlideVideoRef.current.oncanplaythrough = () => {
              console.log(
                `Slide video ${nextVideoIndex} preloaded successfully`
              );
            };
            preloadSlideVideoRef.current.load();
            setPreloadedSlideIndex(nextVideoIndex);
          } else {
            console.warn(
              `Invalid slide video URL for index ${nextVideoIndex}:`,
              nextVideoUrl
            );
            setPreloadedSlideIndex(-1);
          }
        } catch (error) {
          console.warn(
            `Error setting up preload for slide video ${nextVideoIndex}:`,
            error
          );
          setPreloadedSlideIndex(-1);
        }
      }
    }
  }, [
    currentVideoTime,
    currentVideoIndex,
    videos,
    preloadedSlideIndex,
    videoDuration,
  ]);

  // Cleanup preload slide video element on unmount
  useEffect(() => {
    return () => {
      // Cancel any pending play promise
      if (playPromiseRef.current) {
        playPromiseRef.current.catch(() => {
          // Ignore cleanup errors
        });
        playPromiseRef.current = null;
      }

      // Cleanup preload video element
      if (preloadSlideVideoRef.current) {
        document.body.removeChild(preloadSlideVideoRef.current);
        preloadSlideVideoRef.current = null;
      }
    };
  }, []);

  const videoIndex =
    answerPptIndex !== null ? answerPptIndex : currentVideoIndex;

  if (!videos?.[videoIndex]?.slide_video) {
    return (
      <div className="w-full h-full bg-gray-100 rounded-xl flex items-center justify-center">
        <p className="text-gray-500">No slide video available</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-black rounded-xl overflow-hidden relative">
      {/* Loading overlay */}
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
        className="w-full h-full object-contain"
        muted
        playsInline
        onLoadStart={() => {
          if (!isVideoLoading) {
            console.log("Slide video loading started...");
            setIsVideoLoading(true);
            setCanPlay(false);
          }
        }}
        onLoadedData={() => {
          if (isVideoLoading) {
            console.log("Slide video loaded");
            setIsVideoLoading(false);
            setIsLoadingNewVideo(false);
          }
        }}
        onCanPlay={() => {
          if (!canPlay) {
            console.log("Slide video can play");
            setCanPlay(true);
            // Ensure sync when video is ready to play, but only if not in answer mode
            if (slideVideoRef.current) {
              if (answerPptIndex !== null) {
                // When showing answer slide, start from beginning and pause
                slideVideoRef.current.currentTime = 0;
              } else {
                // Normal sync behavior
                slideVideoRef.current.currentTime = currentVideoTime;
              }
            }
          }
        }}
        onCanPlayThrough={() => {
          if (!canPlay) {
            console.log("Slide video can play through");
            setCanPlay(true);
            // When video can play through, set appropriate time based on mode
            if (slideVideoRef.current) {
              if (answerPptIndex !== null) {
                // When showing answer slide, start from beginning
                slideVideoRef.current.currentTime = 0;
              } else {
                // Normal sync behavior
                slideVideoRef.current.currentTime = currentVideoTime;
              }
            }
          }
        }}
        onError={(e) => {
          console.warn("Error loading slide video:", {
            currentIndex: videoIndex,
            videoUrl: videos[videoIndex]?.slide_video,
            error: e.type || "unknown error",
          });
          setIsVideoLoading(false);
          setIsLoadingNewVideo(false);
          setCanPlay(false);
        }}
      />
    </div>
  );
};

export default SlideVideoSection;
