import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setIsQuestionMode } from "../../store/features/videoSlice";
import message from "../../assets/svg/message.svg";
import chat_star from "../../assets/svg/chat_star.svg";
import microphone from "../../assets/svg/microphone.svg";
import Image from "next/image";

const AILearningAssistant = ({
  showChat,
  setShowChat = () => {},
  onStartConversation = () => {},
  onStopConversation = () => {},
  isMobileView = false,
}) => {
  const { isQuestionMode } = useSelector((state) => state.video);
  const dispatch = useDispatch();

  const handleStartQA = () => {
    dispatch(setIsQuestionMode(true));
    onStartConversation();
  };

  const handleMessageClick = () => {
    setShowChat(true);
    onStopConversation();
  };

  return (
    <div className="flex flex-col items-start p-1 md:p-[6px] lg:p-3 gap-2.5 w-full h-full flex-1 border border-[#E5E7EB] rounded-xl bg-white overflow-hidden">
      {/* Inner Frame */}
      <div className={`w-full h-full bg-[#E0DDFF] rounded-xl ${isMobileView ? 'p-1' : 'p-3'} flex flex-col min-h-0 overflow-hidden relative`}>
        {/* Chat Icon - Positioned absolutely */}
        <button
          onClick={handleMessageClick}
          className="absolute top-3 right-3 cursor-pointer w-[30px] h-[30px] bg-white rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors"
        >
          <Image className="w-full h-full" src={message} alt="message" />
        </button>

        {/* Main Content Container - Centered vertically in remaining space */}
        <div className={`flex-1 flex flex-col items-center justify-center ${isMobileView ? 'gap-2 px-2': 'gap-6 px-4 '}  min-h-0 overflow-hidden`}>
          {/* Icon and Text Section */}
          <div className={`flex flex-col items-center ${isMobileView ? 'gap-2': 'gap-4'} w-full max-w-[275px]`}>
            {/* Icon Container */}
        {!isMobileView ?    <div className="w-[72px] h-[72px] bg-white rounded-full flex items-center justify-center">
              <Image
                className="w-full h-full"
                src={chat_star}
                alt="chat_star"
              />
            </div> :  <div className="w-[40px] h-[40px] bg-white rounded-full flex items-center justify-center">
              <Image
                className="w-full h-full"
                src={chat_star}
                alt="chat_star"
              />
            </div>
}
            {/* Text Content */}
         <div className="flex flex-col items-center gap-2 w-full">
              <h3 className={`w-full text-center font-lato font-bold ${isMobileView ? 'text-[10px]' :'text-lg leading-5'}  text-[#1A1C29]`}>
                AI Learning Assistant
              </h3>
              {!isMobileView &&    <p className="w-full text-center font-lato font-normal text-xs leading-4 text-[#1A1C29]">
                Get instant answers to your questions and personalized learning
                support.
              </p>}
            </div>
          </div>

          {/* Start Q&A Button */}
          <button
            onClick={handleStartQA}
            className={`cursor-pointer flex items-center justify-center gap-1 ${isMobileView ? 'px-2 py-2 h-6' :'px-3 py-2 h-9'} rounded-full text-white font-lato font-semibold text-sm leading-4 transition-all duration-200 hover:opacity-90`}
            style={{
              background: "linear-gradient(180deg, #685EDD 0%, #DA8BFF 100%)",
            }}
          >
            <Image className="w-5 h-5" src={microphone} alt="Microphone" />
            <span className={`text-[8px] sm:text-[9px] md:text-xs`} >Interaction Mode</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AILearningAssistant;
