"use client";
import React, { useState, useRef, useEffect } from "react";
import VideoPanel from "@/components/sections/VideoPanel";
import PPTSection from "@/components/sections/PPTSection";
import FloatingChatbot from "@/components/chat/FloatingChatbot";
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

// Portrait Mode Rotation Prompt Component
const RotationPrompt = () => {
  return (
    <div className="absolute top-16 inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="text-center text-white px-6">
        <div className="mb-6">
          <svg className="w-16 h-16 mx-auto mb-4 animate-bounce" fill="currentColor" viewBox="0 0 24 24">
            <path d="M16.48 2.52c3.27 1.55 5.61 4.72 5.97 8.48h1.5C23.44 4.84 18.29 0 12 0l-.66.03 3.81 3.81 1.33-1.32zm-6.25-.77c-.59-.59-1.54-.59-2.12 0L1.75 8.11c-.59.59-.59 1.54 0 2.12l6.36 6.36c.59.59 1.54.59 2.12 0L16.59 10.23c.59-.59.59-1.54 0-2.12L10.23 1.75zm4.72 14.72h1.5c-.36 3.76-2.7 6.93-5.97 8.48L9.15 23.38l1.33-1.32-3.81-3.81L7.33 24c6.29-.44 11.44-5.28 11.95-11.53z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold mb-2">Better Experience Awaits!</h2>
        <p className="text-gray-300 mb-4">
          Turn on auto-rotate and rotate your device to landscape mode. This web app works best in Chrome browser.
        </p>
        <div className="flex items-center justify-center space-x-2">
          <div className="w-8 h-12 border-2 border-white rounded-sm"></div>
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M16.48 2.52c3.27 1.55 5.61 4.72 5.97 8.48h1.5C23.44 4.84 18.29 0 12 0l-.66.03 3.81 3.81 1.33-1.32z" />
          </svg>
          <div className="w-12 h-8 border-2 border-white rounded-sm"></div>
        </div>
      </div>
    </div>
  );
};

// Combined components moved outside to prevent re-creation on every render
const CombinedBreadCrumb = React.memo(({ data }) => {
  return (
    <BreadCrumb
      paths={[
        { path: "/", label: "All Courses" },
        {
          path: "/lectures/123",
          label: data?.presentation_name || "Untitled Presentation",
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
    assessmentId
  }, ref) => {
    const width = isMobile ? "100%" : "70%";

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
        title={data?.presentation_name || "Untitled Presentation"}
        author={data?.presentation_author || "Unknown"}
        isMobileView={isMobile}
        isPhoneView={isPhone}
        canSkipVideo={canSkipVideo}
        assessmentDetails={data?.assessment_details || []}
        presentationId={presentationId}
        onVideoIndexChange={onVideoIndexChange}
        isOnlyVideoMode={isOnlyVideoMode}
        assessmentId={assessmentId}
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
    isFinalAssessmentPresent
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
  const userName = getUserDetailsFromToken()?.preferred_username;
  const assessmentId = data?.assessment_details?.[0]?.id;

  const canSkipVideo = data?.hasOwnProperty("is_skippable") ? data.is_skippable : !userName?.includes("jeenaseekho");

  const pathname = usePathname();
  const videoPanelRef = useRef(null);
  const pptSectionRef = useRef(null);
  const dispatch = useDispatch();
  const { pptVideoIndex,currentVideoIndex } = useSelector((state) => state.video);
  const isPortrait = usePortraitMode();

  // Device detection for different layouts
  const isPhone = typeof window !== "undefined" && window.innerWidth <= 956;
  const isTablet = typeof window !== "undefined" && window.innerWidth > 956 && window.innerWidth <= 1024;
  const isMobileDevice = isPhone || isTablet;
  const isLandscape = !isPortrait && isMobileDevice;
  const isOnlyVideoMode = videos?.[currentVideoIndex]?.trainer_video === null;
  const isFinalAssessmentPresent = data?.assessment_details && data.assessment_details.length > 0 && data.assessment_details[0].id ? true : false;

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
      console.error("Failed to submit video progress:", error);
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
        dispatch(setCurrentVideoTime(startTime || 0));

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
      console.error("Failed to init current video from API data", err);
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
        <div className="flex h-screen w-screen bg-[#F9F9F9] overflow-hidden fixed inset-0 flex-col">
          {/* Breadcrumb Navigation */}
          <div className={`${paddingX} ${paddingY} bg-[#F9F9F9]`}>
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
              />
            </div>

            {/* Right Side - Video Panel */}
            <div className={`${rightWidth} bg-[#F9F9F9] ${rightPadding} overflow-hidden`}>
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

      <div className="relative flex size-full h-[calc(100vh-55px)] flex-col bg-[#F9F9F9] overflow-x-hidden">
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
              />
            </div>
          </div>
        </div>

        {/* Floating Chatbot */}
        {/* <FloatingChatbot 
          onPauseVideo={handlePauseVideo} 
          videos={videos} 
          presentationId={presentationId}
        /> */}
      </div>
    </>
  );
};

export default Home;
