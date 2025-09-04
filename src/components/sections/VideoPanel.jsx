import {
  setCurrentSlide,
  setCurrentVideoIndex,
  setCurrentVideoTime,
  setIsVideoPlaying,
  syncPptToVideoPanel,
  setAnswerPptIndex,
  setIsQuestionMode,
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
import { useConversation } from "@elevenlabs/react";
import AILearningAssistant from "./AILearningAssistant";
import QuestionModeUser from "./QuestionModeUser";
import QuestionModeAI from "./QuestionModeAI";
import ChatUI from "./ChatUI";

const VideoPanel = forwardRef(
  (
    {
      videos = [],
      loading,
      onVideoStateChange,
      onPauseVideo,
      onPauseAnswerAudio,
      presentationId,
      width = "30%",
    },
    ref
  ) => {
    const [conversationState, setConversationState] = useState({
      isLoading: false,
      isConnected: false,
      isAudioPlaying: false,
    });
    const [
      isJumpedOnChatFromInteractionMode,
      setIsJumpedOnChatFromInteractionMode,
    ] = useState(false);
    const [isListening, setIsListening] = useState(false);
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
    const [conversationHistory, setConversationHistory] = useState([]);
    // ElevenLabs Conversational AI
    const conversation = useConversation({
      // apiKey: process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY,
      onConnect: () => {
        console.log("Connected to ElevenLabs");
        setConversationState((prev) => ({ ...prev, isConnected: true }));
      },
      onModeChange: (mode) => {
        console.log("Mode changed:", mode);
        if (mode.mode === "listening") {
          setIsListening(true);
        } else {
          setIsListening(false);
        }
      },
      onDisconnect: () => {
        console.log("Disconnected from ElevenLabs");
        setConversationState((prev) => ({
          ...prev,
          isConnected: false,
          isAudioPlaying: false,
        }));
      },
      onMessage: (message) => {
        console.log("Message:", message);
        if (message.source === "user") {
          const content = message.message;
          if (content.trim() === "") return;
          setConversationHistory((prev) => [
            ...prev,
            { type: "question", content },
          ]);
        } else {
          setConversationHistory((prev) => [
            ...prev,
            { type: "answer", content: message.message },
          ]);
        }
      },
      onError: (error) => {
        console.error("ElevenLabs Error:", error);
        setConversationState((prev) => ({
          ...prev,
          isLoading: false,
          isAudioPlaying: false,
        }));
      },
    });

    const startConversation = async () => {
      try {
        if (onPauseVideo) {
          onPauseVideo();
        }

        setConversationState((prev) => ({ ...prev, isLoading: true }));
        await navigator.mediaDevices.getUserMedia({ audio: true });
        await conversation.startSession({
          agentId: "agent_4701k47tsjjff7crz1caj7dd9htv",
        });
      } catch (error) {
        console.error("Failed to start conversation:", error);
        setConversationState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    const stopConversation = async () => {
      try {
        await conversation.endSession();
        setConversationState((prev) => ({
          ...prev,
          isConnected: false,
          isAudioPlaying: false,
        }));
      } catch (error) {
        console.error("Failed to stop conversation:", error);
      }
    };
    const [showRedirectPopup, setShowRedirectPopup] = useState(false);
    const [countdown, setCountdown] = useState(10);
    const [preloadedVideoIndex, setPreloadedVideoIndex] = useState(-1);

    // Function to stop conversation
    const stopAnswerAudio = () => {
      if (conversationState.isConnected) {
        stopConversation();
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
            img.src = videos[nextVideoIndex].thumbnail;
            // console.log("Preloading thumbnail:", videos[nextVideoIndex]?.thumbnail);
            // img.src =
            //   "https://cdn-api.epic.dev.esmagico.in/trainboost/slides/thumb.png";
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

    // Reset conversation state when exiting question mode
    useEffect(() => {
      if (!isQuestionMode && conversationState.isConnected) {
        stopConversation();
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

    const handleCloseChatUI = () => {
      if (isJumpedOnChatFromInteractionMode) {
        dispatch(setIsQuestionMode(true));
        setIsJumpedOnChatFromInteractionMode(false);
        startConversation();
      }
      setShowChat(false);
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
                  className="cursor-pointer px-4 py-2 bg-[#744FFF] text-white rounded-md hover:bg-[#5B3FDD]"
                >
                  Go to Assessment Now
                </button>
              </div>
            </div>
          </div>
        )}
        {!isQuestionMode && !showChat ? (
          <div
            className="cursor-pointer p-3 pb-2 bg-white rounded-xl border border-[#E5E7EB]"
            onClick={togglePlayPause}
          >
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
                onClick={(e) => {
                  // Prevent event bubbling to avoid double-triggering the parent's onClick
                  e.stopPropagation();
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
                // onClick={togglePlayPause}
                poster={videos?.[currentVideoIndex]?.thumbnail}
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
            isLoading={!conversationState.isConnected}
            isAudioPlaying={conversation.isSpeaking}
            isConnected={conversationState.isConnected}
          />
        )}
        {showChat ? (
          <ChatUI
            onClose={handleCloseChatUI}
            conversation={conversationHistory}
            onStartConversation={startConversation}
            onStopConversation={stopConversation}
            isConnected={conversationState.isConnected}
            setShowChat={setShowChat}
              setIsJumpedOnChatFromInteractionMode={
              setIsJumpedOnChatFromInteractionMode
            }
          />
        ) : isQuestionMode ? (
          <QuestionModeUser
            onPauseVideo={pauseVideo}
            onStartConversation={startConversation}
            onStopConversation={stopConversation}
            setShowChat={setShowChat}
            onPauseAnswerAudio={stopAnswerAudio}
            isAudioPlaying={conversationState.isAudioPlaying}
            isAudioLoading={isListening}
            isConnected={conversationState.isConnected}
            setIsJumpedOnChatFromInteractionMode={
              setIsJumpedOnChatFromInteractionMode
            }
          />
        ) : (
          <AILearningAssistant
            setShowChat={setShowChat}
            showChat={showChat}
            onStartConversation={startConversation}
            onStopConversation={stopConversation}
          />
        )}
      </div>
    );
  }
);

VideoPanel.displayName = "VideoPanel";

export default VideoPanel;
