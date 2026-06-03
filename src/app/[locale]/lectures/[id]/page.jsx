"use client";
import React, { useState, useRef, useEffect } from "react";
import VideoPanel from "@/components/sections/VideoPanel";
import PPTSection from "@/components/sections/PPTSection";
import { useGetAllVideoQuery, useSubmitVideoProgressMutation } from "@/store/api/questionsApi";
import { useDispatch, useSelector } from "react-redux";
import {
  setIsPlaying,
  setCurrentVideoIndex,
  setCurrentVideoTime,
  setIsVideoPlaying,
  setSelectedAssessmentId,
} from "@/store/features/videoSlice";
import { usePathname, useParams, useRouter } from "next/navigation";
import BreadCrumb from "@/components/common/BreadCrumb";
import PageSkeleton from "@/components/common/PageSkeleton";
import { usePortraitMode } from "@/hooks/usePortraitMode";
import FullscreenController from "@/components/ui/FullscreenController";
import { getUserDetailsFromToken } from "@/store/utils/token";
import { getVideoProgress, clearVideoProgress } from "@/utils/videoProgress";
import { clearAssessmentProgress } from "@/utils/assessmentProgress";
import Image from "next/image";
import RotateDeviceIcon from "@/assets/svg/rotate_device.svg";
import RotateArrowIcon from "@/assets/svg/rotate_arrow.svg";
import { useTranslation } from "react-i18next";

// Portrait Mode Rotation Prompt Component
const RotationPrompt = () => {
  const { t } = useTranslation();
  return (
    <div className="absolute top-16 inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="text-center text-white px-6">
        <div className="mb-6">
          <Image 
            src={RotateDeviceIcon} 
            alt="Rotate device" 
            width={64} 
            height={64} 
            className="mx-auto mb-4 animate-bounce" 
          />
        </div>
        <h2 className="text-xl font-semibold mb-2">{t("lectures.rotateTitle")}</h2>
        <p className="text-gray-300 mb-4">
          {t("lectures.rotateDesc")}
        </p>
        <div className="flex items-center justify-center space-x-2">
          <div className="w-8 h-12 border-2 border-white rounded-sm"></div>
          <Image 
            src={RotateArrowIcon} 
            alt="Rotate arrow" 
            width={24} 
            height={24} 
          />
          <div className="w-12 h-8 border-2 border-white rounded-sm"></div>
        </div>
      </div>
    </div>
  );
};

// Combined components moved outside to prevent re-creation on every render
const CombinedBreadCrumb = React.memo(({ data }) => {
  const { t } = useTranslation();
  return (
    <BreadCrumb
      paths={[
        { path: "/", label: t("lectures.allCourses") },
        {
          path: "/lectures/123",
          label: data?.presentation_name || t("lectures.untitledPresentation"),
        },
      ]}
    />
  );
});

const CombinedPPTSection = React.memo(
  React.forwardRef(({
    isMobile = false,
    isPhone = false,
    videos,
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
    showQueryRelatedSlides = false,
    passingScore
  }, ref) => {
    const width = isMobile ? "100%" : "70%";
    const { t } = useTranslation();

    return (
      <PPTSection
        ref={ref}
        videos={videos}
        loading={isLoading}
        currentVideoIndex={pptVideoIndex}
        currentVideoTime={pptSyncState.currentTime}
        isVideoPlaying={pptSyncState.isPlaying}
        videoDuration={videoState.duration}
        width={width}
        title={data?.presentation_name || t("lectures.untitledPresentation")}
        author={data?.presentation_author || t("lectures.unknownAuthor")}
        isMobileView={isMobile}
        isPhoneView={isPhone}
        canSkipVideo={canSkipVideo}
        assessmentDetails={data?.assessment_details || []}
        presentationId={presentationId}
        onVideoIndexChange={onVideoIndexChange}
        isOnlyVideoMode={isOnlyVideoMode}
        assessmentId={assessmentId}
        showQueryRelatedSlides={showQueryRelatedSlides}
        passingScore={passingScore}
      />
    );
  })
);

const CombinedVideoPanel = React.memo(
  ({
    isMobile = false,
    isPhone = false,
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
    showQueryRelatedSlides = false,
    assessmentDetails = [],
    liveKitAgentEnabled,
    enableProductRecommendations
  }) => {
    const width = isMobile ? "100%" : "30%";

    return (
      <VideoPanel
        ref={videoPanelRef}
        videos={videos}
        loading={isLoading}
        onVideoStateChange={handleVideoStateChange}
        onPauseVideo={handlePauseVideo}
        onPauseAnswerAudio={handlePauseAnswerAudio}
        onPauseSlideVideo={handlePauseSlideVideo}
        width={width}
        presentationId={presentationId}
        isMobileView={isMobile}
        isPhoneView={isPhone}
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
    );
  }
);

const Home = () => {
  const params = useParams();
  const router = useRouter();
  const presentationId = params.id;
  const { data, isLoading } = useGetAllVideoQuery(presentationId, {
    refetchOnMountOrArgChange: true,
  });
  const videos = data?.data;
  // const videos = data?.data.map((video) => ({
  //   ...video,
  //   slide_video: "https://api.assets.uat.trainboost.esmagico.com/assets/videos/slide_574/master.m3u8",
  //   trainer_video: "https://api.assets.uat.trainboost.esmagico.com/assets/videos/slide_574/master.m3u8",
  // }));
  console.log("videos", videos);
  const userName = getUserDetailsFromToken()?.preferred_username;
  const assessmentId = data?.assessment_details?.[0]?.id;
  const passingScore = data?.assessment_details?.[0]?.passing_score || 100;
  const canSkipVideo = data?.hasOwnProperty("is_skippable") ? data.is_skippable : !userName?.includes("jeenaseekho");
  const enableProductRecommendations = data?.enable_product_recommendations || false;
  const videoPanelRef = useRef(null);
  const pptSectionRef = useRef(null);
  const dispatch = useDispatch();
  const { pptVideoIndex,currentVideoIndex } = useSelector((state) => state.video);
  const isPortrait = usePortraitMode();

  // Device detection — stored in a single state object so one setState = one re-render.
  // Debounced to ignore transient resizes (e.g. browser permission dialogs on mobile).
  const [windowWidth, setWindowWidth] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth : 1200
  );

  useEffect(() => {
    let timer;
    const handleResize = () => {
      clearTimeout(timer);
      timer = setTimeout(() => setWindowWidth(window.innerWidth), 300);
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timer);
    };
  }, []);

  const isPhone = windowWidth <= 956;
  const isTablet = windowWidth > 956 && windowWidth <= 1024;
  const isMobileDevice = isPhone || isTablet;
  const isLandscape = !isPortrait && isMobileDevice;
  const isOnlyVideoMode = videos?.[currentVideoIndex]?.trainer_video === null;
  const isFinalAssessmentPresent = data?.assessment_details && data.assessment_details.length > 0 && data.assessment_details[0].id ? true : false;
  const showQueryRelatedSlides = data?.presentation_query;
  const liveKitAgentEnabled = data?.interaction_mode === "pyzo_train_convo_ai" || false;
  // Shared video state for synchronization
  const [videoState, setVideoState] = useState({
    currentTime: 0,
    isPlaying: false,
    currentVideoIndex: 0,
    duration: 0,
  });

  // Separate state for PPT synchronization (only when video panel actually plays)
  const [pptSyncState, setPptSyncState] = useState({
    shouldSync: false,
    currentTime: 0,
    isPlaying: false,
  });
  const [conversationHistory, setConversationHistory] = useState([]);
  const [submitVideoProgress] = useSubmitVideoProgressMutation();
  // Handle video state changes from VideoPanel
  const handleVideoStateChange = (newState) => {
    setVideoState(newState);

    // Update PPT sync state only when video panel video actually plays
    setPptSyncState({
      shouldSync: newState.isPlaying,
      currentTime: newState.currentTime,
      isPlaying: newState.isPlaying,
    });
  };

  // Handle video pause from question panel
  const handlePauseVideo = () => {
    if (videoPanelRef.current && videoPanelRef.current.pauseVideo) {
      videoPanelRef.current.pauseVideo();
    }
  };

  // Handle pausing answer audio when video plays
  const handlePauseAnswerAudio = () => {
    // Reset Redux audio state
    dispatch(setIsPlaying({ playing: false, audioId: null }));

    // Pause all audio elements in the document
    document.querySelectorAll("audio").forEach((audio) => {
      if (!audio.paused) {
        audio.pause();
      }
    });
  };

  // Handle pausing slide video
  const handlePauseSlideVideo = () => {
    if (pptSectionRef.current && pptSectionRef.current.pauseSlideVideo) {
      pptSectionRef.current.pauseSlideVideo();
    }
  };

  // Handle video index change from PPT section
  const handleVideoIndexChange = (newIndex) => {
    dispatch(setCurrentVideoIndex(newIndex));
  };

  // Submit video progress to API
  const submitProgressToAPI = async () => {
    try {
      const progressData = getVideoProgress(presentationId);
      if (progressData && progressData.slide_data.length > 0) {
        await submitVideoProgress({
          presentation_id: parseInt(presentationId),
          slide_data: progressData.slide_data,
        });
        clearVideoProgress(presentationId);
        console.log("Video progress submitted successfully");
      }
    } catch (error) {
      console.log("Failed to submit video progress:", error);
    }
  };

  // Clear assessment progress when leaving page
  const clearAssessmentProgressOnLeave = () => {
    clearAssessmentProgress(presentationId);
  };

  // Store submit function globally for cleanup
  useEffect(() => {
    window.submitVideoProgressGlobal = submitProgressToAPI;
    return () => {
      if (window.submitVideoProgressGlobal) {
        window.submitVideoProgressGlobal();
        delete window.submitVideoProgressGlobal;
      }
      clearAssessmentProgressOnLeave();
    };
  }, [presentationId]);

  // 5-minute interval tracking
  useEffect(() => {
    const interval = setInterval(
      () => {
        submitProgressToAPI();
      },
      5 * 60 * 1000
    );

    return () => clearInterval(interval);
  }, [presentationId]);

  // Page unload/close tracking
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      submitProgressToAPI();
      clearAssessmentProgressOnLeave();
      // For some browsers, we need to set returnValue
      e.returnValue = "";
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        submitProgressToAPI();
        clearAssessmentProgressOnLeave();
      }
    };

    const handlePageHide = (e) => {
      submitProgressToAPI();
      clearAssessmentProgressOnLeave();
    };

    const handleUnload = () => {
      submitProgressToAPI();
      clearAssessmentProgressOnLeave();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("unload", handleUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("unload", handleUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [presentationId]);

  // Handle router navigation
  useEffect(() => {
    const handleRouteChange = () => {
      submitProgressToAPI();
      clearAssessmentProgressOnLeave();
    };

    // Listen for route changes
    const originalPush = router.push;
    const originalBack = router.back;
    const originalReplace = router.replace;

    router.push = (...args) => {
      handleRouteChange();
      return originalPush.apply(router, args);
    };

    router.back = (...args) => {
      handleRouteChange();
      return originalBack.apply(router, args);
    };

    router.replace = (...args) => {
      handleRouteChange();
      return originalReplace.apply(router, args);
    };

    return () => {
      router.push = originalPush;
      router.back = originalBack;
      router.replace = originalReplace;
    };
  }, [router, presentationId]);

  // Cleanup Redux video state when leaving the page
  useEffect(() => {
    return () => {
      try {
        // Reset current video index and time so that returning to the page
        // will reinitialize from API values.
        dispatch(setCurrentVideoIndex(0));
        dispatch(setCurrentVideoTime(0));
        dispatch(setIsVideoPlaying(false));
      } catch (err) {
        // ignore
      }
    };
  }, [dispatch]);

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = (e) => {
      console.log("Browser back/forward detected");
      submitProgressToAPI();
      clearAssessmentProgressOnLeave();
    };

    // Track initial history length
    const initialHistoryLength = window.history.length;

    // Listen for popstate (browser back/forward)
    window.addEventListener("popstate", handlePopState, true);

    // Periodically check if history length changed (additional safety)
    const historyCheck = setInterval(() => {
      if (window.history.length < initialHistoryLength) {
        console.log("History length decreased - likely back navigation");
        submitProgressToAPI();
        clearAssessmentProgressOnLeave();
      }
    }, 1000);

    return () => {
      window.removeEventListener("popstate", handlePopState, true);
      clearInterval(historyCheck);
    };
  }, [presentationId]);
  // Initialize current video and start time from API response when landing on page
  useEffect(() => {
    if (!data || !data.data || data.data.length === 0) return;

    try {
      const apiCurrentSlide = data.current_slide_number;
      const apiCurrentSlideDuration = data.current_slide_duration;

      // Find the index in the filtered videos list that matches the API current slide
      // const allVideos = data.data.filter((video) => video?.trainer_video && video?.trainer_video?.trim() !== "");
      const allVideos = data.data;

      const idx = allVideos.findIndex((v) => v.slide === apiCurrentSlide);

      if (idx !== -1) {
        const slideObj = allVideos[idx];

        // Decide initial start time: use apiCurrentSlideDuration but if it equals the
        // slide duration then start from 0 (apply the same equal->0 rule)
        let startTime = typeof apiCurrentSlideDuration === "number" ? apiCurrentSlideDuration : 0;

        // If video is completed, always start from 0
        if (slideObj?.is_completed) {
          startTime = 0;
        } else if (
          typeof slideObj?.duration === "number" &&
          typeof startTime === "number" &&
          Math.abs(slideObj.duration - startTime) <= 1e-6
        ) {
          startTime = 0;
        }

        dispatch(setCurrentVideoIndex(idx));
        // dispatch(setCurrentVideoTime(startTime || 0));
        // as quick fix it is set to 0 sec upper commented code is correct one
        dispatch(setCurrentVideoTime(0));

        // Auto-select assessment if video is completed and has assessments
        if (slideObj?.is_completed) {
          // Check for middle assessments (slide_assessments)
          if (slideObj?.slide_assessments && slideObj.slide_assessments.length > 0) {
            const firstAssessment = slideObj.slide_assessments[0];
            console.log("Auto-selecting middle assessment for completed video:", firstAssessment.id);
            dispatch(setSelectedAssessmentId(firstAssessment.id));
          }
          // Check if this is the last video and there's a final assessment
          else if (idx === allVideos.length - 1 && data.assessment_details && data.assessment_details.length > 0) {
            const finalAssessment = data.assessment_details[0];
            console.log("Auto-selecting final assessment for completed training:", finalAssessment.id);
            dispatch(setSelectedAssessmentId(finalAssessment.id));
          }
        }
      }
    } catch (err) {
      console.log("Failed to init current video from API data", err);
    }
  }, [data, dispatch]);

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (isLandscape && (isPhone || isTablet)) {
    // Dynamic width ratios
    const leftWidth = isPhone ? "w-[70%]" : "w-[60%]";
    const rightWidth = isPhone ? "w-[30%]" : "w-[40%]";
    const paddingX = isPhone ? "px-2" : "px-4";
    const paddingY = isPhone ? "py-2" : "py-3";
    const marginX = isPhone ? "mx-2" : "mx-4";
    const marginY = isPhone ? "mb-2" : "mb-4";
    const rightPadding = isPhone ? "px-1" : "px-3";

    return (
      <FullscreenController enableAutoFullscreen={true}>
        <div className="flex h-screen w-screen bg-page-background overflow-hidden fixed inset-0 flex-col">
          {/* Breadcrumb Navigation */}
          <div className={`${paddingX} ${paddingY} bg-page-background`}>
            <CombinedBreadCrumb data={data} />
          </div>

          {/* Main Content Area */}
          <div className={`flex flex-1 bg-white ${marginX} ${marginY} rounded-lg overflow-hidden`}>
            {/* Left Side - Slides/PPT Section */}
            <div className={`${leftWidth} overflow-hidden`}>
              <CombinedPPTSection
                ref={pptSectionRef}
                isMobile={true}
                isPhone={isPhone}
                videos={videos}
                isLoading={isLoading}
                pptVideoIndex={pptVideoIndex}
                pptSyncState={pptSyncState}
                videoState={videoState}
                data={data}
                canSkipVideo={canSkipVideo}
                presentationId={presentationId}
                onVideoIndexChange={handleVideoIndexChange}
                isOnlyVideoMode={isOnlyVideoMode}
                assessmentId={assessmentId}
                showQueryRelatedSlides={showQueryRelatedSlides}
                passingScore={passingScore}
              />
            </div>

            {/* Right Side - Video Panel */}
            <div className={`${rightWidth} bg-page-background ${rightPadding} overflow-y-auto`}>
              <CombinedVideoPanel
                isMobile={true}
                isPhone={isPhone}
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
                onVideoIndexChange={handleVideoIndexChange}
                isOnlyVideoMode={isOnlyVideoMode}
                isFinalAssessmentPresent={isFinalAssessmentPresent}
                showQueryRelatedSlides={showQueryRelatedSlides}
                liveKitAgentEnabled={liveKitAgentEnabled}
                enableProductRecommendations={enableProductRecommendations}
              />
            </div>
          </div>
        </div>
      </FullscreenController>
    );
  }

  return (
    <>
      {/* Show rotation prompt on mobile portrait mode */}
      {isPortrait && isMobileDevice && <RotationPrompt />}

      <div className="relative flex size-full h-[calc(100vh-55px)] flex-col bg-page-background overflow-x-hidden">
        <div className="layout-container flex h-full grow flex-col">
          <div className=" px-6 py-5 overflow-hidden">
            <CombinedBreadCrumb data={data} />
            <div className="flex w-full h-[calc(100%-36px)] min-w-0 bg-white py-4 px-5">
              <CombinedPPTSection
                ref={pptSectionRef}
                videos={videos}
                isLoading={isLoading}
                pptVideoIndex={pptVideoIndex}
                pptSyncState={pptSyncState}
                videoState={videoState}
                data={data}
                canSkipVideo={canSkipVideo}
                presentationId={presentationId}
                onVideoIndexChange={handleVideoIndexChange}
                isOnlyVideoMode={isOnlyVideoMode}
                assessmentId={assessmentId}
                showQueryRelatedSlides={showQueryRelatedSlides}
                passingScore={passingScore}
              />
              <CombinedVideoPanel
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
                onVideoIndexChange={handleVideoIndexChange}
                isOnlyVideoMode={isOnlyVideoMode}
                isFinalAssessmentPresent={isFinalAssessmentPresent}
                showQueryRelatedSlides={showQueryRelatedSlides}
                liveKitAgentEnabled={liveKitAgentEnabled}
                enableProductRecommendations={enableProductRecommendations}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
