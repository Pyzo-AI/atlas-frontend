"use client";
import React, { useState, useRef, useEffect } from "react";
import VideoPanel from "@/components/sections/VideoPanel";
import PPTSection from "@/components/sections/PPTSection";
import FloatingChatbot from "@/components/chat/FloatingChatbot";
import { useGetAllVideoQuery, useSubmitVideoProgressMutation } from "@/store/api/questionsApi";
import { useDispatch, useSelector } from "react-redux";
import { setIsPlaying } from "@/store/features/videoSlice";
import { usePathname, useParams, useRouter } from "next/navigation";
import BreadCrumb from "@/components/common/BreadCrumb";
import PageSkeleton from "@/components/common/PageSkeleton";
import { usePortraitMode } from "@/hooks/usePortraitMode";
import FullscreenController from "@/components/ui/FullscreenController";
import { getUserDetailsFromToken } from "@/store/utils/token";
import { getVideoProgress, clearVideoProgress } from "@/utils/videoProgress";

// Portrait Mode Rotation Prompt Component
const RotationPrompt = () => {
  return (
    <div className="absolute top-16 inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="text-center text-white px-6">
        <div className="mb-6">
          <svg
            className="w-16 h-16 mx-auto mb-4 animate-bounce"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M16.48 2.52c3.27 1.55 5.61 4.72 5.97 8.48h1.5C23.44 4.84 18.29 0 12 0l-.66.03 3.81 3.81 1.33-1.32zm-6.25-.77c-.59-.59-1.54-.59-2.12 0L1.75 8.11c-.59.59-.59 1.54 0 2.12l6.36 6.36c.59.59 1.54.59 2.12 0L16.59 10.23c.59-.59.59-1.54 0-2.12L10.23 1.75zm4.72 14.72h1.5c-.36 3.76-2.7 6.93-5.97 8.48L9.15 23.38l1.33-1.32-3.81-3.81L7.33 24c6.29-.44 11.44-5.28 11.95-11.53z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold mb-2">
          Better Experience Awaits!
        </h2>
        <p className="text-gray-300 mb-4">
          Turn on auto-rotate and rotate your device to landscape mode. This web
          app works best in Chrome browser.
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

const Home = () => {
  const params = useParams();
  const router = useRouter();
  const presentationId = params.id;
  const { data, isLoading } = useGetAllVideoQuery(presentationId, {
    refetchOnMountOrArgChange: true,
  });
  const videos = data?.data?.filter(
    (video) => video?.trainer_video && video?.trainer_video?.trim() !== ""
  );
  const userName = getUserDetailsFromToken()?.preferred_username;
  console.log(userName, "userName");
  // Check if video can be skipped based on API response
  //
  const canSkipVideo = data?.hasOwnProperty("is_skippable")
    ? data.is_skippable
    : !userName?.includes("jeenaseekho");
  
  const pathname = usePathname();
  const videoPanelRef = useRef(null);
  const dispatch = useDispatch();
  const { pptVideoIndex } = useSelector((state) => state.video);
  const isPortrait = usePortraitMode();

  // Device detection for different layouts
  const isPhone = typeof window !== "undefined" && window.innerWidth <= 956;
  const isTablet =
    typeof window !== "undefined" &&
    window.innerWidth > 956 &&
    window.innerWidth <= 1024;
  const isMobileDevice = isPhone || isTablet;
  const isLandscape = !isPortrait && isMobileDevice;

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

  // Submit video progress to API
  const submitProgressToAPI = async () => {
    try {
      const progressData = getVideoProgress(presentationId);
      if (progressData && progressData.slide_data.length > 0) {
        await submitVideoProgress({
          presentation_id: parseInt(presentationId),
          slide_data: progressData.slide_data
        });
        clearVideoProgress(presentationId);
        console.log('Video progress submitted successfully');
      }
    } catch (error) {
      console.error('Failed to submit video progress:', error);
    }
  };

  // Store submit function globally for cleanup
  useEffect(() => {
    window.submitVideoProgressGlobal = submitProgressToAPI;
    return () => {
      if (window.submitVideoProgressGlobal) {
        window.submitVideoProgressGlobal();
        delete window.submitVideoProgressGlobal;
      }
    };
  }, [presentationId]);

  // 5-minute interval tracking
  useEffect(() => {
    const interval = setInterval(() => {
      submitProgressToAPI();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [presentationId]);

  // Page unload/close tracking
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      submitProgressToAPI();
      // For some browsers, we need to set returnValue
      e.returnValue = '';
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        submitProgressToAPI();
      }
    };

    const handlePageHide = (e) => {
      submitProgressToAPI();
    };

    const handleUnload = () => {
      submitProgressToAPI();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('unload', handleUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('unload', handleUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [presentationId]);

  // Handle router navigation
  useEffect(() => {
    const handleRouteChange = () => {
      submitProgressToAPI();
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

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = (e) => {
      console.log('Browser back/forward detected');
      submitProgressToAPI();
    };

    // Track initial history length
    const initialHistoryLength = window.history.length;
    
    // Listen for popstate (browser back/forward)
    window.addEventListener('popstate', handlePopState, true);
    
    // Periodically check if history length changed (additional safety)
    const historyCheck = setInterval(() => {
      if (window.history.length < initialHistoryLength) {
        console.log('History length decreased - likely back navigation');
        submitProgressToAPI();
      }
    }, 1000);

    return () => {
      window.removeEventListener('popstate', handlePopState, true);
      clearInterval(historyCheck);
    };
  }, [presentationId]);

  if (isLoading) {
    return <PageSkeleton />;
  }

  // Phone landscape layout - 70/30 split for optimal phone experience
  if (isLandscape && isPhone) {
    return (
      <FullscreenController enableAutoFullscreen={true}>
        <div className="flex h-screen w-screen bg-[#F9F9F9] overflow-hidden fixed inset-0 flex-col">
          {/* Breadcrumb Navigation */}
          <div className="px-2 py-2 bg-[#F9F9F9]">
            <BreadCrumb
              paths={[
                { path: "/", label: "All Course" },
                {
                  path: "/lectures/123",
                  label: data?.presentation_name || "Corporate Finance",
                },
              ]}
            />
          </div>

          {/* Main Content Area - Phone optimized */}
          <div className="flex flex-1 bg-white mx-2 mb-2 rounded-lg overflow-hidden">
            {/* Left Side - Slides/PPT Section (70% width for phones) */}
            <div className="w-[70%] overflow-hidden">
              <PPTSection
                videos={videos}
                loading={isLoading}
                currentVideoIndex={pptVideoIndex}
                currentVideoTime={pptSyncState.currentTime}
                isVideoPlaying={pptSyncState.isPlaying}
                videoDuration={videoState.duration}
                width="100%"
                title={data?.presentation_name || "Corporate Finance"}
                author={data?.presentation_author || "Giri Prathap"}
                isMobileView={true}
                isPhoneView={true}
                canSkipVideo={canSkipVideo}
              />
            </div>

            {/* Right Side - Video Panel (30% width for phones) */}
            <div className="w-[30%] bg-[#F9F9F9] px-1 overflow-hidden">
              <VideoPanel
                ref={videoPanelRef}
                videos={videos}
                loading={isLoading}
                onVideoStateChange={handleVideoStateChange}
                onPauseVideo={handlePauseVideo}
                onPauseAnswerAudio={handlePauseAnswerAudio}
                width="100%"
                presentationId={presentationId}
                isMobileView={true}
                isPhoneView={true}
                agentId={data?.presentation_agent_id}
                avatarUrl={data?.presentation_trainer_image}
                conversationHistory={conversationHistory}
                setConversationHistory={setConversationHistory}
                isPresentationQuizPassed={
                  data?.is_presentation_quiz_passed || false
                }
                canSkipVideo={canSkipVideo}
              />
            </div>
          </div>
        </div>
      </FullscreenController>
    );
  }

  // Tablet landscape layout - 60/40 split for tablets
  if (isLandscape && isTablet) {
    return (
      <FullscreenController enableAutoFullscreen={true}>
        <div className="flex h-screen w-screen bg-[#F9F9F9] overflow-hidden fixed inset-0 flex-col">
          {/* Breadcrumb Navigation */}
          <div className="px-4 py-3 bg-[#F9F9F9]">
            <BreadCrumb
              paths={[
                { path: "/", label: "All Course" },
                {
                  path: "/lectures/123",
                  label: data?.presentation_name || "Corporate Finance",
                },
              ]}
            />
          </div>

          {/* Main Content Area */}
          <div className="flex flex-1 bg-white mx-4 mb-4 rounded-lg overflow-hidden">
            {/* Left Side - Slides/PPT Section (60% width for tablets) */}
            <div className="w-[60%] overflow-hidden">
              <PPTSection
                videos={videos}
                loading={isLoading}
                currentVideoIndex={pptVideoIndex}
                currentVideoTime={pptSyncState.currentTime}
                isVideoPlaying={pptSyncState.isPlaying}
                videoDuration={videoState.duration}
                width="100%"
                title={data?.presentation_name || "Corporate Finance"}
                author={data?.presentation_author || "Giri Prathap"}
                isMobileView={true}
                isPhoneView={false}
                canSkipVideo={canSkipVideo}
              />
            </div>

            {/* Right Side - Video Panel (40% width for tablets) */}
            <div className="w-[40%] bg-[#F9F9F9] px-3 overflow-hidden">
              <VideoPanel
                ref={videoPanelRef}
                videos={videos}
                loading={isLoading}
                onVideoStateChange={handleVideoStateChange}
                onPauseVideo={handlePauseVideo}
                onPauseAnswerAudio={handlePauseAnswerAudio}
                width="100%"
                presentationId={presentationId}
                isMobileView={true}
                isPhoneView={false}
                agentId={data?.presentation_agent_id}
                avatarUrl={data?.presentation_trainer_image}
                conversationHistory={conversationHistory}
                setConversationHistory={setConversationHistory}
                isPresentationQuizPassed={
                  data?.is_presentation_quiz_passed || false
                }
                canSkipVideo={canSkipVideo}
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
            <BreadCrumb
              paths={[
                { path: "/", label: "All Courses" },
                {
                  path: "/lectures/123",
                  label: data?.presentation_name || "Untitled Presentation",
                },
              ]}
            />

            <div className="flex w-full h-[calc(100%-36px)] min-w-0 bg-white py-4 px-5">
              <PPTSection
                videos={videos}
                loading={isLoading}
                currentVideoIndex={pptVideoIndex}
                currentVideoTime={pptSyncState.currentTime}
                isVideoPlaying={pptSyncState.isPlaying}
                videoDuration={videoState.duration}
                width="70%"
                title={data?.presentation_name || "Untitled Presentation"}
                author={data?.presentation_author || "Unknown"}
                canSkipVideo={canSkipVideo}
              />
              <VideoPanel
                ref={videoPanelRef}
                videos={videos}
                loading={isLoading}
                onVideoStateChange={handleVideoStateChange}
                onPauseVideo={handlePauseVideo}
                onPauseAnswerAudio={handlePauseAnswerAudio}
                width="30%"
                presentationId={presentationId}
                agentId={data?.presentation_agent_id}
                avatarUrl={data?.presentation_trainer_image}
                conversationHistory={conversationHistory}
                setConversationHistory={setConversationHistory}
                isPresentationQuizPassed={
                  data?.is_presentation_quiz_passed || false
                }
                canSkipVideo={canSkipVideo}
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
