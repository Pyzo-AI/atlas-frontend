"use client";
import React, { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setShowChat, setIsQuestionMode } from "@/store/features/videoSlice";
import { useTranslation } from "react-i18next";
import Image from "next/image";
import back_arrow from "@/assets/svg/back_arrow.svg";
import sparkles from "@/assets/svg/sparkles.svg";
import notebook from "@/assets/svg/Notebook Minimalistic.svg";
import { useLocalizedRouter } from "@/hooks/useLocalizedRouter";
import SlideVideoSection from "./SlideVideoSection";
import VideoPanel from "./VideoPanel";
import VideoPlaylist from "./VideoPlaylist";
import ChatUI from "./ChatUI";

// ─── Portrait loading skeleton ────────────────────────────────────────────────
// Mirrors the portrait layout: title bar → slide video → progress bar →
// trainer video → AI area → bottom tab bar. All shimmer via animate-pulse.

export const PortraitSkeleton = () => (
  <div
    className="flex flex-col bg-page-background overflow-hidden"
    style={{ height: "var(--app-height, 100dvh)" }}
  >
    {/* Title bar */}
    <div className="shrink-0 bg-white px-4 pt-3 pb-2 border-b border-border-light animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 bg-gray-200 rounded shrink-0" />
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          <div className="h-3.5 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-100 rounded w-1/3" />
        </div>
      </div>
    </div>

    {/* Slide video placeholder — full-width 16:9 */}
    <div
      className="shrink-0 w-full bg-gray-200 animate-pulse flex items-center justify-center"
      style={{ aspectRatio: "16 / 9" }}
    >
      <div className="w-12 h-12 bg-gray-300 rounded-full" />
    </div>

    {/* Progress bar */}
    <div className="shrink-0 bg-white border-b border-border-light px-4 py-2 animate-pulse">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-gray-200 rounded-full" />
        <div className="h-3 w-8 bg-gray-200 rounded" />
        <div className="h-3 w-16 bg-gray-100 rounded" />
      </div>
    </div>

    {/* Trainer video — padded, rounded */}
    <div className="px-2 pt-2 animate-pulse">
      <div className="w-full bg-gray-200 rounded-lg overflow-hidden" style={{ aspectRatio: "16 / 9" }}>
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-10 h-10 bg-gray-300 rounded-full" />
        </div>
      </div>
      {/* Time / slide count row */}
      <div className="flex justify-between mt-1 px-1">
        <div className="h-2.5 w-14 bg-gray-200 rounded" />
        <div className="h-2.5 w-8 bg-gray-200 rounded" />
      </div>
    </div>

    {/* AI assistant card area */}
    <div className="flex-1 min-h-0 px-2 pt-2 pb-1 animate-pulse">
      <div className="w-full h-full bg-white border border-border-light rounded-xl p-3 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 bg-gray-200 rounded-full" />
        <div className="h-3 w-32 bg-gray-200 rounded" />
        <div className="h-3 w-48 bg-gray-100 rounded" />
        <div className="h-8 w-36 bg-gray-200 rounded-lg mt-1" />
      </div>
    </div>

    {/* Bottom tab bar */}
    <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-t border-border-light bg-white animate-pulse">
      <div className="flex-1 h-10 bg-gray-100 rounded-xl" />
      <div className="flex-1 h-10 bg-gray-200 rounded-xl" />
    </div>
  </div>
);

// ─── Draggable PiP wrapper ────────────────────────────────────────────────────
// Wraps any children in a floating, draggable window.
// Default position: bottom-left corner (matches reference image).
// Uses pointer capture so drag works on both touch and mouse without extra handlers.

const PIP_W = 200;
const PIP_H = 133; // ~16:9
const PIP_MARGIN = 12;

const DraggablePiP = ({ children, containerRef, isPiP }) => {
  const getDefaultPos = useCallback(() => {
    const cw = containerRef?.current?.clientWidth ?? (typeof window !== "undefined" ? window.innerWidth : 360);
    // Position at top-right corner over the slide video
    return {
      x: cw - PIP_W - PIP_MARGIN,
      y: 55,
    };
  }, [containerRef]);

  const [pos, setPos] = useState(getDefaultPos);
  const dragging = useRef(false);
  const origin = useRef({ px: 0, py: 0, ox: 0, oy: 0 });

  // Reset to default position each time PiP mode activates
  useEffect(() => {
    if (isPiP) {
      setPos(getDefaultPos());
    }
  }, [isPiP, getDefaultPos]);

  const clamp = useCallback((p) => {
    const cw = containerRef?.current?.clientWidth ?? (typeof window !== "undefined" ? window.innerWidth : 360);
    const ch = containerRef?.current?.clientHeight ?? (typeof window !== "undefined" ? window.innerHeight : 640);
    return {
      x: Math.max(PIP_MARGIN, Math.min(p.x, cw - PIP_W - PIP_MARGIN)),
      y: Math.max(PIP_MARGIN, Math.min(p.y, ch - PIP_H - PIP_MARGIN)),
    };
  }, [containerRef]);

  const onPointerDown = (e) => {
    if (!isPiP) return;
    e.preventDefault();
    dragging.current = true;
    origin.current = { px: e.clientX, py: e.clientY, ox: pos.x, oy: pos.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!dragging.current) return;
    setPos(clamp({
      x: origin.current.ox + (e.clientX - origin.current.px),
      y: origin.current.oy + (e.clientY - origin.current.py),
    }));
  };

  const onPointerUp = () => { dragging.current = false; };

  // Normal flow mode — just render children in a flex-1 scrollable div
  if (!isPiP) {
    return (
      <div className="flex-1 min-h-0 overflow-y-auto bg-page-background">
        {children}
      </div>
    );
  }

  // PiP mode — absolutely positioned, draggable, floating over panels
  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{
        position: "absolute",
        left: pos.x,
        top: pos.y,
        width: PIP_W,
        height: PIP_H,
        zIndex: 60,
        borderRadius: 10,
        overflow: "hidden",
        boxShadow: "0 4px 18px rgba(0,0,0,0.4)",
        cursor: dragging.current ? "grabbing" : "grab",
        touchAction: "none",
        userSelect: "none",
      }}
    >
      {children}
    </div>
  );
};

// ─── Progress bar ─────────────────────────────────────────────────────────────

const PortraitProgressBar = ({ videos = [] }) => {
  const { completedCount, remainingDurationSec } = useMemo(() => {
    const completed = videos.filter((v) => v?.is_completed).length;
    const remaining = videos
      .filter((v) => !v?.is_completed)
      .reduce((sum, v) => sum + (v?.duration || 0), 0);
    return { completedCount: completed, remainingDurationSec: remaining };
  }, [videos]);

  const percent = videos.length > 0 ? Math.round((completedCount / videos.length) * 100) : 0;

  const formatMinutes = (sec) => {
    const m = Math.round(sec / 60);
    return m > 0 ? `${m} min left` : "Done";
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-white">
      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-[11px] font-lato font-medium text-text-muted shrink-0">
        {percent}%
      </span>
      <span className="text-[11px] font-lato text-text-muted shrink-0 flex items-center gap-1">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0">
          <circle cx="6" cy="6" r="5" stroke="#667085" strokeWidth="1.2" />
          <path d="M6 3.5V6L7.5 7.5" stroke="#667085" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
        {formatMinutes(remainingDurationSec)}
      </span>
    </div>
  );
};

// ─── Bottom tab bar ───────────────────────────────────────────────────────────
// Left button: plain grey text + icon (inactive style always)
// Right button: blue filled pill (active style always)

const BottomTabBar = ({ activePanel, onToggle }) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-t border-border-light bg-white shrink-0">
      {/* Module Content — plain, outlined */}
      <button
        onClick={() => onToggle("moduleContent")}
        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-lato font-semibold transition-colors border
          ${activePanel === "moduleContent"
            ? "bg-primary text-white border-primary"
            : "bg-white text-text-muted border-border-light"
          }
        `}
      >
        <Image
          src={notebook}
          alt="module content"
          width={16}
          height={16}
          style={activePanel === "moduleContent" ? { filter: "brightness(0) invert(1)" } : {}}
        />
        {t("lectures.moduleContent")}
      </button>

      {/* Ask Assistant — light blue tint default, solid primary when active */}
      <button
        onClick={() => onToggle("askAssistant")}
        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-lato font-semibold transition-colors border
          ${activePanel === "askAssistant"
            ? "bg-primary text-white border-primary"
            : "bg-primary/10 text-primary border-primary/20"
          }
        `}
      >
        <Image
          src={sparkles}
          alt="ask assistant"
          width={16}
          height={16}
          style={activePanel === "askAssistant" ? { filter: "brightness(0) invert(1)" } : {}}
        />
        {t("lectures.askAssistant")}
      </button>
    </div>
  );
};

// ─── Module Content overlay panel ────────────────────────────────────────────
// Positioned below the slide video — the slide stays visible above untouched.
// We calculate the top offset dynamically using a ref on the slide container.

const ModuleContentPanel = ({ videos, loading, canSkipVideo, assessmentDetails, onClose, topOffset }) => {
  const { t } = useTranslation();
  return (
    <div
      className="absolute inset-x-0 bottom-0 z-20 flex flex-col bg-white"
      style={{ top: topOffset }}
    >
      {/* Panel header with back arrow */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border-light shrink-0">
        <button onClick={onClose} className="p-1 -ml-1">
          <Image src={back_arrow} alt="back" width={18} height={18} />
        </button>
        <span className="font-lato font-semibold text-[15px] text-primary-text">
          {t("lectures.moduleContent")}
        </span>
      </div>

      {/* Scrollable lesson list */}
      <div className="flex-1 overflow-y-auto p-3">
        <VideoPlaylist
          videos={videos}
          loading={loading}
          canSkipVideo={canSkipVideo}
          isMobile={false}
          assessmentDetails={assessmentDetails}
          isGridLayout={true}
        />
      </div>
    </div>
  );
};

// ─── Ask Assistant inline panel ───────────────────────────────────────────────
// Same layout as ModuleContentPanel: slide stays above, content below.
// ChatUI is rendered directly — no duplicate VideoPanel.
// All conversation logic lives in the VideoPanel PiP via videoPanelRef.

const AskAssistantInlinePanel = ({
  onClose,
  topOffset,
  videoPanelRef,
  conversationHistory,
  presentationId,
  agentId,
  liveKitAgentEnabled,
  showQueryRelatedSlides,
  currentSlideId,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  // Re-render every 300ms to pick up conversationState/liveMessages changes from ref
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 300);
    return () => clearInterval(id);
  }, []);

  const conversationState = videoPanelRef?.current?.getConversationState?.() ?? { isConnected: false };
  const liveMessages = videoPanelRef?.current?.getLiveMessages?.() ?? [];

  // When closing the panel, also stop interaction mode + conversation if active
  const handleClose = () => {
    dispatch(setShowChat(false));
    dispatch(setIsQuestionMode(false));
    videoPanelRef?.current?.stopConversation?.();
    onClose();
  };

  const handleStartConversation = () => {
    videoPanelRef?.current?.startConversation?.();
  };

  const handleStopConversation = () => {
    videoPanelRef?.current?.stopConversation?.();
  };

  const handleSetIsJumped = (val) => {
    videoPanelRef?.current?.setIsJumpedOnChatFromInteractionMode?.(val);
  };

  return (
    <div
      className="absolute inset-x-0 bottom-0 z-20 flex flex-col bg-white"
      style={{ top: topOffset }}
    >
      {/* Panel header — commented out for now
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border-light shrink-0">
        <button onClick={handleClose} className="p-1 -ml-1">
          <Image src={back_arrow} alt="back" width={18} height={18} />
        </button>
        <Image src={chat_star} alt="assistant" width={16} height={16} />
        <span className="font-lato font-semibold text-[15px] text-primary-text">
          {t("lectures.askAssistant")}
        </span>
      </div>
      */}

      {/* ChatUI fills remaining space — header hidden, footer visible */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <ChatUI
          onClose={handleClose}
          conversation={conversationHistory}
          onStartConversation={handleStartConversation}
          onStopConversation={handleStopConversation}
          isConnected={conversationState.isConnected}
          setIsJumpedOnChatFromInteractionMode={handleSetIsJumped}
          agentId={agentId}
          isMobile={true}
          onPauseSlideVideo={() => {}}
          liveKitAgentEnabled={liveKitAgentEnabled}
          presentationId={presentationId}
          hideFooter={false}
          portraitMode={true}
          liveMessages={liveMessages}
          enableSmoothScroll={false}
          showQueryRelatedSlides={showQueryRelatedSlides}
          currentSlideId={currentSlideId}
        />
      </div>
    </div>
  );
};

// ─── Main portrait layout ─────────────────────────────────────────────────────
//
//  ┌─────────────────────────────┐
//  │ ← Title          By: Author │  1. Title bar (white)
//  ├─────────────────────────────┤
//  │ [  slide video — 16:9    ]  │  2. Slide video — edge-to-edge, no padding
//  ├─────────────────────────────┤
//  │ ▓▓▓░  50%   🕐 4 min left  │  3. Progress bar (white), BELOW slide
//  ├─────────────────────────────┤
//  │  [ trainer video — 16:9 ]   │  4. Trainer video — padded, rounded
//  │                             │  5. AI assistant card — flex-1, grey bg
//  │                             │
//  ├─────────────────────────────┤
//  │ 📋 Module Content │✦ Ask   │  6. Bottom bar: plain left, blue-pill right
//  └─────────────────────────────┘

const PortraitLectureView = ({
  pptSectionRef,
  videos = [],
  isLoading,
  pptVideoIndex,
  pptSyncState,
  videoState,
  data,
  canSkipVideo,
  presentationId,
  onVideoIndexChange,
  isOnlyVideoMode,
  assessmentId,
  showQueryRelatedSlides,
  passingScore,
  videoPanelRef,
  handleVideoStateChange,
  handlePauseVideo,
  handlePauseAnswerAudio,
  handlePauseSlideVideo,
  conversationHistory,
  setConversationHistory,
  isFinalAssessmentPresent,
  liveKitAgentEnabled,
  enableProductRecommendations,
}) => {
  const { t } = useTranslation();
  const router = useLocalizedRouter();
  const dispatch = useDispatch();
  const { currentVideoIndex } = useSelector((state) => state.video);
  const currentSlideId = videos?.[currentVideoIndex]?.slide;

  const [activePanel, setActivePanel] = useState(null);
  const handleToggle = (id) => setActivePanel((prev) => (prev === id ? null : id));
  const handleClose = () => setActivePanel(null);

  // Do NOT dispatch setShowChat here — ChatUI manages its own showChat state.
  // We only clear it when the panel closes to reset state.
  useEffect(() => {
    if (!activePanel) {
      dispatch(setShowChat(false));
    }
  }, [activePanel, dispatch]);

  // Ref to measure the bottom edge of title + slide + progress bar.
  // The module content panel starts exactly here so the slide stays unchanged above.
  const slideEndRef = useRef(null);
  const containerRef = useRef(null);

  if (isLoading) return <PortraitSkeleton />;

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col bg-page-background overflow-hidden"
      style={{ height: "var(--app-height, 100dvh)" }}
    >
      {/* ── 1. Title bar ─────────────────────────────────────────────── */}
      {/* Wrap title + slide + progress in a ref div so we can measure   */}
      {/* where this block ends and start the module content panel there */}
      {/* ref only wraps title + slide — progress bar is outside so offset is exact */}
      <div ref={slideEndRef} className="relative z-10" style={{ isolation: "isolate" }}>
        <div className="shrink-0 bg-white px-4 pt-3 pb-2 border-b border-border-light">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="shrink-0 p-0.5">
              <Image src={back_arrow} alt="back" width={20} height={20} />
            </button>
            <div className="flex-1 min-w-0">
              <p className="font-lato font-bold text-[13px] leading-tight text-primary-text truncate">
                {data?.presentation_name || t("lectures.untitledPresentation")}
              </p>
              <p className="font-lato text-[11px] text-text-muted truncate">
                {t("lectures.by")} {data?.presentation_author || t("lectures.unknownAuthor")}
              </p>
            </div>
          </div>
        </div>

        {/* ── 2. Slide video — edge-to-edge, 16:9, no side padding ──────── */}
        <div className="shrink-0 w-full  [&_.rounded-xl]:rounded-none [&_.rounded-lg]:rounded-none" style={{ aspectRatio: "16 / 9" }}>
          <SlideVideoSection
            ref={pptSectionRef}
            videos={videos}
            currentVideoTime={(pptSyncState?.currentTime || 0) + 0.1}
            isVideoPlaying={pptSyncState?.isPlaying || false}
            videoDuration={videoState?.duration || 0}
            assessmentDetails={data?.assessment_details || []}
            isOnlyVideoMode={isOnlyVideoMode}
            presentationId={presentationId}
            onVideoIndexChange={onVideoIndexChange}
            canSkipVideo={canSkipVideo}
            assessmentId={assessmentId}
            showQueryRelatedSlides={showQueryRelatedSlides}
            passingScore={passingScore}
          />
        </div>
      </div>

      {/* ── 3. Progress bar — hidden when any panel is open ──────────── */}
      {/* {!activePanel && (
        <div className="shrink-0 border-b border-border-light">
          <PortraitProgressBar videos={videos} />
        </div>
      )} */}

      {/* ── 4 + 5. VideoPanel — always mounted, never unmounted ──────────
           Normal: flex-1 in flow.
           Panel open: absolute PiP in top-right corner, draggable.
           Single instance = no remount = no video reset.              */}
      <DraggablePiP containerRef={containerRef} isPiP={!!activePanel}>
        <div className="w-full h-full overflow-hidden">
          <VideoPanel
            ref={videoPanelRef}
            videos={videos}
            loading={isLoading}
            onVideoStateChange={handleVideoStateChange}
            onPauseVideo={handlePauseVideo}
            onPauseAnswerAudio={handlePauseAnswerAudio}
            onPauseSlideVideo={handlePauseSlideVideo}
            width="100%"
            presentationId={presentationId}
            isMobileView={true}
            isPhoneView={true}
            agentId={data?.presentation_agent_id}
            avatarUrl={data?.presentation_trainer_image}
            conversationHistory={conversationHistory}
            setConversationHistory={setConversationHistory}
            isPresentationQuizPassed={data?.is_presentation_quiz_passed || false}
            canSkipVideo={canSkipVideo}
            assessmentId={assessmentId}
            isOnlyVideoMode={isOnlyVideoMode}
            isFinalAssessmentPresent={isFinalAssessmentPresent}
            showQueryRelatedSlides={showQueryRelatedSlides}
            assessmentDetails={data?.assessment_details || []}
            liveKitAgentEnabled={liveKitAgentEnabled}
            enableProductRecommendations={enableProductRecommendations}
            hideAIAssistant={true}
            hideChatUI={true}
            fillQuestionModeAI={true}
          />
        </div>
      </DraggablePiP>

      {/* ── 6. Bottom tab bar ─────────────────────────────────────────── */}
      <BottomTabBar activePanel={activePanel} onToggle={handleToggle} />

      {/* ── Overlay panels ────────────────────────────────────────────── */}
      {activePanel === "moduleContent" && (
        <ModuleContentPanel
          videos={videos}
          loading={isLoading}
          canSkipVideo={canSkipVideo}
          assessmentDetails={data?.assessment_details || []}
          onClose={handleClose}
          topOffset={slideEndRef.current?.offsetHeight ?? 0}
        />
      )}

      {activePanel === "askAssistant" && (
        <AskAssistantInlinePanel
          onClose={handleClose}
          topOffset={slideEndRef.current?.offsetHeight ?? 0}
          videoPanelRef={videoPanelRef}
          conversationHistory={conversationHistory}
          presentationId={presentationId}
          agentId={data?.presentation_agent_id}
          liveKitAgentEnabled={liveKitAgentEnabled}
          showQueryRelatedSlides={showQueryRelatedSlides}
          currentSlideId={currentSlideId}
        />
      )}
    </div>
  );
};

export default PortraitLectureView;
