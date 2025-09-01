"use client";
import React, { useState, useRef, useEffect } from "react";
import VideoPanel from "@/components/sections/VideoPanel";
import PPTSection from "@/components/sections/PPTSection";
import FloatingChatbot from "@/components/chat/FloatingChatbot";
import { useGetAllVideoQuery } from "@/store/api/questionsApi";
import { useDispatch, useSelector } from "react-redux";
import { setIsPlaying } from "@/store/features/videoSlice";
import { usePathname, useParams } from "next/navigation";

const Home = () => {
  const params = useParams();
  const presentationId = params.id;
  const { data, isLoading } = useGetAllVideoQuery(presentationId);
  const videos = data?.data?.filter(
    (video) => video?.trainer_video && video?.trainer_video?.trim() !== ""
  );
  const pathname = usePathname();
  const videoPanelRef = useRef(null);
  const dispatch = useDispatch();
  const { pptVideoIndex } = useSelector((state) => state.video);

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

  return (
    <div className="relative flex size-full h-[calc(100vh-55px)] flex-col bg-[#F9F9F9] overflow-x-hidden">
      <div className="layout-container flex h-full grow flex-col">
        <div className="flex flex-1 px-6 py-5 overflow-hidden">
          <div className="flex w-full h-full min-w-0 bg-white py-4 px-5">
            <PPTSection
              videos={videos}
              loading={isLoading}
              currentVideoIndex={pptVideoIndex}
              currentVideoTime={pptSyncState.currentTime}
              isVideoPlaying={pptSyncState.isPlaying}
              videoDuration={videoState.duration}
              width="70%"
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
  );
};

export default Home;
