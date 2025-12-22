import React, { useState, useRef, useEffect } from 'react'
import chat_history from '@/assets/svg/chat_history.svg'
import back_to_session from '@/assets/svg/back_to_session.svg'
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
} from '@/store/features/videoSlice'
import { clearOverlayImage } from '@/store/features/imageSlice'

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
  const dispatch = useDispatch()
  const { question } = useSelector((state) => state.video)
  // No need for manual speech recognition as ElevenLabs handles it

  const handleTapToSpeak = () => {
    if (isConnected) {
      // Stop conversation if already connected
      if (onStopConversation) {
        onStopConversation()
      }
    } else {
      // Start conversation
      if (onPauseVideo) {
        onPauseVideo()
      }

      // Stop any playing answer audio when starting new conversation
      if (onPauseAnswerAudio) {
        onPauseAnswerAudio()
      }

      dispatch(setQuestion(''))

      if (onStartConversation) {
        onStartConversation()
      }
    }
  }

  const handleBackToSession = () => {
    // Stop conversation if active
    // if (isConnected && onStopConversation) {
    //   onStopConversation();
    // }
    onStopConversation()
    // Clear state
    dispatch(setQuestion(''))
    dispatch(setIsQuestionMode(false))
    dispatch(setSlideNumbers([]))
    // Clear overlay image state (query based slide image)
    dispatch(clearOverlayImage())
  }

  const handleChatHistory = () => {
    onPauseVideo() // Pause the video when opening chat
    dispatch(setShowChat(true))
    dispatch(setIsQuestionMode(false))
    dispatch(setSlideNumbers([]))
    setIsJumpedOnChatFromInteractionMode(true)
    if (isConnected && onStopConversation) {
      onStopConversation()
    }
  }

  return (
    <div className="flex-1 border border-[#E5E7EB] rounded-[10px] p-3 pb-6 flex flex-col">
      {/* Main Content Frame */}
      <div className="flex-1 bg-[#F7F7F7] rounded-xl flex items-center justify-center p-6">
        {/* Center Content */}
        <div className="flex flex-col items-center gap-[30px] max-w-[275px]">
          {/* Avatar/Tap to Speak */}
          <div
            className={`w-[120px] ${isMobile ? 'h-[20px]' : 'h-[120px]'
              } flex items-center justify-center`}
          >
            {isAudioLoading ? (
              <Lottie
                animationData={userWaveAnimation}
                style={{ width: 120, height: 120 }}
                loop={true}
              />
            ) : (
              <Image
                src={tap_to_speak}
                alt="tap to speak"
                width={72}
                height={72}
              />
            )}
          </div>
        </div>
      </div>

      {/* Bottom Input Section */}
      <div className="mt-6 flex items-center justify-center px-0 md:px-3 gap-2 md:gap-4 mx-auto">
        <button
          onClick={handleChatHistory}
          disabled={liveKitAgentEnabled && liveKitAgentState === "connecting"}
          className={`flex items-center gap-1 px-3 py-[7px] rounded-[73.75px] ${
            liveKitAgentEnabled && liveKitAgentState === "connecting"
              ? "bg-gray-200 cursor-not-allowed opacity-50"
              : "bg-[rgba(110,96,223,0.1)] cursor-pointer"
          }`}
        >
          <Image
            className="w-4 h-4 lg:w-5 lg:h-5"
            src={chat_history}
            alt="chat_history"
          />
        </button>

        <button
          onClick={handleBackToSession}
          disabled={liveKitAgentEnabled && liveKitAgentState === "connecting"}
          className={`flex items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-[73.75px] ${
            liveKitAgentEnabled && liveKitAgentState === "connecting"
              ? "bg-gray-400 cursor-not-allowed opacity-50"
              : "bg-[#6E60DF] cursor-pointer"
          }`}
        >
          <Image
            className="w-4 h-4 lg:w-5 lg:h-5"
            src={back_to_session}
            alt="back_to_session"
          />
          <span className="font-lato font-medium text-[8px] lg:text-xs text-white whitespace-nowrap">
            Continue Lesson
          </span>
        </button>
      </div>
    </div>
  )
}

export default QuestionModeUser
