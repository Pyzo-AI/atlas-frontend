import {
  setCurrentSlide,
  setCurrentVideoIndex,
  setCurrentVideoTime,
  setIsVideoPlaying,
  syncPptToVideoPanel,
  setAnswerPptIndex,
  setIsQuestionMode,
  setSelectedAssessmentId,
  setAutoPlayEnabled,
} from "@/store/features/videoSlice";
import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { useConversation } from "@elevenlabs/react";
import { CONVERSATION_CONFIG, cleanExpiredMessages } from "@/config/conversationConfig";
import AILearningAssistant from "./AILearningAssistant";
import QuestionModeUser from "./QuestionModeUser";
import QuestionModeAI from "./QuestionModeAI";
import ChatUI from "./ChatUI";
import { getUserDetailsFromToken } from "@/store/utils/token";
import { usePostHog } from "@/hooks/usePostHog";
import { updateVideoProgress, startVideoSession } from "@/utils/videoProgress";
import redirecting_logo from "@/assets/svg/redirecting.svg";
import Image from "next/image";
import VideoPlayerContainer from "@/components/VideoPlayerContainer";
import FeedbackModal from "../modals/FeedbackModal";
import { useGenerateImageMutation } from "@/store/api/questionsApi";
import { setOverlayImage, setImageLoading } from "@/store/features/imageSlice";

// Conversation history management for VideoPanel
const {
  STORAGE_KEY: CONVERSATION_STORAGE_KEY,
  MAX_HISTORY_MESSAGES,
  MAX_MESSAGE_AGE_DAYS,
  MAX_CONTEXT_MESSAGES,
} = CONVERSATION_CONFIG;

const getStoredConversationHistory = () => {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(CONVERSATION_STORAGE_KEY);
    if (!stored) return [];

    const history = JSON.parse(stored);
    // Clean expired messages if age limit is set
    const cleanedHistory = cleanExpiredMessages(history, MAX_MESSAGE_AGE_DAYS);

    // If we cleaned any messages, update storage
    if (cleanedHistory.length !== history.length) {
      saveConversationHistory(cleanedHistory);
    }

    return cleanedHistory;
  } catch (error) {
    console.error("Error loading conversation history:", error);
    return [];
  }
};

const saveConversationHistory = (history) => {
  if (typeof window === "undefined") return;
  try {
    // Keep only the most recent messages to prevent localStorage bloat
    const trimmedHistory = history.slice(-MAX_HISTORY_MESSAGES);
    localStorage.setItem(CONVERSATION_STORAGE_KEY, JSON.stringify(trimmedHistory));
  } catch (error) {
    console.error("Error saving conversation history:", error);
  }
};

const VideoPanel = forwardRef(
  (
    {
      videos = [],
      loading,
      onVideoStateChange,
      onPauseVideo,
      onPauseAnswerAudio,
      onPauseSlideVideo,
      onVideoEnd,
      presentationId,
      width = "30%",
      isMobileView = false,
      isPhoneView = false,
      agentId,
      avatarUrl,
      conversationHistory = [],
      setConversationHistory,
      isPresentationQuizPassed,
      canSkipVideo = false,
      assessmentId,
      isOnlyVideoMode = false,
      isFinalAssessmentPresent = false,
      showQueryRelatedSlides = false,
    },
    ref
  ) => {
    const [conversationState, setConversationState] = useState({
      isLoading: false,
      isConnected: false,
      isAudioPlaying: false,
    });
    const [isJumpedOnChatFromInteractionMode, setIsJumpedOnChatFromInteractionMode] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [hasInitialized, setHasInitialized] = useState(false);
    const [lastVideoSrc, setLastVideoSrc] = useState("");
    // Slide view tracking
    const [slideViewStartTime, setSlideViewStartTime] = useState("");
    const [videoStartTime, setVideoStartTime] = useState(0);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const videoRef = useRef(null);
    const activeVideoRef = useRef(null);
    const preloadVideoRef = useRef(null); // For preloading next video
    const router = useRouter();
    const dispatch = useDispatch();
    const [generateImage, { isLoading: isImageLoading }] = useGenerateImageMutation();
    const {
      currentVideoIndex,
      isQuestionMode,
      currentVideoTime: reduxCurrentVideoTime,
      selectedAssessmentId,
      autoPlayEnabled,
      currentVideoTime,
    } = useSelector((state) => state.video);
    const { capture } = usePostHog();
    const isQuestionModeRef = useRef(isQuestionMode);
    const [showChat, setShowChat] = useState(false);
    const [persistentConversationHistory, setPersistentConversationHistory] = useState([]);
    const [contextSent, setContextSent] = useState(false);
    // Keep ref updated with current isQuestionMode value
    useEffect(() => {
      isQuestionModeRef.current = isQuestionMode;
    }, [isQuestionMode]);
    // Load conversation history on component mount
    useEffect(() => {
      const storedHistory = getStoredConversationHistory();
      setPersistentConversationHistory(storedHistory);
    }, []);

    // Generate context summary from conversation history
    const generateContextSummary = () => {
      if (persistentConversationHistory.length === 0) return "";

      // Get the last N meaningful messages for context (configurable)
      const recentMessages = persistentConversationHistory
        .filter((msg) => msg.message && msg.message.trim() && !msg.message.includes("audioData"))
        .slice(-MAX_CONTEXT_MESSAGES)
        .map((msg) => {
          const source = msg.source === "user" ? "User" : "AI";
          return `${source}: ${msg.message}`;
        })
        .join("\n");

      return recentMessages
        ? `Previous conversation context:\n${recentMessages}\n\nPlease continue our conversation naturally based on this context.`
        : "";
    };

    // Helper: round seconds to 1 decimal place
    const formatSeconds = (sec) => {
      if (typeof sec !== "number") return sec;
      return Math.round(sec * 10) / 10;
    };

    // ElevenLabs Conversational AI
    const conversation = useConversation({
      // apiKey: process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY,
      // connectionDelay: {
      //   android: 3000,
      //   ios: 1000,
      //   default: 1000,
      // },
      useWakeLock: false, // Disable wake lock to prevent connection issues

      onConnect: () => {
        console.log("Connected to ElevenLabs");
        setConversationState((prev) => ({ ...prev, isConnected: true }));

        // Send context immediately when connected
        setTimeout(() => {
          try {
            const contextSummary = generateContextSummary();
            if (contextSummary && !contextSent) {
              try {
                conversation.sendContextualUpdate(
                  `Previous conversation history: ${contextSummary}. Please remember this context for our continued conversation.`
                );
                setContextSent(true);
              } catch (error) {
                console.error("Error sending context:", error);
              }
            }
          } catch (error) {
            console.error("Could not send context on connect:", error.message);
          }
        }, 2000);
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
        const userDetails = getUserDetailsFromToken();
        const currentVideo = videos[currentVideoIndex];
        if (isQuestionModeRef.current) {
          dispatch(setIsQuestionMode(false));
          capture("slide_redirect", {
            user_id: userDetails?.sub,
            module_id: presentationId,
            slide_id: currentVideo?.slide,
          });
        }
        setConversationState((prev) => ({
          ...prev,
          isConnected: false,
          isAudioPlaying: false,
        }));
      },
      onMessage: (message) => {
         const content = message.message;
        // Store in current session history (for ChatUI)
        if (message.source === "user") {
          // Trigger API call for image generation only if showQueryRelatedSlides is true
          if (showQueryRelatedSlides) {
            dispatch(setImageLoading(true));
            const currentVideo = videos[currentVideoIndex];
            generateImage({ 
              presentationId: parseInt(presentationId),
              currentSlideId: currentVideo?.slide,
              userMessage: content, 
            }).unwrap().then((response) => {
              dispatch(setOverlayImage(response.imageUrl));
            }).catch((error) => {
              console.log('Failed to generate image:', error);
              dispatch(setImageLoading(false));
            });
          }
        
          if (content.trim() === "") return;

          // Track QnA interaction when user asks a question
          const userDetails = getUserDetailsFromToken();
          capture("qna_interaction", {
            user_id: userDetails?.sub,
            module_id: presentationId,
            question_text: content,
            timestamp: new Date().toISOString(),
          });

          setConversationHistory((prev) => [...prev, { type: "question", content }]);
        } else {
          setConversationHistory((prev) => [...prev, { type: "answer", content: message.message }]);
        }

        // Send context after AI's first message (only if not already sent)
        if (message.source === "ai" && !contextSent) {
          setContextSent(true);

          // Wait a moment for the AI to finish speaking, then send context as backup
          setTimeout(() => {
            try {
              const contextSummary = generateContextSummary();
              if (contextSummary) {
                try {
                  conversation.sendContextualUpdate(
                    `Previous conversation history: ${contextSummary}. Please remember this context for our continued conversation.`
                  );
                } catch (error) {
                  console.error("Error sending backup context:", error);
                }
              }
            } catch (error) {
              console.error("Could not send backup context:", error.message);
            }
          }, 2000);
        }

        // Store in persistent history (for context continuity)
        if (message.message && message.message.trim() && !message.message.includes("audioData")) {
          const newMessage = {
            id: Date.now() + Math.random(),
            timestamp: new Date().toISOString(),
            source: message.source,
            message: message.message,
            type: message.type || "text",
          };

          setPersistentConversationHistory((prev) => {
            const updated = [...prev, newMessage];
            saveConversationHistory(updated);
            return updated;
          });
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

        // Reset context sent flag for new conversation
        setContextSent(false);

        setConversationState((prev) => ({ ...prev, isLoading: true }));
        await navigator.mediaDevices.getUserMedia({ audio: true });
        await conversation.startSession({
          agentId: agentId,
          userId: getUserDetailsFromToken()?.email,
        });

        // Send context immediately after connection is established
        setTimeout(() => {
          try {
            const contextSummary = generateContextSummary();
            if (contextSummary) {
              try {
                conversation.sendContextualUpdate(
                  `Previous conversation history: ${contextSummary}. Please remember this context for our continued conversation.`
                );
                setContextSent(true);
              } catch (error) {
                console.error("Error sending initial context:", error);
              }
            }
          } catch (error) {
            console.error("Could not send initial context:", error.message);
          }
        }, 1500);
      } catch (error) {
        console.log("Failed to start conversation:", error);
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
    const [initialVideoTime, setInitialVideoTime] = useState(0);

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
        router.push(getRedirectPath());
      }

      return () => clearInterval(timer);
    }, [showRedirectPopup, countdown, router, isPresentationQuizPassed]);

    // Initialize video on first load
    useEffect(() => {
      if (videoRef.current && videos?.length > 0 && !hasInitialized) {
        console.log("Initializing video player...");

        // Update slide when video invideos[currentVideoIndex].slideitializes
        if (videos?.[currentVideoIndex]?.slide) {
          dispatch(setCurrentSlide(videos[currentVideoIndex].slide));

          // Track initial slide view event
          const userDetails = getUserDetailsFromToken();
          const currentTime = new Date().toISOString();

          capture("slide_view", {
            user_id: userDetails?.sub,
            module_id: presentationId,
            slide_id: videos[currentVideoIndex].slide,
            slide_title: videos[currentVideoIndex].title,
            timestamp: currentTime,
          });
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
            currentTime: videoRef.current?.getCurrentTime() || 0,
            isPlaying: false,
            currentVideoIndex,
            duration: videoRef.current?.getDuration() || 0,
          });
        }
      }
    };

    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
      pauseVideo,
      getCurrentTime: () => videoRef.current?.getCurrentTime() || 0,
      getDuration: () => videoRef.current?.getDuration() || 0,
    }));

    // Note: Video settings are now handled by VideoPlayer component props

    // Handle video index changes (only when actually changing)
    useEffect(() => {
      if (videoRef.current && hasInitialized && videos?.length > 0) {
        const currentVideo = videos[currentVideoIndex];
        const newSrc = currentVideo?.trainer_video;

        // Save progress for previous video when switching
        if (newSrc && newSrc !== lastVideoSrc && lastVideoSrc) {
          const prevVideoIndex = videos.findIndex((v) => v.trainer_video === lastVideoSrc);
          if (prevVideoIndex !== -1) {
            const prevVideo = videos[prevVideoIndex];
            const currentTime = videoRef.current?.getCurrentTime() || 0;
            updateVideoProgress(presentationId, prevVideo.slide, Math.floor(currentTime - videoStartTime));
          }
        }

        // Only reload if the source is actually different
        if (newSrc && newSrc !== lastVideoSrc) {
          setLastVideoSrc(newSrc);
          console.log(`Switching to video ${currentVideoIndex}...`);

          // Calculate initial time for new video
          let startTime = 0;
          if (typeof reduxCurrentVideoTime === "number" && reduxCurrentVideoTime > 0) {
            startTime = reduxCurrentVideoTime;
          } else if (currentVideo?.is_completed) {
            // If video is completed, always start from 0
            startTime = 0;
          } else if (currentVideo && typeof currentVideo.duration_viewed === "number") {
            startTime = currentVideo.duration_viewed;
          }

          if (
            currentVideo &&
            typeof currentVideo.duration === "number" &&
            typeof currentVideo.duration_viewed === "number" &&
            Math.abs(currentVideo.duration - currentVideo.duration_viewed) <= 1e-6
          ) {
            startTime = 0;
          }

          // setInitialVideoTime(startTime);
          // as quick fix it is set to 0 sec upper commented code is correct one
          setInitialVideoTime(0);

          // VideoPlayer component handles loading automatically via src prop change
          // Preloading is handled internally by Video.js
          if (preloadedVideoIndex === currentVideoIndex) {
            setPreloadedVideoIndex(-1); // Reset preload tracking
          }

          // Update slide when video changes
          if (currentVideo?.slide) {
            dispatch(setCurrentSlide(currentVideo.slide));

            // Start new video session
            startVideoSession(presentationId, currentVideo.slide);
            setVideoStartTime(0);

            // Track slide view event
            const userDetails = getUserDetailsFromToken();
            const currentTime = new Date().toISOString();

            // Track slide view event
            capture("slide_view", {
              user_id: userDetails?.sub,
              module_id: presentationId,
              slide_id: currentVideo.slide,
              slide_title: currentVideo.title,
              timestamp: currentTime,
            });

            // Set new slide view start time
            setSlideViewStartTime(currentTime);
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

            // Wait for video to be ready before playing to avoid play/pause conflicts
            setTimeout(() => {
              if (videoRef.current && videoRef.current.play) {
                const playPromise = videoRef.current.play();
                if (playPromise !== undefined) {
                  playPromise.catch((error) => {
                    console.log("Auto-play was prevented:", error);
                    // Auto-play was prevented, this is normal behavior
                  });
                }
              }
            }, 100);
          }
        }
      }
    }, [currentVideoIndex, videos, dispatch, preloadedVideoIndex, hasInitialized, autoPlayEnabled]);

    // Add effect to scroll active video into view
    useEffect(() => {
      if (activeVideoRef.current) {
        activeVideoRef.current.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    }, [currentVideoIndex]);

    // Sync PPT to video panel when video starts playing
    useEffect(() => {
      if (isPlaying) {
        // When video panel starts playing, sync PPT to the same video
        dispatch(syncPptToVideoPanel());
        console.log(`Syncing PPT to video panel's current video: ${currentVideoIndex + 1}`);
      }
    }, [isPlaying, currentVideoIndex, dispatch]);

    // Reset conversation state when exiting question mode
    useEffect(() => {
      if (!isQuestionMode && conversationState.isConnected) {
        stopConversation();
      }
    }, [isQuestionMode]);

    // Pause video when assessment is selected
    useEffect(() => {
      if (selectedAssessmentId && videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause();
        setIsPlaying(false);
        dispatch(setIsVideoPlaying(false));
        dispatch(setAutoPlayEnabled(false));
      }
    }, [selectedAssessmentId, dispatch]);

    // Cleanup is handled by VideoPlayer component

    // Handle video end
    const handleVideoEnd = () => {
      // Save progress for completed video
      const currentVideo = videos?.[currentVideoIndex];
      const currentTime = videoRef.current?.getCurrentTime() || 0;
      if (currentVideo) {
        updateVideoProgress(presentationId, currentVideo.slide, Math.floor(currentTime - videoStartTime));
      }

      // Track video completion event
      const userDetails = getUserDetailsFromToken();
      console.log(currentVideo, "currentVideo");
      if (currentVideo) {
        capture("video_complete", {
          user_id: userDetails?.sub,
          video_id: currentVideo.slide,
          watch_duration: currentTime,
          replays: null,
        });
      }

      // Call parent callback for last video
      if (currentVideoIndex >= videos?.length - 1 && onVideoEnd) {
        onVideoEnd();
      }

      if (currentVideoIndex < videos?.length - 1) {
        const nextVideoIndex = currentVideoIndex + 1;
        const nextVideo = videos[nextVideoIndex];
        const currentVideo = videos[currentVideoIndex];
        const currentVideoAssessmentId = currentVideo?.slide_assessments?.[0]?.id;
        if (currentVideoAssessmentId) {
          console.log(currentVideoAssessmentId, "currentVideoAssessmentId");
          dispatch(setSelectedAssessmentId(currentVideoAssessmentId));
          return;
        }
        console.log(nextVideo?.slide_assessments !== null, "nextVideo");
        dispatch(setAutoPlayEnabled(true)); // Enable autoplay for next video
        // Set start time for next video based on its duration_viewed (unless duration equals duration_viewed)
        try {
          let startTime = 0;
          // If next video is completed, always start from 0
          if (nextVideo?.is_completed) {
            startTime = 0;
          } else if (nextVideo && typeof nextVideo.duration_viewed === "number") {
            startTime = nextVideo.duration_viewed;
          }
          if (
            nextVideo &&
            typeof nextVideo.duration === "number" &&
            typeof nextVideo.duration_viewed === "number" &&
            Math.abs(nextVideo.duration - nextVideo.duration_viewed) <= 1e-6
          ) {
            startTime = 0;
          }
          // setInitialVideoTime(startTime || 0);
          // dispatch(setCurrentVideoTime(startTime || 0));

          // as quick fix it is set to 0 sec upper commented code is correct one
          setInitialVideoTime(0);
          dispatch(setCurrentVideoTime(0));
        } catch (err) {
          // ignore
        }
        dispatch(setCurrentVideoIndex(nextVideoIndex));
        dispatch(setCurrentSlide(nextVideo?.slide));

        // Track slide view for auto-advanced video
        if (nextVideo?.slide) {
          const userDetails = getUserDetailsFromToken();
          const currentTime = new Date().toISOString();

          capture("slide_view", {
            user_id: userDetails?.sub,
            module_id: presentationId,
            slide_id: nextVideo.slide,
            slide_title: nextVideo.title,
            timestamp: currentTime,
          });

          setSlideViewStartTime(currentTime);
        }
      } else {
        // setShowRedirectPopup(true);
        if (!isFinalAssessmentPresent) {
          setShowFeedbackModal(true);
        }
        dispatch(setAutoPlayEnabled(false));
        dispatch(setSelectedAssessmentId(assessmentId));
      }
    };

    // Close popup handler
    const handleClosePopup = () => {
      setShowRedirectPopup(false);
      setCountdown(10);
    };

    const handleRedirectToHomePage = () => {
      router.push("/");
    };

    // Format time in MM:SS
    const formatTime = (timeInSeconds) => {
      const minutes = Math.floor(timeInSeconds / 60);
      const seconds = Math.floor(timeInSeconds % 60);
      return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    };

    // Toggle play/pause
    const togglePlayPause = () => {
      if (videoRef.current) {
        if (isPlaying) {
          videoRef.current.pause();
          setIsPlaying(false);
        } else {
          // Reset answerPptIndex when video starts playing
          dispatch(setAnswerPptIndex(null));

          // Pause any playing answer audio when video starts
          if (onPauseAnswerAudio) {
            onPauseAnswerAudio();
          }

          videoRef.current.play();
        }
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

    // Global redirect path - always go to assessment first
    const getRedirectPath = () => {
      const currentPath = window.location.pathname;
      const presentationId = currentPath.split("/lectures/")[1];
      return assessmentId
        ? `/assessment/${presentationId}?assessment-id=${assessmentId}`
        : `/assessment/${presentationId}`;
    };
    // Determine device type for responsive styling
    const isPhone = isPhoneView;
    const isMobile = isMobileView;

    return (
      <div
        className={`flex flex-col h-full ${
          isMobile ? `${isPhone ? "gap-1" : "gap-3"}` : "gap-4 flex-shrink-0 pl-4 relative"
        } ${selectedAssessmentId ? "pointer-events-none blur-[1px]" : ""}`}
        style={!isMobile ? { width } : undefined}>
        {/* Redirect Popup - Unified for both mobile and desktop */}
        {showRedirectPopup && (
          <div className="fixed inset-0 bg-[#00000080] flex items-center justify-center z-50">
            <div
              className={`relative flex flex-col items-center gap-5 w-96 bg-white rounded-2xl ${
                isPhone ? "p-5" : "p-6"
              }`}>
              {/* Content Container */}
              <div className="flex flex-col items-center gap-6 w-[336px]">
                {/* Icon */}
                <div className="flex flex-col items-center gap-5 w-[336px]">
                  <Image
                    src={redirecting_logo}
                    alt="Training Completed"
                    width={80}
                    height={80}
                    className="w-[50px] h-[50px]"
                  />

                  {/* Text Content */}
                  <div className="flex flex-col items-center gap-2 w-[336px] h-[70px]">
                    <h3 className="font-lato font-bold text-xl leading-6 text-[#1A1C29]">Training Completed!</h3>
                    <div className="flex flex-col items-center gap-1 w-[336px] h-[38px]">
                      <p className="font-lato font-normal text-sm leading-[17px] text-center text-[rgba(26,28,41,0.8)]">
                        You'll be redirected to the assessment in
                      </p>
                      <span className="font-lato font-bold text-sm leading-[17px] text-[#744FFF]">
                        {countdown} seconds.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex flex-row items-center gap-3 w-[336px] h-10">
                  <button
                    onClick={handleRedirectToHomePage}
                    className="flex justify-center items-center px-4 py-[6px] gap-2.5 w-[162px] h-10 bg-[rgba(116,79,255,0.12)] rounded-[73.75px] cursor-pointer">
                    <span className="font-lato font-semibold text-base leading-4 text-center text-[#744FFF]">
                      Do It Later
                    </span>
                  </button>
                  <button
                    onClick={() => router.push(getRedirectPath())}
                    className="flex justify-center items-center px-4 py-[6px] gap-2.5 w-[162px] h-10 bg-[#744FFF] rounded-[73.75px] cursor-pointer">
                    <span className="font-lato font-semibold text-base leading-4 text-center text-white">
                      Start Now
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Video Section - Responsive for both mobile and desktop */}
        {!isOnlyVideoMode && (
          <div
            className={`cursor-pointer bg-white border border-[#E5E7EB] ${
              isMobile
                ? isPhone
                  ? "p-1 md:p-[6px] lg:p-3 rounded flex-shrink-0"
                  : "p-2 pb-1 rounded-lg"
                : "p-3 pb-2 rounded-xl"
            } ${showChat || isQuestionMode ? "hidden" : ""}`}
            onClick={togglePlayPause}>
            <div
              className={`relative w-full bg-black overflow-hidden ${
                isMobile ? (isPhone ? "pt-[25%] h-32 rounded" : "pt-[40%] h-50 rounded-lg") : "pt-[56.25%] rounded-lg"
              }`}>
              <VideoPlayerContainer
                ref={videoRef}
                videos={videos}
                currentVideoIndex={currentVideoIndex}
                presentationId={presentationId}
                canSkipVideo={canSkipVideo}
                isMobile={isMobile}
                onVideoStateChange={onVideoStateChange}
                onVideoEnd={handleVideoEnd}
                onSkipBackward={(data) => {
                  const userDetails = getUserDetailsFromToken();
                  const currentVideo = videos?.[currentVideoIndex];
                  if (currentVideo) {
                    capture("video_skip_backward", {
                      user_id: userDetails?.sub,
                      video_id: currentVideo.slide,
                      from_time: formatSeconds(data.from),
                      to_time: formatSeconds(data.to),
                    });
                  }
                }}
                className="absolute top-0 left-0 w-full h-full"
                initialVideoTime={initialVideoTime}
                autoPlayEnabled={autoPlayEnabled}
                showRemainingDuration={isMobile}
              />

              {/* Custom styles are now handled by VideoPlayer component */}
            </div>

            {/* Time display - Responsive styling */}
            <div
              className={`px-1 flex justify-between font-lato text-gray-600 ${
                isMobile
                  ? `mt-1 ${isPhone ? "text-[8px] leading-3" : "text-[10px] leading-4"}`
                  : "mt-2 text-[12px] leading-4 tracking-normal font-normal text-center"
              }`}>
              <span>
                {/* {formatTime(videoRef.current?.getCurrentTime() || 0)} / {formatTime(videoRef.current?.getDuration() || 0)} */}
                {formatTime(currentVideoTime || 0)} / {formatTime(videos?.[currentVideoIndex]?.duration || 0)}
              </span>
              <span>
                {isMobile
                  ? `${currentVideoIndex + 1}/${videos?.length}`
                  : `${(videos ?? [])?.[currentVideoIndex]?.slide}/${videos?.length}`}
              </span>
            </div>
          </div>
        )}

        {/* AI Assistant Section - Responsive */}
        <div
          className={`${isMobile && isPhone ? "flex-1 min-h-0" : "h-full"} ${showChat || isQuestionMode ? "hidden" : ""}`}>
          <AILearningAssistant
            setShowChat={setShowChat}
            showChat={showChat}
            onStartConversation={startConversation}
            onStopConversation={stopConversation}
            onPauseVideo={pauseVideo}
            onPauseSlideVideo={onPauseSlideVideo}
            agentId={agentId}
            isMobileView={isMobile && isPhone}
          />
        </div>

        {/* Question Mode AI - Responsive */}
        {isQuestionMode && (
          <QuestionModeAI
            isLoading={!conversationState.isConnected}
            isAudioPlaying={conversation.isSpeaking}
            isConnected={conversationState.isConnected}
            avatarUrl={avatarUrl}
            isMobile={isMobile && isPhone}
          />
        )}

        {/* Chat UI - Responsive */}
        {showChat && (
          <ChatUI
            onClose={handleCloseChatUI}
            conversation={conversationHistory}
            onStartConversation={startConversation}
            onStopConversation={stopConversation}
            isConnected={conversationState.isConnected}
            setShowChat={setShowChat}
            setIsJumpedOnChatFromInteractionMode={setIsJumpedOnChatFromInteractionMode}
            agentId={agentId}
            isMobile={isMobile && isPhone}
            onPauseSlideVideo={onPauseSlideVideo}
          />
        )}

        {/* Question Mode User - Responsive */}
        {isQuestionMode && !showChat && (
          <QuestionModeUser
            onPauseVideo={pauseVideo}
            onStartConversation={startConversation}
            onStopConversation={stopConversation}
            setShowChat={setShowChat}
            onPauseAnswerAudio={stopAnswerAudio}
            isAudioPlaying={conversationState.isAudioPlaying}
            isAudioLoading={isListening}
            isConnected={conversationState.isConnected}
            setIsJumpedOnChatFromInteractionMode={setIsJumpedOnChatFromInteractionMode}
            isMobile={isMobile && isPhone}
          />
        )}
        <FeedbackModal
          isOpen={showFeedbackModal}
          onClose={() => setShowFeedbackModal(false)}
          presentationId={presentationId}
        />
      </div>
    );
  }
);

VideoPanel.displayName = "VideoPanel";

export default VideoPanel;
