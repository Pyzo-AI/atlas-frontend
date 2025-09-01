import {
  setCurrentSlide,
  setCurrentVideoIndex,
  setCurrentVideoTime,
  setIsVideoPlaying,
  syncPptToVideoPanel,
  setAnswerPptIndex,
} from "@/store/features/videoSlice";
import React, {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { useGetAllVideoQuery } from "@/store/api/questionsApi";
import { toast } from "react-toastify";
import VideoPlaylist from "./VideoPlaylist";
import AILearningAssistant from "./AILearningAssistant";
import QuestionModeUI from "./QuestionModeAI";
import QuestionModeAssistant from "./QuestionModeUser";
import QuestionModeUser from "./QuestionModeUser";
import QuestionModeAI from "./QuestionModeAI";
import ChatUI from "./ChatUI";

// Skeleton Loader Component
const VideoSkeleton = ({ width = "30%" }) => (
  <div
    className="flex flex-col h-full relative flex-shrink-0 pl-4"
    style={{ width }}
  >
    {/* Video Player Skeleton */}
    <div className="p-1 bg-white rounded-xl border border-[#E5E7EB]">
      <div className="relative w-full pt-[56.25%] bg-gray-100 rounded-lg overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-gray-200 animate-pulse"></div>
        </div>
      </div>
      {/* Time and video count skeleton */}
      <div className="px-1 flex justify-between mt-2 text-sm">
        <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
        <div className="w-12 h-4 bg-gray-200 rounded animate-pulse"></div>
      </div>
    </div>

    {/* Playlist Skeleton */}
    <div className="mt-4 bg-white rounded-xl border border-[#E5E7EB] flex-1">
      <div className="p-4 border-b border-gray-100">
        <div className="h-5 w-28 bg-gray-200 rounded animate-pulse"></div>
      </div>
      <div className="p-2 space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex items-center p-2 rounded-lg hover:bg-gray-50"
          >
            <div className="w-24 h-16 bg-gray-100 rounded-lg mr-3 animate-pulse"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-100 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const VideoPanel = forwardRef(
  (
    {
      videos = [],
      loading = true,
      onVideoStateChange,
      onPauseVideo,
      onPauseAnswerAudio,
      presentationId,
      width = "30%",
    },
    ref
  ) => {
    const [qaState, setQaState] = useState({
      isLoading: false,
      answer: "",
      audioLink: "",
      isAudioPlaying: false,
    });
    const [conversation, setConversation] = useState([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [hasInitialized, setHasInitialized] = useState(false);
    const [lastVideoSrc, setLastVideoSrc] = useState("");
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [autoPlayEnabled, setAutoPlayEnabled] = useState(false);
    // Persistent video settings
    const [videoSettings, setVideoSettings] = useState({
      muted: false,
      playbackRate: 1.0,
      volume: 1.0,
    });
    const videoRef = useRef(null);
    const activeVideoRef = useRef(null);
    const preloadVideoRef = useRef(null); // For preloading next video
    const router = useRouter();
    const dispatch = useDispatch();
    const { currentVideoIndex, isQuestionMode } = useSelector(
      (state) => state.video
    );
    const [showChat, setShowChat] = useState(false);
    const questionModeAIRef = useRef(null);
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
    const handleQuestionSubmit = async (userQuestion) => {
      console.log(userQuestion, "userQuestion");
      if (!userQuestion) return;

      if (onPauseVideo) {
        onPauseVideo();
      }

      setQaState((prev) => ({
        ...prev,
        isLoading: true,
        answer: "",
        audioLink: "",
      }));

      // Add user question to conversation
      setConversation((prev) => [
        ...prev,
        { type: "question", content: userQuestion },
      ]);

      try {
        // Map conversation for API - convert internal format to API format and get latest 10
        const mappedConversation = conversation
          .slice(-10) // Get only the latest 10 conversations
          .map((item) => ({
            type: item.type === "question" ? "user" : "AI",
            content: item.content,
          }));

        const response = await fetch(
          `${API_BASE_URL}/qa/${presentationId}?stream_audio=true`,
          {
            method: "POST",
            headers: {
              Accept: "audio/mpeg",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              question: userQuestion,
              conversation: mappedConversation,
              knowledge_source_ids: [1],
              config: { use_external_knowledge: false },
            }),
          }
        );

        if (response.ok) {
          const answerText =
            response.headers.get("x-answer") || "No answer received";

          const jumpTarget = response.headers.get("x-jump-target");
          if (jumpTarget !== null && jumpTarget !== undefined) {
            dispatch(setAnswerPptIndex(parseInt(jumpTarget)));
          }

          const audioBlob = await response.blob();
          const audioUrl = URL.createObjectURL(audioBlob);

          setQaState((prev) => ({
            ...prev,
            answer: answerText,
            audioLink: audioUrl,
          }));

          // Add AI answer to conversation
          setConversation((prev) => [
            ...prev,
            { type: "answer", content: answerText || "No text answer found" },
          ]);
        } else {
          throw new Error("Failed to get response");
        }
      } catch (error) {
        console.log("Error submitting question:", error);
        toast.error("Failed to get audio response. Please try again.");
        setQaState((prev) => ({
          ...prev,
          answer: "Failed to load answer. Please try again.",
        }));

        // Add error to conversation
        setConversation((prev) => [
          ...prev,
          {
            type: "error",
            content: "Failed to load answer. Please try again.",
          },
        ]);
      } finally {
        setQaState((prev) => ({ ...prev, isLoading: false }));
      }
    };
    const [showRedirectPopup, setShowRedirectPopup] = useState(false);
    const [countdown, setCountdown] = useState(10);
    const [preloadedVideoIndex, setPreloadedVideoIndex] = useState(-1);

    // Function to stop answer audio
    const stopAnswerAudio = () => {
      if (questionModeAIRef.current) {
        questionModeAIRef.current.stopAudio();
      }
    };

    // Handle countdown and redirect
    useEffect(() => {
      if (!showRedirectPopup) return;

      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      if (countdown === 0) {
        // Get presentationId from current URL
        const currentPath = window.location.pathname;
        const presentationId = currentPath.split("/lectures/")[1];
        router.push(`/assessment/${presentationId}`);
      }

      return () => clearInterval(timer);
    }, [showRedirectPopup, countdown, router]);

    // Initialize video on first load
    useEffect(() => {
      if (videoRef.current && videos?.length > 0 && !hasInitialized) {
        console.log("Initializing video player...");

        // Update slide when video initializes
        if (videos?.[currentVideoIndex]?.slide) {
          dispatch(setCurrentSlide(videos[currentVideoIndex].slide));
        }

        setHasInitialized(true);
      }
    }, [videos, currentVideoIndex, dispatch, hasInitialized]);

    // Handle pause video from external source (like question panel)
    const pauseVideo = () => {
      if (videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause();
        setIsPlaying(false);
        dispatch(setIsVideoPlaying(false));

        // Notify parent about pause state change
        if (onVideoStateChange) {
          onVideoStateChange({
            currentTime,
            isPlaying: false,
            currentVideoIndex,
            duration,
          });
        }
      }
    };

    // Expose pauseVideo method to parent component
    useImperativeHandle(ref, () => ({
      pauseVideo,
    }));

    // Apply persistent video settings when video loads
    const applyVideoSettings = (videoElement) => {
      if (videoElement) {
        videoElement.muted = videoSettings.muted;
        videoElement.playbackRate = videoSettings.playbackRate;
        videoElement.volume = videoSettings.volume;
      }
    };

    // Handle video index changes (only when actually changing)
    useEffect(() => {
      if (videoRef.current && hasInitialized && videos?.length > 0) {
        const currentVideo = videos[currentVideoIndex];
        const newSrc = currentVideo?.trainer_video;

        // Only reload if the source is actually different
        if (newSrc && newSrc !== lastVideoSrc) {
          setLastVideoSrc(newSrc);
          console.log(`Switching to video ${currentVideoIndex}...`);

          // Check if we have a preloaded video for this index
          if (
            preloadedVideoIndex === currentVideoIndex &&
            preloadVideoRef.current &&
            preloadVideoRef.current.readyState >= 2
          ) {
            console.log(`Using preloaded video for index ${currentVideoIndex}`);

            try {
              // Copy the preloaded video source to main video
              videoRef.current.src = preloadVideoRef.current.src;
              videoRef.current.load();

              // Clean up the preloaded video
              preloadVideoRef.current.src = "";
              setPreloadedVideoIndex(-1);
            } catch (error) {
              console.log(
                "Error using preloaded video, falling back to normal load:",
                error
              );
              videoRef.current.load();
              setPreloadedVideoIndex(-1);
            }
          } else {
            // Load video normally if not preloaded or preload failed
            videoRef.current.load();
            if (preloadedVideoIndex === currentVideoIndex) {
              setPreloadedVideoIndex(-1); // Reset if preload was attempted but failed
            }
          }

          // Update slide when video changes
          if (currentVideo?.slide) {
            dispatch(setCurrentSlide(currentVideo.slide));
          }

          // Notify parent about video index change
          if (onVideoStateChange) {
            onVideoStateChange({
              currentTime: 0,
              isPlaying: autoPlayEnabled,
              currentVideoIndex,
              duration: 0,
            });
          }

          if (autoPlayEnabled) {
            // Pause any playing answer audio when video starts
            if (onPauseAnswerAudio) {
              onPauseAnswerAudio();
            }

            videoRef.current.play().catch((error) => {
              console.log("Error playing video:", error);
            });
          }
        }
      }
    }, [
      currentVideoIndex,
      videos,
      dispatch,
      preloadedVideoIndex,
      hasInitialized,
      autoPlayEnabled,
      videoSettings,
    ]);

    // Add effect to scroll active video into view
    useEffect(() => {
      if (activeVideoRef.current) {
        activeVideoRef.current.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    }, [currentVideoIndex]);

    // Preload next video when current video is near completion
    useEffect(() => {
      const preloadThreshold = 10; // Start preloading 10 seconds before video ends

      if (duration > 0 && currentTime > 0) {
        const timeRemaining = duration - currentTime;
        const nextVideoIndex = currentVideoIndex + 1;

        // Check if we should preload the next video
        if (
          timeRemaining <= preloadThreshold &&
          nextVideoIndex < videos.length &&
          preloadedVideoIndex !== nextVideoIndex &&
          videos[nextVideoIndex]?.trainer_video
        ) {
          console.log(`Preloading video ${nextVideoIndex}...`);

          // Create preload video element if it doesn't exist
          if (!preloadVideoRef.current) {
            preloadVideoRef.current = document.createElement("video");
            preloadVideoRef.current.preload = "auto";
            preloadVideoRef.current.style.display = "none";
            document.body.appendChild(preloadVideoRef.current);
          }

          // Set source and start preloading
          preloadVideoRef.current.src = videos[nextVideoIndex].trainer_video;
          preloadVideoRef.current.onerror = (e) => {
            // console.log(`Failed to preload video ${nextVideoIndex}:`, e);
            setPreloadedVideoIndex(-1);
          };
          preloadVideoRef.current.oncanplaythrough = () => {
            console.log(`Video ${nextVideoIndex} preloaded successfully`);
            // Apply persistent settings to preloaded video
            applyVideoSettings(preloadVideoRef.current);
          };
          preloadVideoRef.current.onloadedmetadata = () => {
            // Apply persistent settings when preloaded video metadata is loaded
            applyVideoSettings(preloadVideoRef.current);
          };
          preloadVideoRef.current.load();
          setPreloadedVideoIndex(nextVideoIndex);

          // Optional: Preload poster/thumbnail
          if (videos[nextVideoIndex]?.thumbnail) {
            const img = new Image();
            // img.src = videos[nextVideoIndex].thumbnail;
            img.src =
              "https://cdn-api.epic.dev.esmagico.in/trainboost/slides/thumb.png";
          }
        }
      }
    }, [
      currentTime,
      duration,
      currentVideoIndex,
      videos,
      preloadedVideoIndex,
      videoSettings,
    ]);

    // Sync PPT to video panel when video starts playing
    useEffect(() => {
      if (isPlaying) {
        // When video panel starts playing, sync PPT to the same video
        dispatch(syncPptToVideoPanel());
        console.log(
          `Syncing PPT to video panel's current video: ${currentVideoIndex + 1}`
        );
      }
    }, [isPlaying, currentVideoIndex, dispatch]);

    // Reset error state when exiting question mode
    useEffect(() => {
      if (!isQuestionMode) {
        setQaState((prev) => ({
          ...prev,
          isLoading: false,
          answer: "",
          audioLink: "",
          isAudioPlaying: false,
        }));
        setConversation([]);
      }
    }, [isQuestionMode]);

    // Cleanup preload video element on unmount
    useEffect(() => {
      return () => {
        if (preloadVideoRef.current) {
          document.body.removeChild(preloadVideoRef.current);
          preloadVideoRef.current = null;
        }
      };
    }, []);

    // Show skeleton while loading
    if (loading || !videos) {
      return <VideoSkeleton width={width} />;
    }

    // Handle video end
    const handleVideoEnd = () => {
      if (currentVideoIndex < videos?.length - 1) {
        setAutoPlayEnabled(true); // Enable autoplay for next video
        dispatch(setCurrentVideoIndex(currentVideoIndex + 1));
        dispatch(setCurrentSlide(videos[currentVideoIndex + 1]?.slide));
      } else {
        setShowRedirectPopup(true);
        setAutoPlayEnabled(false);
      }
    };

    // Close popup handler
    const handleClosePopup = () => {
      setShowRedirectPopup(false);
      setCountdown(10);
    };

    // Format time in MM:SS
    const formatTime = (timeInSeconds) => {
      const minutes = Math.floor(timeInSeconds / 60);
      const seconds = Math.floor(timeInSeconds % 60);
      return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    };

    // Handle video selection from playlist
    const handleVideoSelect = (index) => {
      if (index !== currentVideoIndex) {
        setAutoPlayEnabled(true); // Enable autoplay when selecting from playlist
        dispatch(setCurrentVideoIndex(index));
        setIsPlaying(false);
      }
    };

    // Handle transcript item click
    const handleTranscriptClick = (index) => {
      setAutoPlayEnabled(true);
      dispatch(setCurrentVideoIndex(index));
      setIsPlaying(false);
    };

    // Toggle play/pause
    const togglePlayPause = () => {
      if (videoRef.current) {
        if (isPlaying) {
          videoRef.current.pause();
        } else {
          // Reset answerPptIndex when video starts playing
          dispatch(setAnswerPptIndex(null));

          // Pause any playing answer audio when video starts
          if (onPauseAnswerAudio) {
            onPauseAnswerAudio();
          }

          videoRef.current.play().catch((error) => {
            console.log("Error playing video:", error);
          });
        }
        setIsPlaying(!isPlaying);
      }
    };

    const handleProgressBarClick = (e) => {
      if (!videoRef.current) return;

      const progressBar = e.currentTarget;
      const clickPosition =
        e.clientX - progressBar.getBoundingClientRect().left;
      const progressBarWidth = progressBar.clientWidth;
      const seekTime = (clickPosition / progressBarWidth) * duration;

      videoRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    };

    return (
      <div
        className="flex flex-col h-full relative gap-4 flex-shrink-0 pl-4"
        style={{ width }}
      >
        {/* Redirect Popup */}
        {showRedirectPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
              <h3 className="text-xl font-semibold mb-4">Training Complete!</h3>
              <p className="mb-6">
                Redirecting to Assessment in {countdown} seconds...
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{ width: `${(10 - countdown) * 10}%` }}
                ></div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={handleClosePopup}
                  className="cursor-pointer px-4 py-2 rounded-md text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    const currentPath = window.location.pathname;
                    const presentationId = currentPath.split("/lectures/")[1];
                    router.push(`/assessment/${presentationId}`);
                  }}
                  className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Go to Assessment Now
                </button>
              </div>
            </div>
          </div>
        )}
        {!isQuestionMode && !showChat ? (
          <div className="p-3 pb-2 bg-white rounded-xl border border-[#E5E7EB]">
            <div className="relative w-full pt-[56.25%] bg-black rounded-lg overflow-hidden">
              {" "}
              {/* 16:9 Aspect Ratio */}
              <video
                key={`trainer-video-${currentVideoIndex}`}
                ref={videoRef}
                src={videos?.[currentVideoIndex]?.trainer_video}
                className="absolute top-0 left-0 w-full h-full object-cover"
                onEnded={handleVideoEnd}
                onTimeUpdate={(e) => {
                  const time = e.target.currentTime;
                  setCurrentTime(time);
                  dispatch(setCurrentVideoTime(time));
                  // Pass video state to parent for PPT synchronization
                  if (onVideoStateChange) {
                    onVideoStateChange({
                      currentTime: time,
                      isPlaying: !e.target.paused,
                      currentVideoIndex,
                      duration: e.target.duration || duration,
                    });
                  }
                }}
                onLoadedMetadata={(e) => {
                  const newDuration = e.target.duration;
                  setDuration(newDuration);
                  // Apply persistent settings when metadata is loaded
                  applyVideoSettings(e.target);
                  // Notify parent about duration
                  if (onVideoStateChange) {
                    onVideoStateChange({
                      currentTime,
                      isPlaying,
                      currentVideoIndex,
                      duration: newDuration,
                    });
                  }
                }}
                onCanPlay={(e) => {
                  console.log("Trainer video can play");
                  // Apply persistent settings when video can play
                  applyVideoSettings(e.target);
                }}
                onPlay={() => {
                  setIsPlaying(true);
                  dispatch(setIsVideoPlaying(true));

                  // Reset answerPptIndex when video starts playing
                  dispatch(setAnswerPptIndex(null));

                  // Pause any playing answer audio when video starts
                  if (onPauseAnswerAudio) {
                    onPauseAnswerAudio();
                  }

                  // Notify parent about play state change
                  if (onVideoStateChange) {
                    onVideoStateChange({
                      currentTime,
                      isPlaying: true,
                      currentVideoIndex,
                      duration,
                    });
                  }
                }}
                onPause={() => {
                  setIsPlaying(false);
                  dispatch(setIsVideoPlaying(false));
                  // Notify parent about pause state change
                  if (onVideoStateChange) {
                    onVideoStateChange({
                      currentTime,
                      isPlaying: false,
                      currentVideoIndex,
                      duration,
                    });
                  }
                }}
                onLoadStart={() => {
                  console.log("Trainer video loading started...");
                }}
                onVolumeChange={(e) => {
                  // Track mute state and volume changes
                  const newMuted = e.target.muted;
                  const newVolume = e.target.volume;

                  if (
                    newMuted !== videoSettings.muted ||
                    newVolume !== videoSettings.volume
                  ) {
                    setVideoSettings((prev) => ({
                      ...prev,
                      muted: newMuted,
                      volume: newVolume,
                    }));
                  }
                }}
                onRateChange={(e) => {
                  // Track playback rate changes
                  const newRate = e.target.playbackRate;
                  if (newRate !== videoSettings.playbackRate) {
                    setVideoSettings((prev) => ({
                      ...prev,
                      playbackRate: newRate,
                    }));
                  }
                }}
                onClick={togglePlayPause}
                // poster={videos?.[currentVideoIndex]?.thumbnail}
                poster={
                  "https://cdn-api.epic.dev.esmagico.in/trainboost/slides/thumb.png"
                }
                autoPlay={autoPlayEnabled}
                controls={true}
                controlsList="nodownload"
                disablePictureInPicture
              />
            </div>
            {/* Time display below video */}
            <div className="px-1 flex justify-between mt-2 text-[12px] leading-4 tracking-normal font-normal text-center text-gray-600 font-lato">
              <span>
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
              <span>
                {currentVideoIndex + 1}/{videos?.length}
              </span>
            </div>
          </div>
        ) : null}
        {isQuestionMode && (
          <QuestionModeAI
            ref={questionModeAIRef}
            isLoading={qaState.isLoading}
            answer={qaState.answer}
            audioLink={qaState.audioLink}
            isAudioPlaying={qaState.isAudioPlaying}
            onAudioStateChange={(isPlaying) =>
              setQaState((prev) => ({ ...prev, isAudioPlaying: isPlaying }))
            }
          />
        )}
        {showChat ? (
          <ChatUI
            onClose={() => setShowChat(false)}
            conversation={conversation}
          />
        ) : isQuestionMode ? (
          <QuestionModeUser
            onPauseVideo={pauseVideo}
            onQuestionSubmit={handleQuestionSubmit}
            setShowChat={setShowChat}
            onPauseAnswerAudio={stopAnswerAudio}
            isAudioPlaying={qaState.isAudioPlaying}
            isAudioLoading={qaState.isLoading}
          />
        ) : (
          <AILearningAssistant setShowChat={setShowChat} showChat={showChat} />
        )}
      </div>
    );
  }
);

VideoPanel.displayName = "VideoPanel";

export default VideoPanel;
