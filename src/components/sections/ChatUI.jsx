import React from 'react'
import { useDispatch } from 'react-redux'
import { setIsQuestionMode } from '@/store/features/videoSlice'
import back_to_session from '@/assets/svg/back_to_session.svg'
import interaction_mode from '@/assets/svg/interaction_mode.svg'
import ai_answer_icon from '@/assets/svg/ai_answer_icon.svg'
import close_icon from '@/assets/svg/close.svg'
import Image from 'next/image'

const ChatUI = ({
  onClose,
  conversation = [],
  onStartConversation,
  onStopConversation,
  isConnected,
  setShowChat,
  setIsJumpedOnChatFromInteractionMode,
  isMobile = false,
}) => {
  const dispatch = useDispatch()

  const handleInteractionMode = () => {
    dispatch(setIsQuestionMode(true))
    onClose()
    onStartConversation()
  }

  const handleContinueLesson = () => {
    dispatch(setIsQuestionMode(false))
    setShowChat(false)
    setIsJumpedOnChatFromInteractionMode(false)
    if (isConnected && onStopConversation) {
      onStopConversation()
    }
  }

  return (
    <div className="flex flex-col w-full bg-white h-full max-h-full">
      {/* Chat Container */}
      <div className="flex flex-col h-full border border-[#E5E7EB] rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center px-3 py-1 lg:py-3 pb-2 border-b border-[#E5E7EB] flex-shrink-0">
          <h2 className="font-lato font-bold text-[12px] lg:text-base leading-[19px] tracking-[0.02em] text-[#1A1C29]">
            Interaction History
          </h2>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center cursor-pointer"
          >
            <Image src={close_icon} alt="Close Icon" />
          </button>
        </div>

        {/* Messages Container */}
        <div className="flex-1 px-3 py-4 overflow-y-auto min-h-0">
          {conversation.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p className="font-lato font-normal text-xs lg:text-sm">
                No conversation history yet. Start asking questions!
              </p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4 lg:space-y-6">
              {conversation.map((item, index) => (
                <div key={index}>
                  {item.type === 'question' ? (
                    /* User Message */
                    <div className="flex justify-end">
                      <div className="max-w-[75%] bg-[rgba(26,26,26,0.07)] rounded-[10px_10px_10px_0px] px-2.5 py-2">
                        <p className="font-lato font-normal text-[8px] lg:text-[13px] leading-3 sm:leading-4 text-left text-[#1A1C29]">
                          {item.content}
                        </p>
                      </div>
                    </div>
                  ) : item.type === 'answer' ? (
                    /* AI Message */
                    <div className="flex gap-2 items-start">
                      <div className="w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-gradient-to-b from-[#685EDD] to-[#DA8BFF] flex items-center justify-center flex-shrink-0">
                        <Image src={ai_answer_icon} alt="AI Answer Icon" />
                      </div>
                      <div className="flex-1 max-w-[301px]">
                        <p className="font-lato font-normal text-[8px] lg:text-[13px] leading-4 sm:leading-5 lg:leading-[18px] text-[#1A1C29]">
                          {item.content || 'No text answer found'}
                        </p>
                      </div>
                    </div>
                  ) : item.type === 'error' ? (
                    /* Error Message */
                    <div className="flex gap-2 items-start">
                      <div className="w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs">!</span>
                      </div>
                      <div className="flex-1 max-w-[301px]">
                        <p className="font-lato font-normal text-[10px] lg:text-[13px] leading-4 sm:leading-5 lg:leading-[18px] text-red-600">
                          {item.content}
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Actions Container */}
        <div className="flex justify-center items-center gap-1 sm:gap-2 w-full bg-white rounded-[62px] px-2 sm:px-3 py-1.5 lg:py-2 flex-shrink-0 border-t border-[#E5E7EB]">
          {/* Interaction Mode Button */}
          <button
            onClick={handleInteractionMode}
            className="flex items-center justify-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-1 sm:py-1.5 bg-[rgba(110,96,223,0.1)] rounded-[74px] cursor-pointer"
          >
            <Image
              className="w-4 h-4 lg:w-5 lg:h-5"
              src={interaction_mode}
              alt="interaction_mode"
            />

            {!isMobile && (
              <span className="font-lato font-medium text-[8px] sm:text-[9px] lg:text-xs leading-4 text-center text-[#6E60DF] whitespace-nowrap">
                Interaction Mode
              </span>
            )}
          </button>

          {/* Continue Lesson Button */}
          <button
            onClick={handleContinueLesson}
            className="cursor-pointer flex items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-1 sm:py-1.5 bg-[#6E60DF] rounded-[73.75px]"
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
    </div>
  )
}

export default ChatUI
