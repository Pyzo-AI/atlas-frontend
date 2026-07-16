import React, { useState, useRef, useEffect } from "react";
import { useDispatch } from "react-redux";
import { setIsQuestionMode, setShowChat } from "../../store/features/videoSlice";
import message from "../../assets/svg/message.svg";
import chat_star from "../../assets/svg/chat_star.svg";
import microphone from "../../assets/svg/microphone.svg";
import Image from "next/image";
import MicrophonePermissionPopup from "@/components/ui/MicrophonePermissionPopup";
import { useTranslation } from "react-i18next";

// Height thresholds (px) for progressive content hiding
const ICON_HIDE_THRESHOLD = 180;
const SCROLL_THRESHOLD = 120;

const AILearningAssistant = ({
  onStartConversation = () => {},
  onStopConversation = () => {},
  onPauseVideo = () => {},
  onPauseSlideVideo = () => {},
  isMobileView = false,
  agentId,
}) => {
  const dispatch = useDispatch();
  const [showMicPopup, setShowMicPopup] = useState(false);
  const [cardHeight, setCardHeight] = useState(null);
  const innerRef = useRef(null);
  const { t } = useTranslation();

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setCardHeight(entry.contentRect.height);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const showIcon = cardHeight === null || cardHeight >= ICON_HIDE_THRESHOLD;
  const isScrollable = cardHeight !== null && cardHeight < SCROLL_THRESHOLD;

  const handleStartQA = async () => {
    if (!agentId) return;

    onPauseSlideVideo();

    try {
      const permission = await navigator.permissions.query({ name: "microphone" });

      if (permission.state === "granted") {
        dispatch(setIsQuestionMode(true));
        onStartConversation();
      } else {
        setShowMicPopup(true);
      }
    } catch (error) {
      setShowMicPopup(true);
    }
  };

  const handleAllowMicrophone = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setShowMicPopup(false);
      dispatch(setIsQuestionMode(true));
      onStartConversation();
    } catch (error) {
      setShowMicPopup(false);
    }
  };

  const handleMessageClick = () => {
    onPauseVideo();
    dispatch(setShowChat(true));
    onStopConversation();
  };

  return (
    <>
      {showMicPopup && (
        <MicrophonePermissionPopup onCancel={() => setShowMicPopup(false)} onAllowMicrophone={handleAllowMicrophone} />
      )}
      <div className="flex flex-col items-start p-1 md:p-[6px] lg:p-3 gap-2.5 w-full h-full flex-1 border border-border-light rounded-xl bg-white overflow-hidden">
        {/* Inner Frame */}
        <div
          ref={innerRef}
          className={`w-full h-full bg-bg-light-blue rounded-xl ${
            isMobileView ? "p-1" : "p-3"
          } flex flex-col min-h-0 ${isScrollable ? "overflow-y-auto" : "overflow-hidden"} relative`}>
          {/* Chat Icon - Positioned absolutely */}
          <button
            onClick={handleMessageClick}
            className="absolute top-3 right-3 cursor-pointer w-[30px] h-[30px] bg-white rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors">
            <Image className="w-full h-full" src={message} alt="message" />
          </button>

          {/* Main Content Container */}
          <div
            className={`flex-1 flex flex-col items-center justify-center ${
              isMobileView ? "gap-2 px-2" : "gap-4 px-4"
            } min-h-0 ${isScrollable ? "" : "overflow-hidden"}`}>
            {/* Icon and Text Section */}
            <div className={`flex flex-col items-center ${isMobileView ? "gap-2" : "gap-3"} w-full max-w-[275px]`}>
              {showIcon && (
                <div className={`${isMobileView ? "w-[40px] h-[40px]" : "w-[56px] h-[56px]"} bg-white rounded-full flex items-center justify-center shrink-0`}>
                  <Image className="w-full h-full" src={chat_star} alt="chat_star" />
                </div>
              )}
              {/* Text Content */}
              <div className="flex flex-col items-center gap-2 w-full">
                <h3
                  className={`w-full text-center font-lato font-bold ${
                    isMobileView ? "text-[10px]" : "text-lg leading-5"
                  } text-primary-text`}>
                  {t("lectures.aiAssistant")}
                </h3>
                <p className={`w-full text-center font-lato font-normal ${isMobileView ? "text-[9px] leading-3" : "text-xs leading-4"} text-primary-text`}>
                  {t("lectures.aiAssistantDesc")}
                </p>
              </div>
            </div>

            {/* Start Q&A Button */}
            <div className="relative group shrink-0">
              <button
                onClick={handleStartQA}
                disabled={!agentId}
                className={`flex items-center justify-center gap-1 ${
                  isMobileView ? "px-2 py-2 h-6" : "px-3 py-2 h-9"
                } rounded-full font-lato font-semibold text-sm leading-4 transition-all duration-200 ${
                  agentId
                    ? "text-white cursor-pointer hover:opacity-90"
                    : "text-gray-400 cursor-not-allowed bg-gray-200"
                }`}
                style={agentId ? { background: "var(--gradient-primary)" } : {}}
                title={!agentId ? "Agent not available" : ""}>
                <Image
                  className="w-5 h-5"
                  src={microphone}
                  alt="Microphone"
                  style={!agentId ? { filter: "grayscale(100%)" } : {}}
                />
                <span className={`text-[8px] sm:text-[9px] md:text-xs`}>{t("lectures.interactionMode")}</span>
              </button>
              {!agentId && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-700 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  {t("lectures.interactionModeNotAvailable")}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-0 border-t-4 border-t-gray-700 border-l-transparent border-r-transparent"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AILearningAssistant;
