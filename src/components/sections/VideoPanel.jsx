import {
  setCurrentSlide,
  setCurrentVideoIndex,
  setCurrentVideoTime,
  setIsVideoPlaying,
  syncPptToVideoPanel,
  setAnswerPptIndex,
  setIsQuestionMode,
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
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [autoPlayEnabled, setAutoPlayEnabled] = useState(false);
    const [previousTime, setPreviousTime] = useState(0);
    // Use a ref to reliably capture the previous time across event handlers
    const previousTimeRef = useRef(0);
    // Track whether a seek is in progress to avoid racing with onTimeUpdate
    const isSeekingRef = useRef(false);
    // Keep a short rolling buffer of recent timeupdate values to infer pre-seek time
    const timeSamplesRef = useRef([]);
    // When we programmatically restore the time to block a user seek we mark this ref
    // so we can ignore the resulting seek events.
    const blockedSeekRef = useRef(false);
    // Slide view tracking
    const [slideViewStartTime, setSlideViewStartTime] = useState("");
    const [videoStartTime, setVideoStartTime] = useState(0);
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
    const {
      currentVideoIndex,
      isQuestionMode,
      currentVideoTime: reduxCurrentVideoTime,
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
        // Store in current session history (for ChatUI)
        if (message.source === "user") {
          const content = message.message;
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
        // setCountdown((prev) => {
        //   if (prev <= 1) {
        //     clearInterval(timer);
        //     return 0;
        //   }
        //   return prev - 1;
        // });
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

        // Save progress for previous video when switching
        if (newSrc && newSrc !== lastVideoSrc && lastVideoSrc) {
          const prevVideoIndex = videos.findIndex((v) => v.trainer_video === lastVideoSrc);
          if (prevVideoIndex !== -1) {
            const prevVideo = videos[prevVideoIndex];
            updateVideoProgress(presentationId, prevVideo.slide, Math.floor(currentTime - videoStartTime));
          }
        }

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
              console.log("Error using preloaded video, falling back to normal load:", error);
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

            videoRef.current.play().catch((error) => {
              console.log("Error playing video:", error);
            });
          }
        }
      }
    }, [currentVideoIndex, videos, dispatch, preloadedVideoIndex, hasInitialized, autoPlayEnabled, videoSettings]);

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
            const img = new window.Image();
            img.src = videos[nextVideoIndex].thumbnail;
            // console.log("Preloading thumbnail:", videos[nextVideoIndex]?.thumbnail);
            // img.src =
            //   "https://cdn-api.epic.dev.esmagico.in/trainboost/slides/thumb.png";
          }
        }
      }
    }, [currentTime, duration, currentVideoIndex, videos, preloadedVideoIndex, videoSettings]);

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
      // Save progress for completed video
      const currentVideo = videos?.[currentVideoIndex];
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
        console.log(nextVideo, "nextVideo");
        setAutoPlayEnabled(true); // Enable autoplay for next video
        // Set start time for next video based on its duration_viewed (unless duration equals duration_viewed)
        try {
          let startTime = 0;
          if (nextVideo && typeof nextVideo.duration_viewed === "number") {
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
          dispatch(setCurrentVideoTime(startTime || 0));
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
        setShowRedirectPopup(true);
        setAutoPlayEnabled(false);
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

    // Handle video selection from playlist
    const handleVideoSelect = (index) => {
      if (index !== currentVideoIndex) {
        // Save progress for current video before switching
        const currentVideo = videos[currentVideoIndex];
        if (currentVideo) {
          updateVideoProgress(presentationId, currentVideo.slide, Math.floor(currentTime - videoStartTime));
        }

        setAutoPlayEnabled(true); // Enable autoplay when selecting from playlist
        // Set the new video's start time from its duration_viewed
        try {
          const target = videos?.[index];
          let startTime = 0;
          if (target && typeof target.duration_viewed === "number") startTime = target.duration_viewed;
          if (
            target &&
            typeof target.duration === "number" &&
            typeof target.duration_viewed === "number" &&
            Math.abs(target.duration - target.duration_viewed) <= 1e-6
          ) {
            startTime = 0;
          }
          dispatch(setCurrentVideoTime(startTime || 0));
        } catch (err) {}
        dispatch(setCurrentVideoIndex(index));
        setIsPlaying(false);
      }
    };

    // Handle transcript item click
    const handleTranscriptClick = (index) => {
      setAutoPlayEnabled(true);
      try {
        const target = videos?.[index];
        let startTime = 0;
        if (target && typeof target.duration_viewed === "number") startTime = target.duration_viewed;
        if (
          target &&
          typeof target.duration === "number" &&
          typeof target.duration_viewed === "number" &&
          Math.abs(target.duration - target.duration_viewed) <= 1e-6
        ) {
          startTime = 0;
        }
        dispatch(setCurrentVideoTime(startTime || 0));
      } catch (err) {}
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

    // Global redirect path
    const getRedirectPath = () => {
      const currentPath = window.location.pathname;
      const presentationId = currentPath.split("/lectures/")[1];
      return isPresentationQuizPassed
        ? `/review/${presentationId}?showDisclaimer=true`
        : assessmentId
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
        }`}
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
        {!isQuestionMode && !showChat && (
          <div
            className={`cursor-pointer bg-white border border-[#E5E7EB] ${
              isMobile
                ? isPhone
                  ? "p-1 md:p-[6px] lg:p-3 rounded flex-shrink-0"
                  : "p-2 pb-1 rounded-lg"
                : "p-3 pb-2 rounded-xl"
            }`}
            onClick={togglePlayPause}>
            <div
              className={`relative w-full bg-black overflow-hidden ${
                isMobile ? (isPhone ? "pt-[25%] h-32 rounded" : "pt-[40%] h-50 rounded-lg") : "pt-[56.25%] rounded-lg"
              }`}>
              <video
                key={`trainer-video-${currentVideoIndex}`}
                ref={videoRef}
                src={videos?.[currentVideoIndex]?.trainer_video}
                className={`absolute top-0 left-0 w-full h-full object-cover ${
                  !canSkipVideo ? "no-skip-controls" : ""
                }`}
                controlsList={!canSkipVideo ? "nodownload nofullscreen noremoteplayback" : "nodownload"}
                style={!canSkipVideo ? { pointerEvents: "none" } : undefined}
                onEnded={handleVideoEnd}
                onTimeUpdate={(e) => {
                  const time = e.target.currentTime;

                  // Desktop-specific time tracking logic
                  if (!isMobile) {
                    try {
                      const samples = timeSamplesRef.current;
                      samples.push(time);
                      if (samples.length > 6) samples.shift();
                      timeSamplesRef.current = samples;
                    } catch (err) {
                      timeSamplesRef.current = [time];
                    }

                    if (!isSeekingRef.current) {
                      previousTimeRef.current = currentTime;
                      setPreviousTime(currentTime);
                    }
                  }

                  setCurrentTime(time);
                  dispatch(setCurrentVideoTime(time));

                  // Update video progress for desktop
                  if (!isMobile) {
                    const currentVideo = videos?.[currentVideoIndex];
                    if (currentVideo && !e.target.paused) {
                      updateVideoProgress(presentationId, currentVideo.slide, Math.floor(time));
                    }
                  }

                  onVideoStateChange?.({
                    currentTime: time,
                    isPlaying: !e.target.paused,
                    currentVideoIndex,
                    duration: e.target.duration || duration,
                  });
                }}
                onSeeking={() => {
                  // Desktop-specific seeking logic
                  if (!isMobile) {
                    if (!canSkipVideo) {
                      const prev = previousTimeRef.current ?? currentTime;
                      blockedSeekRef.current = true;
                      requestAnimationFrame(() => {
                        if (videoRef.current && Math.abs(videoRef.current.currentTime - prev) > 0.01) {
                          try {
                            videoRef.current.currentTime = prev;
                          } catch (err) {
                            // ignore
                          }
                        }
                      });
                      return;
                    }

                    isSeekingRef.current = true;
                    previousTimeRef.current = videoRef.current?.currentTime || currentTime;
                    setPreviousTime(previousTimeRef.current);
                  }
                }}
                onSeeked={(e) => {
                  // Desktop-specific seeked logic
                  if (!isMobile) {
                    const newTime = e.target.currentTime;
                    if (blockedSeekRef.current) {
                      blockedSeekRef.current = false;
                      previousTimeRef.current = newTime;
                      setPreviousTime(newTime);
                      return;
                    }

                    isSeekingRef.current = false;

                    const samples = timeSamplesRef.current || [];
                    const THRESHOLD = 0.3;
                    let inferredFrom = previousTimeRef.current ?? previousTime;
                    for (let i = samples.length - 1; i >= 0; i--) {
                      const sample = samples[i];
                      if (Math.abs(sample - newTime) > THRESHOLD) {
                        inferredFrom = sample;
                        break;
                      }
                    }

                    const fromTime = inferredFrom;
                    previousTimeRef.current = newTime;
                    setPreviousTime(newTime);

                    if (newTime > fromTime + 0.001) {
                      const userDetails = getUserDetailsFromToken();
                      const currentVideo = videos?.[currentVideoIndex];
                      if (currentVideo) {
                        capture("video_skip", {
                          user_id: userDetails?.sub,
                          video_id: currentVideo.slide,
                          from_time: formatSeconds(fromTime),
                          to_time: formatSeconds(newTime),
                        });
                      }
                    }
                  }
                }}
                onLoadedMetadata={(e) => {
                  const newDuration = e.target.duration;
                  setDuration(newDuration);
                  applyVideoSettings(e.target);

                  try {
                    const slideObj = videos?.[currentVideoIndex];
                    let startTime = 0;

                    if (typeof reduxCurrentVideoTime === "number" && reduxCurrentVideoTime > 0) {
                      startTime = reduxCurrentVideoTime;
                    } else if (slideObj && typeof slideObj.duration_viewed === "number") {
                      startTime = slideObj.duration_viewed;
                    }

                    if (
                      slideObj &&
                      typeof slideObj.duration === "number" &&
                      typeof slideObj.duration_viewed === "number" &&
                      Math.abs(slideObj.duration - slideObj.duration_viewed) <= 1e-6
                    ) {
                      startTime = 0;
                    }

                    if (startTime && typeof startTime === "number" && !isNaN(startTime)) {
                      const safeStart = Math.min(startTime, newDuration || startTime);
                      try {
                        e.target.currentTime = safeStart;
                      } catch (err) {}
                      dispatch(setCurrentVideoTime(safeStart));
                      setCurrentTime(safeStart);
                    }
                  } catch (err) {
                    console.error("Error applying start time on metadata load", err);
                  }

                  onVideoStateChange?.({
                    currentTime,
                    isPlaying,
                    currentVideoIndex,
                    duration: newDuration,
                  });
                }}
                onCanPlay={(e) => {
                  if (!isMobile) {
                    console.log("Trainer video can play");
                  }
                  applyVideoSettings(e.target);
                }}
                onClick={(e) => e.stopPropagation()}
                onPlay={() => {
                  setIsPlaying(true);
                  dispatch(setIsVideoPlaying(true));
                  dispatch(setAnswerPptIndex(null));
                  onPauseAnswerAudio?.();

                  if (!isMobile) {
                    setVideoStartTime(currentTime);
                  }

                  const userDetails = getUserDetailsFromToken();
                  const currentVideo = videos?.[currentVideoIndex];
                  if (currentVideo) {
                    capture("video_play", {
                      user_id: userDetails?.sub,
                      module_id: presentationId,
                      video_id: currentVideo.slide,
                      timestamp: new Date().toISOString(),
                    });
                  }

                  onVideoStateChange?.({
                    currentTime,
                    isPlaying: true,
                    currentVideoIndex,
                    duration,
                  });
                }}
                onPause={() => {
                  setIsPlaying(false);
                  dispatch(setIsVideoPlaying(false));

                  const userDetails = getUserDetailsFromToken();
                  const currentVideo = videos?.[currentVideoIndex];
                  if (currentVideo) {
                    capture("video_pause", {
                      user_id: userDetails?.sub,
                      video_id: currentVideo.slide,
                      current_time: currentTime,
                      timestamp: new Date().toISOString(),
                    });
                  }

                  onVideoStateChange?.({
                    currentTime,
                    isPlaying: false,
                    currentVideoIndex,
                    duration,
                  });
                }}
                onLoadStart={() => {
                  if (!isMobile) {
                    console.log("Trainer video loading started...");
                  }
                }}
                onVolumeChange={(e) => {
                  if (!isMobile) {
                    const newMuted = e.target.muted;
                    const newVolume = e.target.volume;

                    if (newMuted !== videoSettings.muted || newVolume !== videoSettings.volume) {
                      setVideoSettings((prev) => ({
                        ...prev,
                        muted: newMuted,
                        volume: newVolume,
                      }));
                    }
                  }
                }}
                onRateChange={(e) => {
                  if (!isMobile) {
                    const newRate = e.target.playbackRate;
                    if (newRate !== videoSettings.playbackRate) {
                      setVideoSettings((prev) => ({
                        ...prev,
                        playbackRate: newRate,
                      }));
                    }
                  }
                }}
                poster={videos?.[currentVideoIndex]?.thumbnail}
                autoPlay={autoPlayEnabled}
                controls={true}
                disablePictureInPicture
              />

              {/* Desktop-only styles for no-skip controls */}
              {!isMobile && (
                <style jsx global>{`
                  /* WebKit browsers (Safari, Chrome) */
                  .no-skip-controls::-webkit-media-controls-timeline,
                  .no-skip-controls::-webkit-media-controls-seek-back-button,
                  .no-skip-controls::-webkit-media-controls-seek-forward-button,
                  .no-skip-controls::-webkit-media-controls-current-time-display,
                  .no-skip-controls::-webkit-media-controls-time-remaining-display,
                  .no-skip-controls::-webkit-media-controls-slider {
                    pointer-events: none !important;
                    cursor: not-allowed !important;
                  }

                  /* Mobile-specific: Disable touch interactions */
                  .no-skip-controls {
                    -webkit-touch-callout: none !important;
                    -webkit-user-select: none !important;
                    -khtml-user-select: none !important;
                    -moz-user-select: none !important;
                    -ms-user-select: none !important;
                    user-select: none !important;
                  }

                  /* Additional mobile browser support */
                  @media (max-width: 1024px) {
                    .no-skip-controls {
                      pointer-events: none !important;
                    }
                    .no-skip-controls::-webkit-media-controls {
                      pointer-events: none !important;
                    }
                  }
                `}</style>
              )}
            </div>

            {/* Time display - Responsive styling */}
            <div
              className={`px-1 flex justify-between font-lato text-gray-600 ${
                isMobile
                  ? `mt-1 ${isPhone ? "text-[8px] leading-3" : "text-[10px] leading-4"}`
                  : "mt-2 text-[12px] leading-4 tracking-normal font-normal text-center"
              }`}>
              <span>
                {formatTime(currentTime)} / {formatTime(duration)}
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
        {!isQuestionMode && !showChat && (
          <div className={isMobile && isPhone ? "flex-1 min-h-0" : "h-full"}>
            <AILearningAssistant
              setShowChat={setShowChat}
              showChat={showChat}
              onStartConversation={startConversation}
              onStopConversation={stopConversation}
              agentId={agentId}
              isMobileView={isMobile && isPhone}
            />
          </div>
        )}

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
      </div>
    );
  }
);

VideoPanel.displayName = "VideoPanel";

export default VideoPanel;
