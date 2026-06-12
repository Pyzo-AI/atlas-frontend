import React, { useEffect } from 'react'
import chat_history from '@/assets/svg/chat_history.svg'
import back_to_session from '@/assets/svg/back_to_session.svg'
import mute from '@/assets/svg/mute.svg'
import unmute from '@/assets/svg/unmute.svg'
import Image from 'next/image'
import tap_to_speak from '@/assets/svg/tap-to-speak.svg'
import Lottie from 'lottie-react'
import userWaveAnimation from '@/assets/json/user_wave.json'
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
import { useTranslation } from "react-i18next"
import { liveKitService } from '@/lib/livekit'

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
  const { question, isUserMuted } = useSelector((state) => state.video);
  const { t } = useTranslation();

  const isConnecting = liveKitAgentEnabled && liveKitAgentState === "connecting";

  const handleTapToSpeak = () => {
    if (isConnected) {
      if (onStopConversation) {
        onStopConversation();
      }
    } else {
      if (onPauseVideo) {
        onPauseVideo();
      }
      if (onPauseAnswerAudio) {
        onPauseAnswerAudio();
      }
      dispatch(setQuestion(""));
      // Reset mute state on new conversation
      dispatch(setIsUserMuted(false));
      if (onStartConversation) {
        onStartConversation();
      }
    }
  };

  const handleToggleMute = async () => {
    if (!liveKitAgentEnabled) return;
    try {
      if (isUserMuted) {
        await liveKitService.enableMicrophone();
        dispatch(setIsUserMuted(false));
      } else {
        await liveKitService.disableMicrophone();
        dispatch(setIsUserMuted(true));
      }
    } catch (error) {
      console.log("Failed to toggle microphone:", error);
    }
  };

  const handleBackToSession = () => {
    onStopConversation();
    dispatch(setQuestion(''))
    dispatch(setIsQuestionMode(false))
    dispatch(setSlideNumbers([]))
    dispatch(clearOverlayImage());
    dispatch(setProductRecommendations([]));
    // Reset mute when leaving interaction mode
    dispatch(setIsUserMuted(false));
  };

  const handleChatHistory = () => {
    onPauseVideo()
    dispatch(setShowChat(true))
    dispatch(setIsQuestionMode(false))
    dispatch(setSlideNumbers([]))
    setIsJumpedOnChatFromInteractionMode(true)
    if (isConnected && onStopConversation) {
      onStopConversation();
    }
    dispatch(setIsUserMuted(false));
  };

  useEffect(() => {
    return () => {
      // Reset mute state when unmounting / exiting interaction mode
      dispatch(setIsUserMuted(false));
    };
  }, [dispatch]);

  return (
    <div className={`flex-1 border border-border-light rounded-[10px] p-3 ${isMobile ? 'pb-2' : 'pb-6'} flex flex-col`}>
      {/* Main Content Frame */}
      <div className="flex-1 bg-bg-neutral rounded-xl flex items-center justify-center p-1">
        {/* Center Content */}
        <div className="flex flex-col items-center justify-center w-full h-full gap-3">
          {isUserMuted ? (
            /* Muted state - show mute indicator */
            <div className="flex flex-col items-center gap-1 text-center justify-center">
              <p className="font-lato font-semibold text-sm text-primary-text">
                {t("lectures.microphoneMuted")}
              </p>
              <p className="font-lato font-normal text-xs text-gray-400">
                {t("lectures.unmuteAndSpeak")}
              </p>
            </div>
          ) : (
            /* Active/listening state */
            <div className="flex items-center justify-center min-h-0">
              {isAudioLoading ? (
                <Lottie
                  animationData={userWaveAnimation}
                  loop={true}
                  style={{ width: "clamp(48px, 12vh, 120px)", height: "clamp(48px, 12vh, 120px)" }}
                />
              ) : (
                <Image
                  src={tap_to_speak}
                  alt="tap to speak"
                  width={72}
                  height={72}
                  style={{ width: "clamp(40px, 10vh, 72px)", height: "auto" }}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Input Section */}
      <div className={`${isMobile ? 'mt-2' : 'mt-6'} flex items-center justify-center px-0 md:px-3 gap-2 md:gap-4 mx-auto`}>
        {/* Chat History Button */}
        <button
          onClick={handleChatHistory}
          disabled={isConnecting}
          className={`flex items-center gap-1 px-3 py-[7px] rounded-[73.75px] ${
            isConnecting
              ? "bg-gray-200 cursor-not-allowed opacity-50"
              : "bg-bg-accent-subtle cursor-pointer"
          }`}>
          <Image className="w-4 h-4 lg:w-5 lg:h-5" src={chat_history} alt="chat_history" />
        </button>

        {/* Mute/Unmute Button */}
        {liveKitAgentEnabled && (
          <button
            onClick={handleToggleMute}
            disabled={isConnecting}
            className={`flex items-center ${isConnecting ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}>
            <Image
              className="w-9 h-9 lg:w-10 lg:h-10"
              src={isUserMuted ? mute : unmute}
              alt={isUserMuted ? "Mute" : "Unmute"}
            />
          </button>
        )}

        {/* Continue Lesson Button */}
        <button
          onClick={handleBackToSession}
          disabled={isConnecting}
          className={`flex items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-[73.75px] ${
            isConnecting
              ? "bg-gray-400 cursor-not-allowed opacity-50"
              : "bg-accent-secondary cursor-pointer"
          }`}>
          <Image className="w-4 h-4 lg:w-5 lg:h-5" src={back_to_session} alt="back_to_session" />
          {/* <span className="font-lato font-medium text-[8px] lg:text-xs text-white whitespace-nowrap">
            {t("lectures.continueLesson")}
          </span> */}
        </button>
      </div>
    </div>
  );
};

export default QuestionModeUser;
