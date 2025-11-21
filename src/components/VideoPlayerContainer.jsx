"use client";
import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setCurrentVideoTime, setIsVideoPlaying, setAnswerPptIndex } from "@/store/features/videoSlice";
import { updateVideoProgress } from "@/utils/videoProgress";
import { getUserDetailsFromToken } from "@/store/utils/token";
import { usePostHog } from "@/hooks/usePostHog";
import VideoPlayer from "./VideoPlayer";

const VideoPlayerContainer = forwardRef(
  (
    {
      videos = [],
      currentVideoIndex = 0,
      presentationId,
      canSkipVideo = true,
      isMobile = false,
      onVideoStateChange,
      onVideoEnd,
      onSkipBackward,
      onPauseAnswerAudio,
      className = "",
      initialVideoTime = 0,
      autoPlayEnabled = false,
      isOnlyVideoMode = false,
      showRemainingDuration = false,
    },
    ref
  ) => {
    const dispatch = useDispatch();
    const videoRef = useRef(null);
    const { capture } = usePostHog();
    const { isQuestionMode } = useSelector((state) => state.video);
    // Internal state
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [videoSettings, setVideoSettings] = useState({
      muted: false,
      volume: 1.0,
      playbackRate: 1.0,
    });

    // Desktop-specific refs
    const timeSamplesRef = useRef([]);
    const previousTimeRef = useRef(0);
    const isSeekingRef = useRef(false);
    const blockedSeekRef = useRef(false);
    const skipBackwardRef = useRef(false);
    const [isSkippingBackward, setIsSkippingBackward] = useState(false);
    const [previousTime, setPreviousTime] = useState(0);

    const currentVideo = videos?.[currentVideoIndex];

    // Helper: round seconds to 1 decimal place
    const formatSeconds = (sec) => {
      if (typeof sec !== "number") return sec;
      return Math.round(sec * 10) / 10;
    };

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
      pause: () => {
        if (videoRef.current) {
          videoRef.current.pause();
        }
      },
      play: () => {
        if (videoRef.current) {
          videoRef.current.play();
        }
      },
      pauseVideo: () => {
        if (videoRef.current) {
          videoRef.current.pause();
        }
      },
      playVideo: () => {
        if (videoRef.current) {
          videoRef.current.play();
        }
      },
      getCurrentTime: () => currentTime,
      getDuration: () => duration,
      isPaused: () => !isPlaying,
      get paused() {
        return !isPlaying;
      },
    }));

    // Reset state when video changes
    useEffect(() => {
      if (initialVideoTime > 0) {
        setCurrentTime(initialVideoTime);
        dispatch(setCurrentVideoTime(initialVideoTime));
      }
    }, [currentVideoIndex, initialVideoTime, dispatch]);

    // Add direct event listener to video element for volume changes
    useEffect(() => {
      const videoElement = videoRef.current?.el?.()?.querySelector('video');
      if (videoElement) {
        const handleDirectVolumeChange = () => {
          const newMuted = videoElement.muted;
          const newVolume = videoElement.volume;
          
          if (newMuted !== videoSettings.muted || newVolume !== videoSettings.volume) {
            setVideoSettings(prev => ({
              ...prev,
              muted: newMuted,
              volume: newVolume,
            }));
          }
        };
        
        videoElement.addEventListener('volumechange', handleDirectVolumeChange);
        return () => videoElement.removeEventListener('volumechange', handleDirectVolumeChange);
      }
    }, [videoRef.current, videoSettings.muted, videoSettings.volume]);



    const handleTimeUpdate = (e) => {
      const time = e.target.currentTime;

      // Desktop-specific time tracking
      if (!isMobile) {
        try {
          const samples = timeSamplesRef.current;
          samples.push(time);
          if (samples.length > 6) samples.shift();
          timeSamplesRef.current = samples;
        } catch (err) {
          timeSamplesRef.current = [time];
        }

        if (!isSeekingRef.current) {
          previousTimeRef.current = currentTime;
          setPreviousTime(currentTime);
        }
      }

      setCurrentTime(time);
      dispatch(setCurrentVideoTime(time));

      // Update progress for desktop
      if (!isMobile && currentVideo && !e.target.paused) {
        updateVideoProgress(presentationId, currentVideo.slide, Math.floor(time));
      }

      onVideoStateChange?.({
        currentTime: time,
        isPlaying: !e.target.paused,
        currentVideoIndex,
        duration: e.target.duration || duration,
      });
    };

    const handleSeeking = () => {
      if (!isMobile) {
        if (isSkippingBackward || skipBackwardRef.current) {
          isSeekingRef.current = true;
          return;
        }

        if (!canSkipVideo) {
          const prev = previousTimeRef.current ?? currentTime;
          blockedSeekRef.current = true;
          requestAnimationFrame(() => {
            if (videoRef.current && Math.abs(videoRef.current.currentTime - prev) > 0.01) {
              try {
                videoRef.current.currentTime = prev;
              } catch (err) {
                // ignore
              }
            }
          });
          return;
        }

        isSeekingRef.current = true;
        previousTimeRef.current = videoRef.current?.currentTime || currentTime;
        setPreviousTime(previousTimeRef.current);
      }
    };

    const handleSeeked = (e) => {
      if (!isMobile) {
        const newTime = e.target.currentTime;

        if (isSkippingBackward || skipBackwardRef.current) {
          isSeekingRef.current = false;
          previousTimeRef.current = newTime;
          setPreviousTime(newTime);
          return;
        }

        if (blockedSeekRef.current) {
          blockedSeekRef.current = false;
          previousTimeRef.current = newTime;
          setPreviousTime(newTime);
          return;
        }

        isSeekingRef.current = false;

        const samples = timeSamplesRef.current || [];
        const THRESHOLD = 0.3;
        let inferredFrom = previousTimeRef.current ?? previousTime;
        for (let i = samples.length - 1; i >= 0; i--) {
          const sample = samples[i];
          if (Math.abs(sample - newTime) > THRESHOLD) {
            inferredFrom = sample;
            break;
          }
        }

        const fromTime = inferredFrom;
        previousTimeRef.current = newTime;
        setPreviousTime(newTime);

        if (newTime > fromTime + 0.001) {
          const userDetails = getUserDetailsFromToken();
          if (currentVideo) {
            capture("video_skip", {
              user_id: userDetails?.sub,
              video_id: currentVideo.slide,
              from_time: formatSeconds(fromTime),
              to_time: formatSeconds(newTime),
            });
          }
        }
      }
    };

    const handleLoadedMetadata = (e) => {
      const newDuration = e.target.duration;
      setDuration(newDuration);

      if (initialVideoTime > 0) {
        setCurrentTime(initialVideoTime);
        dispatch(setCurrentVideoTime(initialVideoTime));
      }

      onVideoStateChange?.({
        currentTime: initialVideoTime || 0,
        isPlaying,
        currentVideoIndex,
        duration: newDuration,
      });
    };

    const handlePlay = () => {
      setIsPlaying(true);
      dispatch(setIsVideoPlaying(true));
      dispatch(setAnswerPptIndex(null));
      onPauseAnswerAudio?.();

      if (!isMobile) {
        // Set video start time for desktop tracking
      }

      const userDetails = getUserDetailsFromToken();
      if (currentVideo) {
        capture("video_play", {
          user_id: userDetails?.sub,
          module_id: presentationId,
          video_id: currentVideo.slide,
          timestamp: new Date().toISOString(),
        });
      }

      onVideoStateChange?.({
        currentTime: videoRef.current?.currentTime || currentTime,
        isPlaying: true,
        currentVideoIndex,
        duration,
      });
    };

    const handlePause = () => {
      setIsPlaying(false);
      dispatch(setIsVideoPlaying(false));

      const userDetails = getUserDetailsFromToken();
      if (currentVideo) {
        capture("video_pause", {
          user_id: userDetails?.sub,
          video_id: currentVideo.slide,
          current_time: currentTime,
          timestamp: new Date().toISOString(),
        });
      }

      onVideoStateChange?.({
        currentTime: videoRef.current?.currentTime || currentTime,
        isPlaying: false,
        currentVideoIndex,
        duration,
      });
    };

    const handleSkipBackward = (data) => {
      setIsSkippingBackward(true);
      skipBackwardRef.current = true;

      previousTimeRef.current = data.to;
      setPreviousTime(data.to);
      setCurrentTime(data.to);
      dispatch(setCurrentVideoTime(data.to));

      setTimeout(() => {
        setIsSkippingBackward(false);
        skipBackwardRef.current = false;
      }, 500);

      onSkipBackward?.(data);
    };

    const handleRateChange = (e) => {
      const newRate = e.target.playbackRate;
      if (newRate !== videoSettings.playbackRate) {
        setVideoSettings((prev) => ({
          ...prev,
          playbackRate: newRate,
        }));
      }

      // Track playback rate change event
      const userDetails = getUserDetailsFromToken();
      if (currentVideo) {
        capture("video_speed_change", {
          user_id: userDetails?.sub,
          video_id: currentVideo.slide,
          new_speed: newRate,
          timestamp: new Date().toISOString(),
        });
      }
    };

    const handleVolumeChange = (e) => {
      const newMuted = e.target.muted;
      const newVolume = e.target.volume;
      setVideoSettings({
        ...videoSettings,
        muted: newMuted,
        volume: newVolume,
      });
    };

    if ((isOnlyVideoMode && !currentVideo?.slide_video) || (!isOnlyVideoMode && !currentVideo?.trainer_video)) {
      return (
        <div className={`w-full h-full bg-black flex items-center justify-center ${className}`}>
          <div className="text-white">No video available</div>
        </div>
      );
    }

    return (
      <VideoPlayer
        key={`trainer-video-${currentVideoIndex}-${currentVideo.trainer_video}`}
        ref={videoRef}
        src={isOnlyVideoMode ? currentVideo.slide_video : currentVideo.trainer_video}
        poster={currentVideo.thumbnail}
        className={className}
        canSkipVideo={canSkipVideo}
        autoPlay={autoPlayEnabled}
        controls={true}
        disablePictureInPicture={true}
        muted={videoSettings.muted}
        volume={videoSettings.volume}
        playbackRate={videoSettings.playbackRate}
        currentTime={initialVideoTime}
        showRemainingDuration={showRemainingDuration}
        onTimeUpdate={handleTimeUpdate}
        onSeeking={handleSeeking}
        onSeeked={handleSeeked}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={onVideoEnd}
        onVolumeChange={handleVolumeChange}
        onRateChange={handleRateChange}
        onSkipBackward={handleSkipBackward}
        onCanPlay={(e) => {
          if (!isMobile) {
            console.log("Trainer video can play");
          }
        }}
        onLoadStart={() => {
          if (!isMobile) {
            console.log("Trainer video loading started...");
          }
        }}
      />
    );
  }
);

VideoPlayerContainer.displayName = "VideoPlayerContainer";

export default VideoPlayerContainer;
