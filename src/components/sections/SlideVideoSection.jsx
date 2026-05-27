import React, { useRef, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setSelectedAssessmentId } from "@/store/features/videoSlice";
import InModuleAssessment from "./InModuleAssessment";
import VideoPlayerContainer from "../VideoPlayerContainer";
import VideoPlayer from "../VideoPlayer";
import Image from "next/image";
import ResultModal from "../modals/ResultModal";
import FeedbackModal from "../modals/FeedbackModal";
import { useTranslation } from "react-i18next";

const SlideVideoSection = React.forwardRef(
  (
    {
      videos,
      // currentVideoTime = 0,
      isVideoPlaying = false,
      videoDuration = 0,
      assessmentDetails = [],
      isOnlyVideoMode = false,
      onVideoIndexChange,
      presentationId,
      canSkipVideo,
      assessmentId,
      showQueryRelatedSlides = false,
      passingScore,
    },
    ref
  ) => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const { currentVideoIndex, currentVideoTime, slideNumbers } = useSelector((state) => state.video);
    const slideVideoRef = useRef(null);
    const preloadSlideVideoRef = useRef(null);
    const videoPlayerContainerRef = useRef(null);
    const [isVideoLoading, setIsVideoLoading] = useState(true);
    const [hasSlideInitialized, setHasSlideInitialized] = useState(false);
    const [lastSlideSrc, setLastSlideSrc] = useState("");
    const [canPlay, setCanPlay] = useState(false);
    const [isLoadingNewVideo, setIsLoadingNewVideo] = useState(false);
    const [autoPlayEnabled, setAutoPlayEnabled] = useState(false);
    const playPromiseRef = useRef(null);
    const { answerPptIndex, selectedAssessmentId, isQuestionMode } = useSelector((state) => state.video);
    const { overlayImageUrl, isImageLoading } = useSelector((state) => state.image);
    const [showResultModal, setShowResultModal] = useState(false);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);

    // Expose pause method to parent component
    React.useImperativeHandle(ref, () => ({
      pauseSlideVideo: () => {
        if (isOnlyVideoMode && videoPlayerContainerRef.current) {
          videoPlayerContainerRef.current.pauseVideo();
        } else if (slideVideoRef.current && !slideVideoRef.current.paused) {
          slideVideoRef.current.pause();
        }
      },
    }));

    const previousTrainerTimeRef = useRef(0);

    // Sync slide video with trainer video time
    useEffect(() => {
      if (answerPptIndex !== null) {
        return;
      }

      const masterTimeJump = Math.abs(currentVideoTime - previousTrainerTimeRef.current);
      previousTrainerTimeRef.current = currentVideoTime;

      if (slideVideoRef.current && videos?.[currentVideoIndex]?.slide_video) {
        const slideVideo = slideVideoRef.current;
        const timeDifference = Math.abs(slideVideo.currentTime - currentVideoTime);

        // MSE (Video.js VHS) completely flushes its network buffer every time 
        // a manual seek occurs. We must only seek when a HUGE jump occurs 
        // (i.e. user scrubbed the timeline $> 1.0$s) or micro-drift > 10.0s.
        if (canPlay && slideVideo.readyState >= 1 && (masterTimeJump > 1.0 || timeDifference > 10.0) && !slideVideo.seeking) {
          try {
            slideVideo.currentTime = currentVideoTime;
          } catch (error) {
            console.warn("Failed to sync slide video time:", error);
          }
        }
      }
    }, [currentVideoTime, videos, currentVideoIndex, answerPptIndex, canPlay]);

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

        if (isVideoPlaying && slideVideo.paused && canPlay) {
          if (playPromiseRef.current && typeof playPromiseRef.current.catch === 'function') {
            playPromiseRef.current.catch(() => {});
          }

          const playResult = slideVideo.play();
          playPromiseRef.current = playResult;
          
          if (playResult !== undefined && typeof playResult.then === 'function') {
            playResult
              .then(() => {
                playPromiseRef.current = null;
              })
              .catch((error) => {
                playPromiseRef.current = null;
                if (error.name !== "AbortError") {
                  console.warn("Failed to play slide video:", error);
                }
              });
          } else {
            // playResult was not a promise, or undefined
            playPromiseRef.current = null;
          }
        } else if (!isVideoPlaying && !slideVideo.paused) {
          if (playPromiseRef.current && typeof playPromiseRef.current.catch === 'function') {
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

          // With VideoPlayer, when src prop changes, the player automatically re-initializes.
          // Therefore, we don't need manual load() or src injection calls.

          if (answerPptIndex !== null) {
            slideVideo.currentTime = 0;
          } else {
            slideVideo.currentTime = 0;
          }
        }
      }
    }, [currentVideoIndex, videos, hasSlideInitialized, answerPptIndex]);

    // Cleanup
    useEffect(() => {
      return () => {
        if (playPromiseRef.current) {
          playPromiseRef.current.catch(() => {});
          playPromiseRef.current = null;
        }
      };
    }, []);

    const videoIndex = answerPptIndex !== null ? answerPptIndex : currentVideoIndex;
    const slideImage =
      slideNumbers.length > 0
        ? videos?.find((video) => String(video.slide) === String(slideNumbers[0]))?.slide_image_url
        : null;
    console.log(slideImage, "slideImage");

    if (selectedAssessmentId) {
      return <InModuleAssessment videos={videos} assessmentDetails={assessmentDetails} passingScore={passingScore} />;
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
          {/* Slide Numbers Image Overlay */}
          {slideImage && isQuestionMode && showQueryRelatedSlides && (
            <div className="absolute inset-0 z-40 bg-black bg-opacity-50 flex items-center justify-center">
              <Image src={slideImage} alt="Slide reference" fill className="object-fill" />
            </div>
          )}
          {/* Overlay Image */}
          {/* {showQueryRelatedSlides && isQuestionMode && (isImageLoading || overlayImageUrl) && (
            <div className="absolute inset-0 z-30 bg-black bg-opacity-50 flex items-center justify-center">
              {isImageLoading ? (
                <div className="text-white text-center">
                  <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-sm">Generating image...</p>
                </div>
              ) : (
                <Image src={overlayImageUrl} alt="Generated overlay" fill className="object-fill" />
              )}
            </div>
          )} */}
          <VideoPlayerContainer
            ref={videoPlayerContainerRef}
            key={`video-player-${presentationId}-${currentVideoIndex}-${videos?.[currentVideoIndex]?.slide_video || "no-video"}`}
            videos={videos}
            currentVideoIndex={currentVideoIndex}
            presentationId={presentationId}
            canSkipVideo={canSkipVideo}
            className="w-full h-full aspect-video object-contain"
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
                // Last video
                const isFinalAssessmentPresent =
                  assessmentDetails && assessmentDetails.length > 0 && assessmentDetails[0].id;
                if (!isFinalAssessmentPresent) {
                  setShowResultModal(true);
                }
                dispatch(setSelectedAssessmentId(assessmentId));
              }
            }}
          />
          <FeedbackModal
            isOpen={showFeedbackModal}
            onClose={() => setShowFeedbackModal(false)}
            presentationId={presentationId}
          />
          <ResultModal
            isOpen={showResultModal}
            onClose={() => setShowResultModal(false)}
            presentationId={presentationId}
            score={100}
            passingScore={0}
            isNoAssessmentModule={true}
            onShowFeedback={() => {
              setShowResultModal(false);
              setShowFeedbackModal(true);
            }}
          />
        </div>
      );
    }

    if (!videos?.[videoIndex]?.slide_video) {
      return (
        <div className="w-full h-full bg-gray-100 rounded-xl flex items-center justify-center">
          <p className="text-gray-500">{t("lectures.noSlideVideo")}</p>
        </div>
      );
    }

    return (
      <div className="w-full h-full bg-black rounded-xl overflow-hidden relative">
        {isVideoLoading && (
          <div className="absolute inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-10">
            <div className="text-white text-center">
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm">{t("lectures.loadingSlideVideo")}</p>
            </div>
          </div>
        )}
        {/* Slide Numbers Image Overlay */}
        {slideImage && isQuestionMode && showQueryRelatedSlides && (
          <div className="absolute inset-0 z-40 bg-black bg-opacity-50 flex items-center justify-center">
            <Image src={slideImage} alt="Slide reference" fill className="object-fill" />
          </div>
        )}
        {/* Overlay Image */}
        {/* {showQueryRelatedSlides && isQuestionMode && (isImageLoading || overlayImageUrl) && (
          <div className="absolute inset-0 z-20 bg-black bg-opacity-50 flex items-center justify-center">
            {isImageLoading ? (
              <div className="text-white text-center">
                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-sm">Generating image...</p>
              </div>
            ) : (
              <Image src={overlayImageUrl} alt="Generated overlay" fill className="object-fill" />
            )}
          </div>
        )} */}
        <VideoPlayer
          key={`slide-video-${videoIndex}`}
          ref={slideVideoRef}
          src={videos[videoIndex].slide_video}
          className="w-full h-full [&_.vjs-tech]:!object-fill"
          muted={true}
          autoPlay={false}
          controls={false}
          onLoadStart={() => {
            if (!isVideoLoading) {
              setIsVideoLoading(true);
              setCanPlay(false);
            }
          }}
          onLoadedMetadata={() => {
            setIsVideoLoading(false);
            setIsLoadingNewVideo(false);
          }}
          onCanPlay={() => {
            setIsVideoLoading(false);
            setIsLoadingNewVideo(false);
            setCanPlay((prevCanPlay) => {
              if (!prevCanPlay) {
                if (slideVideoRef.current) {
                  if (answerPptIndex !== null) {
                    slideVideoRef.current.currentTime = 0;
                  } else {
                    slideVideoRef.current.currentTime = currentVideoTime;
                  }
                }
                return true;
              }
              return prevCanPlay;
            });
          }}
          onError={() => {
            setIsVideoLoading(false);
            setIsLoadingNewVideo(false);
            setCanPlay(false);
          }}
        />
      </div>
    );
  }
);

SlideVideoSection.displayName = "SlideVideoSection";

export default SlideVideoSection;
