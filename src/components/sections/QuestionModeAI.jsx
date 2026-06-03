import React, { useRef, useEffect, useImperativeHandle, forwardRef } from "react";
import chat_star from "../../assets/svg/chat_star.svg";
import Image from "next/image";
import { getUserDetailsFromToken } from "@/store/utils/token";
import { useSelector } from "react-redux";
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
    const { productRecommendations, isUserMuted } = useSelector((state) => state.video);
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

    // Compact horizontal layout for mobile phone landscape
    if (isMobile) {
      return (
        <div
          className="p-2 bg-white rounded-xl border border-border-light flex items-center gap-3"
          style={{ minHeight: '54px', maxHeight: '54px' }}
        >
          {/* Avatar */}
          <div
            className="w-10 h-10 rounded-full border border-white/50 overflow-hidden flex-shrink-0 flex items-center justify-center"
            style={{ background: 'var(--gradient-primary-darkened)' }}
          >
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt="Profile picture"
                width={40}
                height={40}
                className="rounded-full object-cover w-full h-full"
              />
            ) : (
              <span className="text-white font-semibold text-sm">
                {userName?.charAt(0)?.toUpperCase() || "U"}
              </span>
            )}
          </div>

          {/* Status text */}
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-primary/80 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-primary/60 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                <div className="w-2 h-2 bg-primary/40 rounded-full animate-pulse" style={{ animationDelay: '0.6s' }}></div>
                <span className="ml-1 text-xs text-gray-500">{t("lectures.connecting")}</span>
              </div>
            ) : isConnected ? (
              <p className="font-lato font-medium text-sm text-primary-text capitalize truncate">
                {liveKitAgentEnabled
                  ? (liveKitAgentState === "listening"
                      ? (isUserMuted ? t("lectures.microphoneMuted") : t("lectures.listening"))
                      : liveKitAgentState === "speaking"
                        ? t("lectures.speaking")
                        : t("lectures.thinking"))
                  : isAudioPlaying
                    ? t("lectures.speaking")
                    : isUserMuted
                      ? t("lectures.microphoneMuted")
                      : t("lectures.listening")}
              </p>
            ) : (
              <p className="font-lato font-normal text-sm text-gray-500 truncate">
                {t("lectures.askMeAnything")}
              </p>
            )}
          </div>

          {/* Wave rings indicator when speaking */}
          {(isAudioPlaying || (liveKitAgentState === "speaking" && !isLoading)) && (
            <div className="flex-shrink-0 flex items-center gap-0.5">
              {[1, 2, 3].map((bar) => (
                <div
                  key={bar}
                  className="w-1 bg-primary rounded-full animate-pulse"
                  style={{
                    height: `${8 + bar * 4}px`,
                    animationDelay: `${bar * 0.2}s`,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="p-1 md:p-3 bg-white rounded-xl border border-border-light">
        <div
          className="w-full aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center"
          style={{
            background: "var(--gradient-primary-darkened)",
          }}>
          {/* Main Content Container */}
          <div className="flex flex-col items-center justify-center gap-4 w-[243px] h-[137px]">
            {/* Avatar Container */}
            <div className="relative flex items-center justify-center">
              {/* Animated Wave Rings */}
              {(isAudioPlaying || (liveKitAgentState === "speaking" && !isLoading)) && (
                <>
                  {[1, 2, 3].map((ring) => (
                    <div
                      key={ring}
                      className="absolute rounded-full border-4 border-white/30 animate-wave"
                      style={{
                        animationDelay: `${ring * 0.4}s`,
                      }}
                    />
                  ))}
                </>
              )}

              {/* Main Avatar */}
              <div
                className="w-16 h-16 rounded-full border-[0.8px] border-white/50 overflow-hidden relative z-10 flex items-center justify-center bg-white/20">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt="Profile picture"
                    width={64}
                    height={64}
                    className="rounded-full object-cover w-full h-full"
                  />
                ) : (
                  <span className="text-white font-semibold z-50 text-xl">
                    {userName?.charAt(0)?.toUpperCase() || "U"}
                  </span>
                )}
              </div>
            </div>

            {/* Text Content */}
            {isLoading ? (
              <div className="flex flex-col items-center space-y-3">
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
              <p className="w-full text-center font-lato font-normal text-sm leading-[18px] text-white hidden md:block capitalize">
                {liveKitAgentEnabled
                  ? (liveKitAgentState === "listening"
                      ? (isUserMuted ? "" : t("lectures.listening"))
                      : liveKitAgentState === "speaking"
                        ? t("lectures.speaking")
                        : t("lectures.thinking"))
                  : isAudioPlaying
                    ? t("lectures.speaking")
                    : isUserMuted
                      ? ""
                      : t("lectures.listening")}
              </p>
            ) : (
              <p className="w-full text-center font-lato font-normal text-sm leading-[18px] text-white hidden md:block">
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
