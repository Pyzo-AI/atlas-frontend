import React, {
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from "react";
import { toast } from "react-toastify";
import chat_star from "../../assets/svg/chat_star.svg";
import Image from "next/image";
import { getUserDetailsFromToken } from "@/store/utils/token";

const QuestionModeAI = forwardRef(
  ({ isAudioPlaying, isLoading, isConnected, avatarUrl }, ref) => {
    // ElevenLabs handles audio automatically
    useImperativeHandle(ref, () => ({
      // No manual audio control needed
    }));

    const userName = getUserDetailsFromToken()?.name;

    return (
      <div className="p-3 bg-white rounded-xl border border-[#E5E7EB]">
        <div
          className="w-full aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center"
          style={{
            background:
              "linear-gradient(0deg, rgba(0, 0, 0, 0.17), rgba(0, 0, 0, 0.17)), linear-gradient(180deg, #685EDD 0%, #DA8BFF 100%)",
          }}
        >
          {/* Main Content Container */}
          <div className="flex flex-col items-center justify-center gap-4 w-[243px] h-[137px]">
            {/* Avatar Container */}
            <div className="relative flex items-center justify-center">
              {/* Animated Wave Rings */}
              {isAudioPlaying && (
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
              <div className="w-16 h-16 rounded-full border-[0.8px] border-white/50 overflow-hidden relative z-10 flex items-center justify-center bg-white/20">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt="Profile picture"
                    width={64}
                    height={64}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <span className="text-white text-xl font-semibold z-50">
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
                      style={{ animationDelay: "0.3s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-white/40 rounded-full animate-pulse"
                      style={{ animationDelay: "0.6s" }}
                    ></div>
                  </div>
                  {/* Thought bubble effect */}
                  <div className="absolute -top-1 -right-1 w-1 h-1 bg-white/30 rounded-full animate-ping"></div>
                </div>
                {/* Professor thinking text */}
                <p className="text-white/90 text-xs font-light animate-pulse">
                  Connecting...
                </p>
              </div>
            ) : isConnected ? (
              <p className="w-full text-center font-lato font-normal text-sm leading-[18px] text-white">
                {isAudioPlaying ? "Speaking..." : "Listening..."}
              </p>
            ) : (
              <p className="w-full text-center font-lato font-normal text-sm leading-[18px] text-white">
                {
                  "Ask me anything about the presentation, and I'll help with the answers."
                }
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
