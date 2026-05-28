import React, { useState, useRef, useEffect } from 'react'
import chat_history from '@/assets/svg/chat_history.svg'
import back_to_session from '@/assets/svg/back_to_session.svg'
import Image from 'next/image'
import tap_to_speak from '@/assets/svg/tap-to-speak.svg'
import micUnmuted from '@/assets/svg/mic-unmuted.svg'
import Lottie from 'lottie-react'
import userWaveAnimation from '@/assets/json/user_wave.json'
import { liveKitService } from '@/lib/livekit'
import { useDispatch, useSelector } from 'react-redux'
import {
  setIsQuestionMode,
  setQuestion,
  setAnswerPptIndex,
  setShowChat,
  setSlideNumbers,
  setProductRecommendations,
  setIsUserMuted,
} from '@/store/features/videoSlice'
import { clearOverlayImage } from '@/store/features/imageSlice'
import { useTranslation } from "react-i18next";

const QuestionModeUser = ({
  onPauseVideo,
  onStartConversation,
  onStopConversation,
  onPauseAnswerAudio,
  isAudioPlaying,
  isAudioLoading,
  isConnected,
  setIsJumpedOnChatFromInteractionMode,
  isMobile = false,
  liveKitAgentEnabled = false,
  liveKitAgentState = "connecting",
}) => {
  const dispatch = useDispatch();
  const { question, isUserMuted: isMuted } = useSelector((state) => state.video);
  const { t } = useTranslation();
  // No need for manual speech recognition as ElevenLabs handles it

  // Sync state if disconnected externally
  useEffect(() => {
    if (!isConnected) {
      dispatch(setIsUserMuted(true));
    }
  }, [isConnected, dispatch]);

  const handleTapToSpeak = async () => {
    if (isConnected) {
      // If already connected, just unmute
      if (isMuted) {
        try {
          await liveKitService.enableMicrophone();
          dispatch(setIsUserMuted(false));
        } catch (error) {
          console.log("Failed to unmute:", error);
        }
      }
    } else {
      // Start conversation
      if (onPauseVideo) {
        onPauseVideo();
      }

      // Stop any playing answer audio when starting new conversation
      if (onPauseAnswerAudio) {
        onPauseAnswerAudio();
      }

      dispatch(setQuestion(""));

      if (onStartConversation) {
        onStartConversation();
      }
      // Optimistically assume connection will enable mic
      dispatch(setIsUserMuted(false));
    }
  };

  const handleMute = async () => {
    if (isConnected && !isMuted) {
      try {
        await liveKitService.disableMicrophone();
        dispatch(setIsUserMuted(true));
      } catch (error) {
        console.log("Failed to mute:", error);
      }
    } else if (!isConnected) {
      dispatch(setIsUserMuted(true));
    }
  };

  const handleBackToSession = () => {
    // Stop conversation if active
    // if (isConnected && onStopConversation) {
    //   onStopConversation();
    // }
    onStopConversation();
    // Clear state
    dispatch(setQuestion(''))
    dispatch(setIsQuestionMode(false))
    dispatch(setSlideNumbers([]))
    // Clear overlay image state (query based slide image)
    dispatch(clearOverlayImage());
    dispatch(setProductRecommendations([]));
  };

  const handleChatHistory = () => {
    onPauseVideo() // Pause the video when opening chat
    dispatch(setShowChat(true))
    dispatch(setIsQuestionMode(false))
    dispatch(setSlideNumbers([]))
    setIsJumpedOnChatFromInteractionMode(true)
    if (isConnected && onStopConversation) {
      onStopConversation();
    }
  };

  return (
    <div className="flex-1 border border-border-light rounded-[10px] p-2 md:p-3 pb-3 md:pb-6 flex flex-col min-h-0">
      {/* Main Content Frame */}
      <div className="flex-1 bg-bg-neutral rounded-xl flex items-center justify-center p-3 md:p-6 min-h-0 overflow-hidden">
        {/* Center Content */}
        <div className="flex flex-col items-center justify-center w-full h-full">
          {/* Avatar/Tap to Speak */}
            {!isMuted ? (
              <div className="flex flex-col items-center gap-2 sm:gap-4">
                <Lottie animationData={userWaveAnimation} style={{ width: 120, height: 120 }} loop={true} />
                <button
                  onClick={handleMute}
                  className="w-[48px] h-[48px] sm:w-[56px] sm:h-[56px] flex items-center justify-center cursor-pointer hover:scale-105 transition-transform">
                  <Image src={micUnmuted} alt="Mute Microphone" width={56} height={56} className="w-full h-full object-contain" />
                </button>
              </div>
            ) : (
              <button onClick={handleTapToSpeak} className="cursor-pointer hover:scale-105 transition-transform">
                <Image src={tap_to_speak} alt="tap to speak" width={72} height={72} />
              </button>
            )}
        </div>
      </div>

      {/* Bottom Input Section */}
      <div className="mt-3 md:mt-6 flex items-center justify-center px-0 md:px-3 gap-2 md:gap-4 mx-auto shrink-0">
        <button
          onClick={handleChatHistory}
          disabled={liveKitAgentEnabled && liveKitAgentState === "connecting"}
          className={`flex items-center gap-1 px-3 py-[7px] rounded-[73.75px] ${
            liveKitAgentEnabled && liveKitAgentState === "connecting"
              ? "bg-gray-200 cursor-not-allowed opacity-50"
              : "bg-bg-accent-subtle cursor-pointer"
          }`}>
          <Image className="w-4 h-4 lg:w-5 lg:h-5" src={chat_history} alt="chat_history" />
        </button>

        <button
          onClick={handleBackToSession}
          disabled={liveKitAgentEnabled && liveKitAgentState === "connecting"}
          className={`flex items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-[73.75px] ${
            liveKitAgentEnabled && liveKitAgentState === "connecting"
              ? "bg-gray-400 cursor-not-allowed opacity-50"
              : "bg-accent-secondary cursor-pointer"
          }`}>
          <Image className="w-4 h-4 lg:w-5 lg:h-5" src={back_to_session} alt="back_to_session" />
          <span className="font-lato font-medium text-[8px] lg:text-xs text-white whitespace-nowrap">
            {t("lectures.continueLesson")}
          </span>
        </button>
      </div>
    </div>
  );
};

export default QuestionModeUser;
