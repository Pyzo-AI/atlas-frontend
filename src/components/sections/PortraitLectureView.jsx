"use client";
import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import Image from "next/image";
import back_arrow from "@/assets/svg/back_arrow.svg";
import chat_star from "@/assets/svg/chat_star.svg";
import modules from "@/assets/svg/modules.svg";
import { useLocalizedRouter } from "@/hooks/useLocalizedRouter";
import SlideVideoSection from "./SlideVideoSection";
import VideoPanel from "./VideoPanel";
import VideoPlaylist from "./VideoPlaylist";

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
          src={modules}
          alt="module content"
          width={16}
          height={16}
          style={activePanel === "moduleContent" ? { filter: "brightness(0) invert(1)" } : {}}
        />
        {t("lectures.moduleContent")}
      </button>

      {/* Ask Assistant — blue filled pill */}
      <button
        onClick={() => onToggle("askAssistant")}
        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-lato font-semibold transition-colors border
          ${activePanel === "askAssistant"
            ? "bg-white text-primary border-primary"
            : "bg-primary text-white border-primary"
          }
        `}
      >
        <Image
          src={chat_star}
          alt="ask assistant"
          width={16}
          height={16}
          style={activePanel === "askAssistant" ? {} : { filter: "brightness(0) invert(1)" }}
        />
        {t("lectures.askAssistant")}
      </button>
    </div>
  );
};

// ─── Module Content overlay panel ────────────────────────────────────────────

const ModuleContentPanel = ({ videos, loading, canSkipVideo, assessmentDetails, onClose }) => {
  const { t } = useTranslation();
  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-white">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border-light shrink-0">
        <button onClick={onClose} className="p-1 -ml-1">
          <Image src={back_arrow} alt="back" width={18} height={18} />
        </button>
        <span className="font-lato font-semibold text-[15px] text-primary-text">
          {t("lectures.moduleContent")}
        </span>
      </div>
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

// ─── Ask Assistant overlay panel ─────────────────────────────────────────────

const AskAssistantPanel = ({
  onClose,
  videoPanelRef,
  videos,
  isLoading,
  handleVideoStateChange,
  handlePauseVideo,
  handlePauseAnswerAudio,
  handlePauseSlideVideo,
  presentationId,
  data,
  conversationHistory,
  setConversationHistory,
  canSkipVideo,
  assessmentId,
  isOnlyVideoMode,
  isFinalAssessmentPresent,
  showQueryRelatedSlides,
  liveKitAgentEnabled,
  enableProductRecommendations,
}) => {
  const { t } = useTranslation();
  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-page-background">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border-light bg-white shrink-0">
        <button onClick={onClose} className="p-1 -ml-1">
          <Image src={back_arrow} alt="back" width={18} height={18} />
        </button>
        <Image src={chat_star} alt="assistant" width={18} height={18} />
        <span className="font-lato font-semibold text-[15px] text-primary-text">
          {t("lectures.askAssistant")}
        </span>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden p-3">
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

  const [activePanel, setActivePanel] = useState(null);
  const handleToggle = (id) => setActivePanel((prev) => (prev === id ? null : id));
  const handleClose = () => setActivePanel(null);

  return (
    <div
      className="relative flex flex-col bg-page-background overflow-hidden"
      style={{ height: "var(--app-height, 100dvh)" }}
    >
      {/* ── 1. Title bar ─────────────────────────────────────────────── */}
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
      <div className="shrink-0 w-full bg-black" style={{ aspectRatio: "16 / 9" }}>
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

      {/* ── 3. Progress bar — sits BELOW the slide ────────────────────── */}
      <div className="shrink-0 border-b border-border-light">
        <PortraitProgressBar videos={videos} />
      </div>

      {/* ── 4 + 5. Trainer video (padded/rounded) + AI card (flex-1) ──── */}
      {/*  VideoPanel with isPhoneView=true renders:                        */}
      {/*    - trainer video block (rounded, with video controls)           */}
      {/*    - AILearningAssistant card below it (fills remaining height)   */}
      <div className="flex-1 min-h-0 overflow-y-auto bg-page-background">
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
        />
      </div>

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
        />
      )}

      {activePanel === "askAssistant" && (
        <AskAssistantPanel
          onClose={handleClose}
          videoPanelRef={videoPanelRef}
          videos={videos}
          isLoading={isLoading}
          handleVideoStateChange={handleVideoStateChange}
          handlePauseVideo={handlePauseVideo}
          handlePauseAnswerAudio={handlePauseAnswerAudio}
          handlePauseSlideVideo={handlePauseSlideVideo}
          presentationId={presentationId}
          data={data}
          conversationHistory={conversationHistory}
          setConversationHistory={setConversationHistory}
          canSkipVideo={canSkipVideo}
          assessmentId={assessmentId}
          isOnlyVideoMode={isOnlyVideoMode}
          isFinalAssessmentPresent={isFinalAssessmentPresent}
          showQueryRelatedSlides={showQueryRelatedSlides}
          liveKitAgentEnabled={liveKitAgentEnabled}
          enableProductRecommendations={enableProductRecommendations}
        />
      )}
    </div>
  );
};

export default PortraitLectureView;
