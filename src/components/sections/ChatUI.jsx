import React, { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import {
  setIsQuestionMode,
  setProductRecommendations,
  setShowChat,
  setSlideNumbers,
} from "@/store/features/videoSlice";
import back_to_session from "@/assets/svg/back_to_session.svg";
import interaction_mode from "@/assets/svg/interaction_mode.svg";
import ai_answer_icon from "@/assets/svg/ai_answer_icon.svg";
import close_icon from "@/assets/svg/close.svg";
import Image from "next/image";
import MicrophonePermissionPopup from "@/components/ui/MicrophonePermissionPopup";
import { clearOverlayImage } from "@/store/features/imageSlice";
import { useGetConversationHistoryQuery } from "@/store/api/questionsApi";

const ChatUI = ({
  onClose,
  conversation = [],
  onStartConversation,
  onStopConversation,
  isConnected,
  setIsJumpedOnChatFromInteractionMode,
  isMobile = false,
  agentId,
  onPauseSlideVideo,
  liveKitAgentEnabled = false,
  presentationId,
}) => {
  const dispatch = useDispatch();
  const [showMicPopup, setShowMicPopup] = useState(false);
  const messagesContainerRef = useRef(null);

  // Fetch conversation history when liveKitAgentEnabled is true
  const { data: apiConversation = [], isLoading: isLoadingHistory } = useGetConversationHistoryQuery(presentationId, {
    skip: !liveKitAgentEnabled || !presentationId,
    refetchOnMountOrArgChange: true,
  });

  // Format time with AM/PM
  const formatTime = (time) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    const hour12 = hours % 12 || 12;
    const ampm = hours >= 12 ? "PM" : "AM";
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Group messages by date for liveKitAgentEnabled
  const groupMessagesByDate = (messages) => {
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

    const grouped = {};
    messages.forEach((msg) => {
      const date = msg.date;
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(msg);
    });

    return Object.entries(grouped).map(([date, msgs]) => ({
      date,
      label:
        date === today
          ? "Today"
          : date === yesterday
            ? "Yesterday"
            : new Date(date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }),
      messages: msgs,
    }));
  };

  // Use API conversation if liveKitAgentEnabled, otherwise use passed conversation
  const displayConversation = liveKitAgentEnabled ? apiConversation : conversation;
  const groupedConversation = liveKitAgentEnabled ? groupMessagesByDate(apiConversation) : null;

  // Position at bottom on mount without visible scrolling
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [displayConversation]);

  const handleInteractionMode = async () => {
    if (!agentId) return;
    onPauseSlideVideo();

    try {
      // Check microphone permission first
      const permission = await navigator.permissions.query({ name: "microphone" });

      if (permission.state === "granted") {
        // Permission already granted, proceed
        dispatch(setIsQuestionMode(true));
        onClose();
        onStartConversation();
      } else {
        // Show permission popup
        setShowMicPopup(true);
      }
    } catch (error) {
      // Fallback for browsers that don't support permissions API
      setShowMicPopup(true);
    }
  };

  const handleAllowMicrophone = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setShowMicPopup(false);
      dispatch(setIsQuestionMode(true));
      onClose();
      onStartConversation();
    } catch (error) {
      console.log("Microphone permission denied:", error);
      setShowMicPopup(false);
    }
  };

  const handleContinueLesson = () => {
    dispatch(setIsQuestionMode(false));
    dispatch(setSlideNumbers([]));
    dispatch(setShowChat(false));
    setIsJumpedOnChatFromInteractionMode(false);
    if (isConnected && onStopConversation) {
      onStopConversation();
    }
    // Clear overlay image state (query based slide image)
    dispatch(clearOverlayImage());
    dispatch(setProductRecommendations([]));
  };

  return (
    <>
      {showMicPopup && (
        <MicrophonePermissionPopup onCancel={() => setShowMicPopup(false)} onAllowMicrophone={handleAllowMicrophone} />
      )}
      <div className="flex flex-col w-full bg-white h-full max-h-full overflow-hidden">
        {/* Chat Container */}
        <div className="flex flex-col h-full border border-border-light rounded-xl overflow-hidden">
          {/* Header */}
          <div className="flex justify-between items-center px-3 py-1 lg:py-3 pb-1 md:pb-2 border-b border-border-light flex-shrink-0">
            <h2 className="font-lato font-bold text-[12px] lg:text-base leading-[19px] tracking-[0.02em] text-primary-text">
              Interaction History
            </h2>
            <button onClick={onClose} className="w-6 h-6 flex items-center justify-center cursor-pointer">
              <Image src={close_icon} alt="Close Icon" />
            </button>
          </div>

          {/* Messages Container */}
          <div ref={messagesContainerRef} className="flex-1 px-3 py-4 overflow-y-auto overflow-x-hidden min-h-0">
            {isLoadingHistory ? (
              <div className="space-y-3 sm:space-y-4 lg:space-y-6">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className={index % 2 === 0 ? "flex justify-end" : "flex gap-2 items-start"}>
                    {index % 2 === 0 ? (
                      <div className="max-w-[75%] bg-gray-200 rounded-[10px_10px_10px_0px] px-2.5 py-2 animate-pulse">
                        <div className="h-3 bg-gray-300 rounded w-24 lg:w-32"></div>
                      </div>
                    ) : (
                      <>
                        <div className="w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-gray-300 animate-pulse flex-shrink-0"></div>
                        <div className="flex-1 min-w-0">
                          <div className="h-3 bg-gray-300 rounded w-32 lg:w-48 animate-pulse"></div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : displayConversation.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <p className="font-lato font-normal text-xs lg:text-sm">
                  No conversation history yet. Start asking questions!
                </p>
              </div>
            ) : liveKitAgentEnabled && groupedConversation ? (
              <div className="space-y-4">
                {groupedConversation.map((group, groupIndex) => (
                  <div key={group.date}>
                    {/* Date Separator */}
                    <div className="flex items-center my-4">
                      <div className="flex-1 h-px bg-gray-300"></div>
                      <span className="px-3 text-xs font-medium text-gray-500 bg-white">{group.label}</span>
                      <div className="flex-1 h-px bg-gray-300"></div>
                    </div>

                    {/* Messages for this date */}
                    <div className="space-y-3 sm:space-y-4 lg:space-y-6">
                      {group.messages.map((item, index) => (
                        <div key={index}>
                          {item.type === "question" ? (
                            /* User Message */
                            <div className="flex justify-end">
                              <div className="max-w-[75%]">
                                <div className="bg-bg-chat-bubble rounded-[10px_10px_10px_0px] px-2.5 py-2">
                                  <p className="font-lato font-normal text-[8px] lg:text-[13px] leading-3 sm:leading-4 text-left text-primary-text break-words">
                                    {item.content}
                                  </p>
                                </div>
                                {item.time && (
                                  <p className="text-xs text-gray-500 mt-1 text-right">{formatTime(item.time)}</p>
                                )}
                              </div>
                            </div>
                          ) : item.type === "answer" ? (
                            /* AI Message */
                            <div className="flex gap-2 items-start">
                              <div className="w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-gradient-to-b from-gradient-start to-gradient-end flex items-center justify-center flex-shrink-0">
                                <Image src={ai_answer_icon} alt="AI Answer Icon" />
                              </div>
                              <div className="flex flex-col gap-1 lg:gap-1.5 flex-1 min-w-0">
                                {/* Image Row */}
                                {(item.metadata?.product_recommendations || []).length > 0 && (
                                  <div className="flex flex-row gap-2 lg:gap-3 w-full overflow-x-auto pb-1 scrollbar-hide">
                                    {(item.metadata?.product_recommendations || []).slice(0, 5).map((rec, idx) => (
                                      <div key={idx} className="flex flex-col items-center gap-1 flex-shrink-0">
                                        <a
                                          href={rec.product_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="w-10 h-8 lg:w-[58px] lg:h-[48px] bg-[#E2E5EE] rounded-[6px] flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-90 transition-opacity">
                                          {Array.isArray(rec.product_image_url) ? (
                                            <div className="w-full h-full flex gap-[2px] p-[2px]">
                                              {rec.product_image_url.slice(0, 2).map((url, i) => (
                                                <div
                                                  key={i}
                                                  className="relative flex-1 h-full overflow-hidden bg-white rounded-[2px]">
                                                  <Image
                                                    src={url}
                                                    alt="Product"
                                                    fill
                                                    className="object-contain p-[1px]"
                                                  />
                                                </div>
                                              ))}
                                            </div>
                                          ) : (
                                            <div className="relative w-full h-full">
                                              <Image
                                                src={rec.product_image_url}
                                                alt="Product"
                                                fill
                                                className="object-contain"
                                              />
                                            </div>
                                          )}
                                        </a>
                                        {rec.area && (
                                          <span className="font-lato font-medium text-[6px] lg:text-[10px] leading-tight text-primary-text-muted text-center max-w-[58px] truncate">
                                            {rec.area}
                                          </span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                                <p className="font-lato font-normal text-[8px] lg:text-[13px] leading-4 sm:leading-5 lg:leading-[18px] text-primary-text break-words">
                                  {item.content || "No text answer found"}
                                </p>
                                {item.time && <p className="text-[10px] text-gray-500 mt-1">{formatTime(item.time)}</p>}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4 lg:space-y-6">
                {displayConversation.map((item, index) => (
                  <div key={index}>
                    {item.type === "question" ? (
                      /* User Message */
                      <div className="flex justify-end">
                        <div className="max-w-[75%] bg-bg-chat-bubble rounded-[10px_10px_10px_0px] px-2.5 py-2">
                          <p className="font-lato font-normal text-[8px] lg:text-[13px] leading-3 sm:leading-4 text-left text-primary-text break-words">
                            {item.content}
                          </p>
                        </div>
                      </div>
                    ) : item.type === "answer" ? (
                      /* AI Message */
                      <div className="flex gap-2 items-start">
                        <div className="w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-gradient-to-b from-gradient-start to-gradient-end flex items-center justify-center flex-shrink-0">
                          <Image src={ai_answer_icon} alt="AI Answer Icon" />
                        </div>
                        <div className="flex flex-col gap-1 lg:gap-1.5 flex-1 min-w-0">
                          {/* Image Row */}
                          {(item.metadata?.product_recommendations || []).length > 0 && (
                            <div className="flex flex-row gap-2 lg:gap-3 w-full overflow-x-auto pb-1 scrollbar-hide">
                              {(item.metadata?.product_recommendations || []).slice(0, 5).map((rec, idx) => (
                                <div key={idx} className="flex flex-col items-center gap-1 flex-shrink-0">
                                  <a
                                    href={rec.product_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-10 h-8 lg:w-[58px] lg:h-[48px] bg-[#E2E5EE] rounded-[6px] flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-90 transition-opacity">
                                    {Array.isArray(rec.product_image_url) ? (
                                      <div className="w-full h-full flex gap-[2px] p-[2px]">
                                        {rec.product_image_url.slice(0, 2).map((url, i) => (
                                          <div
                                            key={i}
                                            className="relative flex-1 h-full overflow-hidden bg-white rounded-[2px]">
                                            <Image
                                              src={url}
                                              alt="Product"
                                              fill
                                              className="object-contain p-[1px]"
                                            />
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="relative w-full h-full">
                                        <Image
                                          src={rec.product_image_url}
                                          alt="Product"
                                          fill
                                          className="object-contain"
                                        />
                                      </div>
                                    )}
                                  </a>
                                  {rec.area && (
                                    <span className="font-lato font-medium text-[6px] lg:text-[10px] leading-tight text-primary-text-muted text-center max-w-[58px] truncate">
                                      {rec.area}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          <p className="font-lato font-normal text-[8px] lg:text-[13px] leading-4 sm:leading-5 lg:leading-[18px] text-primary-text break-words">
                            {item.content || "No text answer found"}
                          </p>
                        </div>
                      </div>
                    ) : item.type === "error" ? (
                      /* Error Message */
                      <div className="flex gap-2 items-start">
                        <div className="w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs">!</span>
                        </div>
                        <div className="flex-1 min-w-0">
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
          <div className="flex justify-center items-center gap-1 sm:gap-2 w-full bg-white px-2 sm:px-3 py-1.5 lg:py-2 flex-shrink-0 border-t border-border-light">
            {/* Interaction Mode Button */}
            <button
              onClick={agentId ? handleInteractionMode : undefined}
              disabled={!agentId}
              className={`flex items-center justify-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-[74px] ${
                agentId ? "bg-bg-accent-subtle cursor-pointer" : "bg-gray-100 cursor-not-allowed opacity-50"
              }`}>
              <Image className="w-4 h-4 lg:w-5 lg:h-5" src={interaction_mode} alt="interaction_mode" />

              {!isMobile && (
                <span className="font-lato font-medium text-[8px] sm:text-[9px] lg:text-[10px] leading-3 text-center text-accent-secondary whitespace-nowrap">
                  Interaction Mode
                </span>
              )}
            </button>

            {/* Continue Lesson Button */}
            <button
              onClick={handleContinueLesson}
              className="cursor-pointer flex items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-1 sm:py-1.5 bg-accent-secondary rounded-[73.75px]">
              <Image className="w-4 h-4 lg:w-5 lg:h-5" src={back_to_session} alt="back_to_session" />
              <span className="font-lato font-medium text-[8px] lg:text-xs text-white whitespace-nowrap">
                Continue Lesson
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatUI;
