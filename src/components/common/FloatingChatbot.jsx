import React, { useState, useEffect } from "react";
import { getUserDetailsFromToken } from "@/store/utils/token";
import { liveKitService } from "@/lib/livekit";
import { useCreateSessionMutation } from "@/store/api/liveKitApi";
import Lottie from "lottie-react";
import userWaveAnimation from "@/assets/json/user_wave.json";
import chatHistory from "@/assets/svg/chat-history.svg";
import chatbotIcon from "@/assets/svg/chatbot-icon.svg";
import chatbotCloseIcon from "@/assets/svg/chatbot-close-icon.svg";
import Image from "next/image";
import micMuted from "@/assets/svg/mic-muted.svg";
import micUnmuted from "@/assets/svg/mic-unmuted.svg";
import { toast } from "react-toastify";
import ChatUI from "@/components/sections/ChatUI";

const FloatingChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [liveKitAgentState, setLiveKitAgentState] = useState("connecting");
  const [connectionState, setConnectionState] = useState({
    isLoading: false,
    isConnected: false,
    isAudioPlaying: false,
  });

  const [createSession] = useCreateSessionMutation();

  const handleLiveKitStateChange = (state) => {
    console.log(state, "state");
    setConnectionState({
      isLoading: state.isConnecting,
      isConnected: state.isConnected,
      isAudioPlaying: state.isAudioPlaying || false,
    });
  };

  const startConversation = async () => {
    try {
      setConnectionState((prev) => ({ ...prev, isLoading: true }));
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const userDetails = getUserDetailsFromToken();
      // Hardcoded agent_id and presentation_id as per requirements
      const sessionResponse = await createSession({
        agent_id: 6,
        user_id: userDetails?.sub || 0,
        presentation_id: 1, // Dummy ID
      }).unwrap();

      liveKitService.onConnectionStateChanged = handleLiveKitStateChange;
      liveKitService.setOnAgentStateChanged((state) => {
        console.log(state, "liveKitAgentState");
        setLiveKitAgentState(state);
      });

      // Detect call_ending from agent side and auto-close the chatbot
      if (liveKitService.setOnDataReceived) {
        liveKitService.setOnDataReceived((payload) => {
          try {
            const decoder = new TextDecoder();
            const strData = decoder.decode(payload);
            const data = JSON.parse(strData);
            if (data.type === "status" && data.message === "call_ending") {
              if (liveKitService.isConnected()) {
                liveKitService.disconnect();
              }
              setIsOpen(false);
              setShowChatHistory(false);
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

      // Reset mute state on connect
      setIsMuted(false);
    } catch (error) {
      toast.error("Failed to connect to the agent. Please try again later.");
      setConnectionState((prev) => ({ ...prev, isLoading: false }));
      setIsOpen(false);
    }
  };

  const stopConversation = async () => {
    try {
      if (liveKitService.isConnected()) {
        await liveKitService.disconnect();
      }
      setLiveKitAgentState("connecting");
      setConnectionState({
        isLoading: false,
        isConnected: false,
        isAudioPlaying: false,
      });
      setIsOpen(false);
      setShowChatHistory(false);
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

  useEffect(() => {
    if (isOpen && !connectionState.isConnected && !connectionState.isLoading) {
      startConversation();
    }
    // Cleanup when component unmounts or chatbot is closed
    return () => {
      if (liveKitService.isConnected() && !isOpen) {
        liveKitService.disconnect();
      }
    };
  }, [isOpen]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="cursor-pointer fixed bottom-6 right-6 w-[60px] h-[60px] rounded-full shadow-[0px_0px_25px_2.5px_#2877EE65] hover:scale-105 transition-all duration-300 z-50 flex items-center justify-center bg-white overflow-hidden">
        <Image src={chatbotIcon} alt="chatbot" width={60} height={60} className="w-full h-full object-cover" />
      </button>
    );
  }

  const isAgentSpeaking = connectionState.isAudioPlaying || liveKitAgentState === "speaking";
  const isUserSpeaking = liveKitAgentState === "listening" && !isMuted;
  const isConnecting = connectionState.isLoading || liveKitAgentState === "connecting";

  if (showChatHistory) {
    return (
      <>
        <div className="fixed bottom-0 right-0 w-full h-[90vh] sm:bottom-[96px] sm:right-6 sm:w-[360px] sm:h-[526px] bg-white rounded-t-[20px] sm:rounded-[20px] shadow-[0px_0px_20px_2px_rgba(49,75,159,0.3)] overflow-hidden flex flex-col z-50 transition-all duration-300">
          <ChatUI
            onClose={() => setShowChatHistory(false)}
            conversation={[]}
            onStartConversation={startConversation}
            onStopConversation={stopConversation}
            isConnected={connectionState.isConnected}
            setIsJumpedOnChatFromInteractionMode={() => {}}
            isMobile={false}
            agentId={6}
            onPauseSlideVideo={() => {}}
            liveKitAgentEnabled={true}
            presentationId={1}
          />
        </div>

        {/* Floating close button when open (Desktop only) */}
        <button
          onClick={stopConversation}
          className="hidden sm:flex cursor-pointer fixed bottom-6 right-6 w-[60px] h-[60px] rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 z-50 items-center justify-center bg-white overflow-hidden">
          <Image src={chatbotCloseIcon} alt="close chatbot" width={60} height={60} className="w-full h-full object-cover" />
        </button>
      </>
    );
  }

  return (
    <>
      <div className="fixed bottom-0 right-0 w-full h-[349px] sm:bottom-[96px] sm:right-6 sm:w-[360px] sm:h-[526px] bg-[#FFFFFF] rounded-t-[20px] sm:rounded-[20px] shadow-[0px_0px_20px_2px_rgba(49,75,159,0.3)] overflow-hidden flex flex-col z-50 border border-[#E9EFFD] transition-all duration-300">
        {/* Background Gradient matching the screenshot */}
        <div className="absolute top-[-90px] left-1/2 -translate-x-1/2 w-[180px] h-[180px] bg-[#2762EA] blur-[102px] pointer-events-none" />

        {/* Center Animation Area */}
        <div className="flex-1 flex flex-col items-center justify-center relative">
          <div className="relative w-[150px] h-[150px] flex items-center justify-center">
            {isConnecting ? (
              <div className="flex flex-col items-center space-y-3">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-500 text-sm font-lato">Connecting...</p>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center scale-125">
                <Lottie animationData={userWaveAnimation} style={{ width: 120, height: 120 }} loop={true} />
              </div>
            )}
          </div>

          {/* State Text */}
          {!isConnecting && (
            <div className="mt-[32px] sm:mt-[42px] flex flex-col items-center gap-[4px] sm:gap-[8px]">
              <p className="text-[12px] sm:text-[14px] leading-[16px] font-semibold sm:font-bold text-[#2762EA] sm:text-[#0888E6] font-lato">
                {liveKitAgentState === "listening" ? (isMuted ? "Muted" : "Listening...") : "Speaking..."}
              </p>
              {/* {liveKitAgentState === "listening" && !isMuted && (
                <p className="text-[10px] sm:text-[12px] leading-[12px] sm:leading-[16px] font-medium text-[#4B5563] sm:text-[#1A1C29]/60 font-lato">You can speak now</p>
              )} */}
            </div>
          )}
        </div>

        {/* Bottom Controls */}
        <div className="p-0 pb-[32px] sm:pb-[42px] flex items-center justify-center gap-[24px]">
          <button
            onClick={stopConversation}
            className="sm:hidden w-[56px] h-[56px] rounded-full flex items-center justify-center transition-colors cursor-pointer flex-shrink-0 shadow-sm hover:shadow-md bg-white border border-gray-100 overflow-hidden">
            <Image src={chatbotCloseIcon} alt="close chatbot" width={56} height={56} className="w-full h-full object-cover" />
          </button>

          <button
            onClick={() => setShowChatHistory(true)}
            className="w-[56px] h-[56px] sm:w-[64px] sm:h-[64px] flex items-center justify-center flex-shrink-0 cursor-pointer">
            <Image src={chatHistory} alt="chat history" width={64} height={64} className="w-full h-full object-contain" />
          </button>

          <button
            onClick={toggleMute}
            disabled={!connectionState.isConnected}
            className={`w-[56px] h-[56px] sm:w-[64px] sm:h-[64px] flex items-center justify-center flex-shrink-0 ${
              !connectionState.isConnected ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
            }`}>
            <Image
              src={isMuted ? micMuted : micUnmuted}
              alt={isMuted ? "mic muted" : "mic unmuted"}
              width={64}
              height={64}
              className="w-full h-full object-contain"
            />
          </button>

        </div>
      </div>

      {/* Floating close button when open (Desktop only) */}
      <button
        onClick={stopConversation}
        className="hidden sm:flex cursor-pointer fixed bottom-6 right-6 w-[60px] h-[60px] rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 z-50 items-center justify-center bg-white overflow-hidden">
        <Image src={chatbotCloseIcon} alt="close chatbot" width={60} height={60} className="w-full h-full object-cover" />
      </button>
    </>
  );
};

export default FloatingChatbot;
