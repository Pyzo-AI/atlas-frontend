import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { getUserDetailsFromToken } from "@/store/utils/token";
import { liveKitService } from "@/lib/livekit";
import { useCreateChatbotSessionMutation } from "@/store/api/liveKitApi";
import Lottie from "lottie-react";
import loaderAnimation from "@/assets/json/loader.json";
import chatbotIcon from "@/assets/svg/chatbot-icon.svg";
import chatbotCloseIcon from "@/assets/svg/chatbot-close-icon.svg";
import Image from "next/image";
import micMuted from "@/assets/svg/mic-muted.svg";
import micUnmuted from "@/assets/svg/mic-unmuted.svg";
import { toast } from "react-toastify";
import ChatUI from "@/components/sections/ChatUI";

const FloatingChatbot = ({ agentId = 1 }) => {
  const { t } = useTranslation();

  const [isOpen, setIsOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isAgentMuted, setIsAgentMuted] = useState(false);
  const [liveKitAgentState, setLiveKitAgentState] = useState("connecting");
  const [connectionState, setConnectionState] = useState({
    isLoading: false,
    isConnected: false,
    isAudioPlaying: false,
  });
  const [liveMessages, setLiveMessages] = useState([]);

  // Track typing so we never kill the session mid-message
  const isTypingRef = useRef(false);

  const abortControllerRef = useRef(null);
  const sessionPromiseRef = useRef(null);

  const [createChatbotSession] = useCreateChatbotSessionMutation();

  const handleLiveKitStateChange = (state) => {
    setConnectionState({
      isLoading: state.isConnecting,
      isConnected: state.isConnected,
      isAudioPlaying: state.isAudioPlaying || false,
    });
  };

  const startConversation = async () => {
    try {
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      setLiveMessages([]);
      setConnectionState((prev) => ({ ...prev, isLoading: true }));
      await navigator.mediaDevices.getUserMedia({ audio: true });
      if (signal.aborted) return;

      const userDetails = getUserDetailsFromToken();
      const sessionPromise = createChatbotSession({
        agent_id: agentId,
        user_id: userDetails?.sub || 0,
      });
      sessionPromiseRef.current = sessionPromise;

      const sessionResponse = await sessionPromise.unwrap();
      if (signal.aborted) return;

      liveKitService.onConnectionStateChanged = handleLiveKitStateChange;
      liveKitService.setOnAgentStateChanged((state) => {
        setLiveKitAgentState(state);
      });

      // Handle incoming data packets
      if (liveKitService.setOnDataReceived) {
        liveKitService.setOnDataReceived((payload) => {
          try {
            const decoder = new TextDecoder();
            const strData = decoder.decode(payload);
            const data = JSON.parse(strData);

            if (data.type === "user_response" || data.type === "agent_response") {
              const now = new Date();
              setLiveMessages((prev) => [
                ...prev,
                {
                  type: data.type === "user_response" ? "question" : "answer",
                  content: data.text,
                  time: now.toTimeString().slice(0, 5),
                  date: now.toISOString().split("T")[0],
                },
              ]);
            } else if (data.type === "status" && data.message === "call_ending") {
              if (liveKitService.isConnected()) {
                liveKitService.disconnect();
              }
              setIsOpen(false);
              setLiveKitAgentState("connecting");
              setConnectionState({ isLoading: false, isConnected: false, isAudioPlaying: false });
            }
          } catch (error) {
            console.log("Failed to parse data packet in FloatingChatbot:", error);
          }
        });
      }

      await liveKitService.connect({
        url: sessionResponse.livekit_url,
        token: sessionResponse.token,
        roomName: sessionResponse.room_name,
      });

      if (signal.aborted) {
        liveKitService.disconnect();
        return;
      }

      // Reset mute state on connect
      setIsMuted(false);
    } catch (error) {
      if (error?.name === "AbortError" || error?.isAborted) {
        console.log("Conversation start aborted");
        return;
      }
      setConnectionState((prev) => ({ ...prev, isLoading: false }));
      setIsOpen(false);
    }
  };

  const stopConversation = async () => {
    try {
      // Don't close if user is actively typing
      if (isTypingRef.current) {
        toast.info("Finish typing before closing the chat");
        return;
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (sessionPromiseRef.current) {
        sessionPromiseRef.current.abort?.();
      }

      await liveKitService.disconnect();

      setLiveKitAgentState("connecting");
      setConnectionState({
        isLoading: false,
        isConnected: false,
        isAudioPlaying: false,
      });
      setIsOpen(false);
    } catch (error) {
      console.log("Failed to stop conversation:", error);
    }
  };

  const toggleMute = async () => {
    if (!liveKitService.isConnected()) return;
    try {
      if (isMuted) {
        await liveKitService.enableMicrophone();
        setIsMuted(false);
      } else {
        await liveKitService.disableMicrophone();
        setIsMuted(true);
      }
    } catch (error) {
      console.log("Failed to toggle microphone:", error);
    }
  };

  const toggleAgentMute = () => {
    if (isAgentMuted) {
      setIsAgentMuted(false);
      liveKitService.unmuteAgentVoice();
    } else {
      setIsAgentMuted(true);
      liveKitService.muteAgentVoice();
    }
  };

  // Start session when the chatbot opens
  useEffect(() => {
    if (isOpen && !connectionState.isConnected && !connectionState.isLoading) {
      startConversation();
    }
  }, [isOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (liveKitService.isConnected()) {
        liveKitService.disconnect();
      }
    };
  }, []);

  // Disconnect when tab is hidden — but only if NOT typing
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden" && isOpen && !isTypingRef.current) {
        stopConversation();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isOpen]);

  // Lock body scroll on mobile when chatbot is open
  useEffect(() => {
    const isMobileWidth = window.innerWidth < 640;
    if (!isMobileWidth) return;

    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
      document.body.dataset.scrollY = String(scrollY);
    } else {
      const scrollY = parseInt(document.body.dataset.scrollY || "0", 10);
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      delete document.body.dataset.scrollY;
      window.scrollTo(0, scrollY);
    }

    return () => {
      const scrollY = parseInt(document.body.dataset.scrollY || "0", 10);
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      delete document.body.dataset.scrollY;
      if (scrollY) window.scrollTo(0, scrollY);
    };
  }, [isOpen]);

  // ─── Closed state: show the floating bubble ───────────────────────────────
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="cursor-pointer fixed bottom-6 right-6 w-[60px] h-[60px] rounded-full shadow-[0px_0px_25px_2.5px_#2877EE65] hover:scale-105 transition-all duration-300 z-50 flex items-center justify-center bg-white overflow-hidden"
      >
        <Image src={chatbotIcon} alt="chatbot" width={60} height={60} className="w-full h-full object-cover" />
      </button>
    );
  }

  const isConnecting = connectionState.isLoading || liveKitAgentState === "connecting";

  // ─── Open state: show the chat panel directly ──────────────────────────────
  return (
    <>
      {/* Mobile backdrop overlay */}
      <div className="sm:hidden fixed inset-0 bg-black/40 z-[9998] pointer-events-auto" />

      <div className="fixed bottom-0 right-0 w-full h-[90vh] sm:bottom-[96px] sm:right-6 sm:w-[360px] sm:h-[526px] bg-white rounded-t-[20px] sm:rounded-[20px] shadow-[0px_0px_20px_2px_rgba(49,75,159,0.3)] overflow-hidden flex flex-col z-[9999] transition-all duration-300 overscroll-contain">
        {/* Connecting overlay — shown on top of ChatUI while connecting */}
        {isConnecting && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/90 rounded-[20px]">
            <Lottie animationData={loaderAnimation} style={{ width: 180, height: 80 }} loop={true} />
            <p className="text-gray-500 text-sm font-lato mt-[-15px]">{t("floatingChatbot.connecting")}</p>
          </div>
        )}

        {/* Agent mute + close buttons (top-right of panel, always visible when open) */}
        <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
          <button
            onClick={toggleAgentMute}
            disabled={!connectionState.isConnected}
            className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors ${
              !connectionState.isConnected
                ? "opacity-40 cursor-not-allowed bg-gray-100"
                : isAgentMuted
                ? "bg-red-100 text-red-500 cursor-pointer"
                : "bg-gray-100 text-gray-600 cursor-pointer hover:bg-gray-200"
            }`}
            title={isAgentMuted ? "Unmute agent voice" : "Mute agent voice"}
          >
            {isAgentMuted ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
              </svg>
            )}
          </button>
          {/* Close button */}
          <button
            onClick={stopConversation}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 cursor-pointer hover:bg-gray-200 transition-colors"
            title="Close chat"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* ChatUI fills the whole panel */}
        <ChatUI
          onClose={stopConversation}
          conversation={[]}
          onStartConversation={startConversation}
          onStopConversation={stopConversation}
          isConnected={connectionState.isConnected}
          setIsJumpedOnChatFromInteractionMode={() => {}}
          isMobile={false}
          agentId={agentId}
          onPauseSlideVideo={() => {}}
          liveKitAgentEnabled={true}
          presentationId={1}
          useChatbotHistory={true}
          hideFooter={true}
          hideInteractionMode={true}
          liveMessages={liveMessages}
          enableSmoothScroll={false}
          // Notify us when user starts/stops typing so we protect the session
          onTypingChange={(isTyping) => {
            isTypingRef.current = isTyping;
          }}
        />
      </div>

      {/* Floating close button (Desktop only) */}
      <button
        onClick={stopConversation}
        className="hidden sm:flex cursor-pointer fixed bottom-6 right-6 w-[60px] h-[60px] rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 z-50 items-center justify-center bg-white overflow-hidden"
      >
        <Image
          src={chatbotCloseIcon}
          alt="close chatbot"
          width={60}
          height={60}
          className="w-full h-full object-cover"
        />
      </button>
    </>
  );
};

export default FloatingChatbot;