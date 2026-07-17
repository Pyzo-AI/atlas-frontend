import React, { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import {
  setIsQuestionMode,
  setProductRecommendations,
  setShowChat,
  setSlideNumbers,
} from "@/store/features/videoSlice";
import back_to_session from "@/assets/svg/back_to_session_white.svg";
import interaction_mode from "@/assets/svg/interaction_mode_light_blue.svg";
import ai_answer_icon from "@/assets/svg/ai_answer_icon.svg";
import close_icon from "@/assets/svg/close.svg";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import MicrophonePermissionPopup from "@/components/ui/MicrophonePermissionPopup";
import { clearOverlayImage } from "@/store/features/imageSlice";
import { useLazyGetConversationHistoryQuery } from "@/store/api/questionsApi";
import { useLazyGetChatbotConversationsQuery } from "@/store/api/liveKitApi";

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
  useChatbotHistory = false,
  hideFooter = false,
  liveMessages = [],
  enableSmoothScroll = true,
}) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const [showMicPopup, setShowMicPopup] = useState(false);
  const messagesContainerRef = useRef(null);
  
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const prevMessageCountRef = useRef(0);

  const [allHistory, setAllHistory] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const prevScrollHeightRef = useRef(null);
  const isPaginatingRef = useRef(false);
  const isLoadingMoreRef = useRef(false);
  const loadMoreDebounceRef = useRef(null);

  const [fetchPresentationHistory] = useLazyGetConversationHistoryQuery();
  const [fetchChatbotHistory] = useLazyGetChatbotConversationsQuery();

  // Initial fetch on mount / when key props change
  useEffect(() => {
    if (!liveKitAgentEnabled) return;
    if (!useChatbotHistory && !presentationId) return;

    const fetchInitial = async () => {
      setIsLoadingInitial(true);
      setAllHistory([]);
      setCurrentPage(1);
      setHasMore(false);

      const result = useChatbotHistory
        ? await fetchChatbotHistory({ page: 1 })
        : await fetchPresentationHistory({ presentationId, page: 1 });

      if (result.data) {
        // API returns newest-first; reverse for chronological display
        setAllHistory([...result.data.results].reverse());
        setHasMore(result.data.has_more);
      }
      setIsLoadingInitial(false);
    };

    fetchInitial();
  }, [liveKitAgentEnabled, presentationId, useChatbotHistory]);

  // Load older messages (scroll-up pagination)
  const loadMoreHistory = async () => {
    if (!hasMore || isLoadingMoreRef.current) return;

    isLoadingMoreRef.current = true;
    prevScrollHeightRef.current = messagesContainerRef.current?.scrollHeight ?? null;
    isPaginatingRef.current = true;
    setIsLoadingMore(true);

    const nextPage = currentPage + 1;
    const result = useChatbotHistory
      ? await fetchChatbotHistory({ page: nextPage })
      : await fetchPresentationHistory({ presentationId, page: nextPage });

    if (result.data) {
      const older = [...result.data.results].reverse();
      setAllHistory((prev) => [...older, ...prev]);
      setHasMore(result.data.has_more);
      setCurrentPage(nextPage);
      // isLoadingMoreRef is reset in the scroll restoration effect after DOM paints
    } else {
      // No data / error — reset immediately since allHistory won't change
      isLoadingMoreRef.current = false;
      isPaginatingRef.current = false;
      prevScrollHeightRef.current = null;
    }
    setIsLoadingMore(false);
  };

  // Restore scroll position after older messages are prepended
  useEffect(() => {
    if (prevScrollHeightRef.current !== null) {
      const savedHeight = prevScrollHeightRef.current;
      prevScrollHeightRef.current = null;
      // rAF ensures DOM has painted new content before we read scrollHeight
      requestAnimationFrame(() => {
        const el = messagesContainerRef.current;
        if (el) {
          // Override scroll-smooth temporarily so restoration is instant (no animation
          // means no intermediate scrollTop values that could re-trigger loadMoreHistory)
          const prev = el.style.scrollBehavior;
          el.style.scrollBehavior = "auto";
          el.scrollTop = el.scrollHeight - savedHeight;
          el.style.scrollBehavior = prev;
        }
        // Reset only after restoration so handleScroll can't re-trigger mid-flight
        isLoadingMoreRef.current = false;
      });
    }
  }, [allHistory]);

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (loadMoreDebounceRef.current) clearTimeout(loadMoreDebounceRef.current);
    };
  }, []);

  // Merge API history with live messages from the current session
  const mergedConversation = [...allHistory, ...liveMessages];

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

  // Use merged conversation if liveKitAgentEnabled, otherwise use passed conversation
  const displayConversation = liveKitAgentEnabled ? mergedConversation : conversation;
  const groupedConversation = liveKitAgentEnabled ? groupMessagesByDate(mergedConversation) : null;

  // Scroll handling
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    // 50px threshold to be considered "at bottom"
    const isBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 50;
    setIsAtBottom(isBottom);
    if (isBottom) {
      setUnreadMessages(0);
    }
    // Load older messages when scrolled near the top (debounced to avoid spam)
    if (scrollTop < 300 && liveKitAgentEnabled) {
      if (loadMoreDebounceRef.current) clearTimeout(loadMoreDebounceRef.current);
      loadMoreDebounceRef.current = setTimeout(() => {
        loadMoreHistory();
      }, 200);
    }
  };

  // Scroll to bottom instantly when initial history finishes loading
  useEffect(() => {
    if (!isLoadingInitial && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [isLoadingInitial]);

  useEffect(() => {
    const currentCount = displayConversation.length;
    const newMessages = currentCount - prevMessageCountRef.current;
    prevMessageCountRef.current = currentCount;

    if (newMessages > 0) {
      if (isPaginatingRef.current) {
        // Older messages prepended — not new, don't show badge
        isPaginatingRef.current = false;
      } else if (isAtBottom) {
        // Auto scroll
        setTimeout(() => {
          if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
          }
        }, 100);
      } else {
        // Increment unread count for genuine new messages
        setUnreadMessages((prev) => prev + newMessages);
      }
    } else if (isAtBottom) {
       // Just general updates, ensure we stick to bottom
       setTimeout(() => {
         if (messagesContainerRef.current) {
           messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
         }
       }, 100);
    }
  }, [displayConversation, isAtBottom]);

  const handleInteractionMode = async () => {
    if (!agentId) return;
    onPauseSlideVideo();

    try {
      // Check microphone permission first
      const permission = await navigator.permissions.query({ name: "microphone" });

      if (permission.state === "granted") {
        // Close chat directly instead of calling onClose(), because onClose() routes
        // through handleCloseChatUI in VideoPanel which also calls startConversation()
        // when isJumpedOnChatFromInteractionMode=true — causing a double session creation.
        setIsJumpedOnChatFromInteractionMode(false);
        dispatch(setIsQuestionMode(true));
        dispatch(setShowChat(false));
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
      // Same reason as handleInteractionMode: bypass onClose() to avoid double session
      setIsJumpedOnChatFromInteractionMode(false);
      dispatch(setIsQuestionMode(true));
      dispatch(setShowChat(false));
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
      <div className="flex flex-col w-full bg-white h-full max-h-full overflow-hidden relative">
        {/* Chat Container */}
        <div className="flex flex-col h-full border border-border-light rounded-xl overflow-hidden relative">
          {/* Header */}
          <div className="flex justify-between items-center px-3 py-1 lg:py-3 pb-1 md:pb-2 border-b border-border-light flex-shrink-0">
            <h2 className="font-lato font-bold text-[12px] lg:text-base leading-[19px] tracking-[0.02em] text-primary-text">
              {t("chatUI.interactionHistory")}
            </h2>
            <button onClick={onClose} className="w-6 h-6 flex items-center justify-center cursor-pointer">
              <Image src={close_icon} alt="Close Icon" />
            </button>
          </div>

          {/* New Messages Badge */}
          {unreadMessages > 0 && !isAtBottom && (
            <button
              onClick={() => {
                if (messagesContainerRef.current) {
                  messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
                }
                setUnreadMessages(0);
                setIsAtBottom(true);
              }}
              className="absolute bottom-24 left-1/2 transform -translate-x-1/2 bg-primary text-white rounded-full px-4 py-2 text-xs font-bold shadow-lg flex items-center gap-2 z-50 hover:bg-primary-hover transition-all cursor-pointer">
              {unreadMessages} new {unreadMessages === 1 ? "message" : "messages"}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>
          )}

          {/* Messages Container */}
          <div ref={messagesContainerRef} onScroll={handleScroll} className={`flex-1 px-3 py-4 overflow-y-auto overflow-x-hidden min-h-0 overscroll-contain ${enableSmoothScroll ? "scroll-smooth" : ""}`}>
            {/* Older messages loading indicator */}
            {isLoadingMore && (
              <div className="flex justify-center py-2">
                <div className="w-5 h-5 border-2 border-gray-300 border-t-accent-secondary rounded-full animate-spin"></div>
              </div>
            )}
            {isLoadingInitial ? (
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
                                  <p className={`font-lato font-normal ${useChatbotHistory ? "text-[12px] leading-4" : "text-[8px] leading-3"} sm:leading-4 lg:text-[13px] text-left text-primary-text break-words`}>
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
                              <div className="w-6 h-6 lg:w-8 lg:h-8 rounded-full  flex items-center justify-center flex-shrink-0">
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
                                <p className={`font-lato font-normal ${useChatbotHistory ? "text-[12px] leading-4" : "text-[8px] leading-4"} sm:leading-5 lg:text-[13px] lg:leading-[18px] text-primary-text break-words`}>
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
                          <p className={`font-lato font-normal ${useChatbotHistory ? "text-[12px] leading-4" : "text-[8px] leading-3"} sm:leading-4 lg:text-[13px] text-left text-primary-text break-words`}>
                            {item.content}
                          </p>
                        </div>
                      </div>
                    ) : item.type === "answer" ? (
                      /* AI Message */
                      <div className="flex gap-2 items-start">
                        <div className="w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center flex-shrink-0">
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
                                    <span className={`font-lato font-medium ${useChatbotHistory ? "text-[8px]" : "text-[6px]"} lg:text-[10px] leading-tight text-primary-text-muted text-center max-w-[58px] truncate`}>
                                      {rec.area}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          <p className={`font-lato font-normal ${useChatbotHistory ? "text-[12px] leading-4" : "text-[8px] leading-4"} sm:leading-5 lg:text-[13px] lg:leading-[18px] text-primary-text break-words`}>
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
          {!hideFooter && (
            <div className="flex justify-center items-center gap-1.5 sm:gap-2 w-full bg-white px-2 sm:px-3 py-1.5 sm:py-2 flex-shrink-0 border-t border-border-light">
              {/* Interaction Mode Button */}
              <button
                onClick={agentId ? handleInteractionMode : undefined}
                disabled={!agentId}
                className={`flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-[8.53px] ${
                  agentId ? "bg-bg-light-blue cursor-pointer" : "bg-gray-100 cursor-not-allowed opacity-50"
                }`}>
                <Image className="w-3.5 h-3.5 sm:w-4 sm:h-4" src={interaction_mode} alt="interaction_mode" />

                {!isMobile && (
                  <span className="font-lato font-medium text-[10px] sm:text-xs text-primary whitespace-nowrap">
                    {t("lectures.interactionMode")}
                  </span>
                )}
              </button>

              {/* Continue Lesson Button */}
              <button
                onClick={handleContinueLesson}
                className="cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-primary rounded-[8.53px]">
                <Image className="w-3.5 h-3.5 sm:w-4 sm:h-4" src={back_to_session} alt="back_to_session" />
                <span className="font-lato font-medium text-[10px] sm:text-[10px] text-white whitespace-nowrap">
                  {t("lectures.continueLesson")}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ChatUI;
