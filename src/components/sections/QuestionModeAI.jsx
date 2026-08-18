import React, { useRef, useEffect, useImperativeHandle, forwardRef } from "react";
import chat_star from "../../assets/svg/chat_star.svg";
import Image from "next/image";
import { getUserDetailsFromToken } from "@/store/utils/token";
import { useSelector, useDispatch } from "react-redux";
import { setIsAgentVoiceMuted } from "@/store/features/videoSlice";
import { liveKitService } from "@/lib/livekit";
import ProductRecommendationGallery from "@/components/sections/ProductRecommendationGallery";
import { useTranslation } from "react-i18next";

const QuestionModeAI = forwardRef(
  (
    {
      isAudioPlaying,
      isLoading,
      isConnected,
      isMobile = false,
      avatarUrl,
      liveKitAgentEnabled,
      liveKitAgentState,
      enableProductRecommendations = false,
    },
    ref
  ) => {
    // ElevenLabs handles audio automatically
    useImperativeHandle(ref, () => ({
      // No manual audio control needed
    }));

    const userName = getUserDetailsFromToken()?.name;
    const dispatch = useDispatch();
    const { productRecommendations, isUserMuted, isAgentVoiceMuted } = useSelector((state) => state.video);
    const { t } = useTranslation();

    // Show ProductRecommendationGallery when product recommendations are available
    if (enableProductRecommendations && productRecommendations?.length > 0) {
      return (
        <div className="p-1 md:p-3 bg-white rounded-xl border border-border-light">
          <div className="relative w-full bg-white overflow-hidden aspect-video rounded-lg">
            <div className="absolute inset-0">
              <ProductRecommendationGallery
                images={productRecommendations}
                isLooping={true}
                autoScroll={true}
                autoScrollInterval={3000}
              />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="p-1 lg:p-3 bg-white rounded-xl border border-border-light">
        <div
          className="w-full bg-black rounded-lg overflow-hidden flex items-center justify-center"
          style={{
            minHeight: isMobile ? '80px' : undefined,
            aspectRatio: isMobile ? undefined : '16/9',
            background: "var(--gradient-primary-darkened)",
          }}>
          {/* Main Content Container */}
          <div className="flex flex-col items-center justify-center gap-1 lg:gap-4 w-[243px]">
            {/* Avatar Container */}
            <div className="relative flex items-center justify-center">
              {/* Animated Wave Rings - only show when agent is audibly speaking (not muted) */}
              {(isAudioPlaying || (liveKitAgentState === "speaking" && !isLoading)) && !isAgentVoiceMuted && (
                <>
                  {[0, 1, 2, 3].map((ring) => {
                    const borderOpacity = ["border-white/50", "border-white/35", "border-white/20", "border-white/12"][ring];
                    return (
                      <div
                        key={ring}
                        className={`absolute rounded-full border-2 ${borderOpacity} animate-wave`}
                        style={{
                          width: isMobile ? '40px' : '64px',
                          height: isMobile ? '40px' : '64px',
                          animationDelay: `${ring * 0.45}s`,
                          willChange: 'transform, opacity',
                        }}
                      />
                    );
                  })}
                </>
              )}

              {/* Main Avatar */}
              <div
                className={`${
                  isMobile ? "w-10 h-10" : "w-8 h-8 lg:w-16 lg:h-16"
                } rounded-full border-[0.8px] border-white/50 overflow-hidden relative z-10 flex items-center justify-center bg-white/20`}>
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt="Profile picture"
                    width={isMobile ? 40 : 64}
                    height={isMobile ? 40 : 64}
                    className="rounded-full object-cover w-full h-full"
                  />
                ) : (
                  <span className={`text-white font-semibold z-50 ${isMobile ? "text-base" : "text-xl"}`}>
                    {userName?.charAt(0)?.toUpperCase() || "U"}
                  </span>
                )}
              </div>
            </div>

            {/* Text Content */}
            {isLoading ? (
              <div className={`flex flex-col items-center ${isMobile ? "space-y-1" : "space-y-3"}`}>
                {/* Thinking Animation */}
                <div className="relative">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-white/80 rounded-full animate-pulse"></div>
                    <div
                      className="w-2 h-2 bg-white/60 rounded-full animate-pulse"
                      style={{ animationDelay: "0.3s" }}></div>
                    <div
                      className="w-2 h-2 bg-white/40 rounded-full animate-pulse"
                      style={{ animationDelay: "0.6s" }}></div>
                  </div>
                  {/* Thought bubble effect */}
                  <div className="absolute -top-1 -right-1 w-1 h-1 bg-white/30 rounded-full animate-ping"></div>
                </div>
                {/* Professor thinking text */}
                <p className="text-white/90 text-xs font-light animate-pulse">{t("lectures.connecting")}</p>
              </div>
            ) : isConnected ? (
              <div className="flex items-center justify-center gap-2 w-full">
                <p className="text-center font-lato font-normal text-[11px] lg:text-sm leading-[14px] lg:leading-[18px] text-white capitalize">
                  {liveKitAgentEnabled
                    ? (liveKitAgentState === "listening"
                        ? (isUserMuted ? "" : t("lectures.listening"))
                        : liveKitAgentState === "speaking"
                          ? (isAgentVoiceMuted ? t("lectures.thinking") : t("lectures.speaking"))
                          : t("lectures.thinking"))
                    : isAudioPlaying
                      ? t("lectures.speaking")
                      : isUserMuted
                        ? ""
                        : t("lectures.listening")}
                </p>
                {/* AI Agent Voice Toggle */}
                {liveKitAgentEnabled && (
                  <button
                    onClick={() => {
                      if (isAgentVoiceMuted) {
                        dispatch(setIsAgentVoiceMuted(false));
                        liveKitService.unmuteAgentVoice();
                      } else {
                        dispatch(setIsAgentVoiceMuted(true));
                        liveKitService.muteAgentVoice();
                      }
                    }}
                    className={`w-5 h-5 lg:w-6 lg:h-6 flex items-center justify-center rounded-full transition-colors cursor-pointer ${
                      isAgentVoiceMuted
                        ? "bg-white/20 text-white/60"
                        : "bg-white/30 text-white"
                    }`}
                    title={isAgentVoiceMuted ? "Enable AI voice" : "Disable AI voice (text only)"}
                  >
                    {isAgentVoiceMuted ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 lg:h-3.5 lg:w-3.5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 lg:h-3.5 lg:w-3.5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                      </svg>
                    )}
                  </button>
                )}
              </div>
            ) : (
              <p className="w-full text-center font-lato font-normal text-[11px] lg:text-sm leading-[14px] lg:leading-[18px] text-white">
                {t("lectures.askMeAnything")}
              </p>
            )}
          </div>
        </div>

        {/* ElevenLabs handles audio automatically */}
      </div>
    );
  }
);

QuestionModeAI.displayName = "QuestionModeAI";

export default QuestionModeAI;
