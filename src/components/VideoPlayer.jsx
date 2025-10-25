"use client";
import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";

const VideoPlayer = forwardRef(
  (
    {
      src,
      poster,
      width = 640,
      height = 360,
      autoPlay = false,
      controls = true,
      canSkipVideo = true,
      onTimeUpdate,
      onPlay,
      onPause,
      onEnded,
      onSeeking,
      onSeeked,
      onLoadedMetadata,
      onCanPlay,
      onLoadStart,
      onVolumeChange,
      onRateChange,
      onSkipBackward,
      className = "",
      style = {},
      muted = false,
      volume = 1.0,
      playbackRate = 1.0,
      currentTime = 0,
      disablePictureInPicture = true,
      controlsList = "nodownload",
    },
    ref
  ) => {
    const videoRef = useRef(null);
    const playerRef = useRef(null);
    const [isClient, setIsClient] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const timeUpdateRef = useRef(null);
    const seekingRef = useRef(false);

    useEffect(() => {
      setIsClient(true);
    }, []);

    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
      play: () => {
        if (playerRef.current) {
          playerRef.current.play();
        }
      },
      pause: () => {
        if (playerRef.current) {
          playerRef.current.pause();
        }
      },
      get currentTime() {
        return playerRef.current ? playerRef.current.currentTime() : 0;
      },
      set currentTime(time) {
        if (playerRef.current) {
          playerRef.current.currentTime(time);
        }
      },
      get duration() {
        return playerRef.current ? playerRef.current.duration() : 0;
      },
      get paused() {
        return playerRef.current ? playerRef.current.paused() : true;
      },
      get muted() {
        return playerRef.current ? playerRef.current.muted() : false;
      },
      set muted(value) {
        if (playerRef.current) {
          playerRef.current.muted(value);
        }
      },
      get volume() {
        return playerRef.current ? playerRef.current.volume() : 1;
      },
      set volume(value) {
        if (playerRef.current) {
          playerRef.current.volume(value);
        }
      },
      get playbackRate() {
        return playerRef.current ? playerRef.current.playbackRate() : 1;
      },
      set playbackRate(value) {
        if (playerRef.current) {
          playerRef.current.playbackRate(value);
        }
      },
      load: () => {
        if (playerRef.current) {
          playerRef.current.src({ src, type: "video/mp4" });
        }
      },
    }));

    useEffect(() => {
      if (!isClient || !videoRef.current) return;

      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }

      playerRef.current = videojs(videoRef.current, {
        controls: controls,
        responsive: true,
        fluid: true,
        sources: [
          {
            src,
            type: "video/mp4",
          },
        ],
        preload: "auto",
        poster: poster,
        muted: muted,
        autoplay: autoPlay,
        playbackRates: [0.5, 1, 1.5, 2],
        disablePictureInPicture: true,
        fullscreen: {
          options: {
            navigationUI: "hide",
          },
        },
        // Ensure playback rate menu is always available
        breakpoints: {
          tiny: 300,
          xsmall: 400,
          small: 500,
          medium: 600,
          large: 700,
          xlarge: 800,
          huge: 900,
        },
        // Custom responsive configuration
        responsive: {
          breakpoints: {
            tiny: {
              playbackRates: [0.5, 1, 1.5, 2],
            },
            small: {
              playbackRates: [0.5, 1, 1.5, 2],
            },
          },
        },
      });

      // Apply initial settings
      if (playerRef.current) {
        playerRef.current.volume(volume);
        playerRef.current.playbackRate(playbackRate);
        playerRef.current.muted(muted);
      }

      playerRef.current.ready(() => {
        // Disable fullscreen functionality
        const fullscreenToggle = playerRef.current.controlBar.fullscreenToggle;
        if (fullscreenToggle) {
          fullscreenToggle.hide();
        }

        // Disable picture-in-picture
        const pipToggle = playerRef.current.controlBar.pictureInPictureToggle;
        if (pipToggle) {
          pipToggle.hide();
        }

        // Disable double-click to fullscreen
        playerRef.current.off("dblclick");
        playerRef.current.on("dblclick", (e) => {
          e.preventDefault();
          e.stopPropagation();
        });

        // Prevent volume/mute control clicks from bubbling to parent
        const volumePanel = playerRef.current.controlBar.volumePanel;
        if (volumePanel) {
          const volumePanelEl = volumePanel.el();
          if (volumePanelEl) {
            volumePanelEl.addEventListener('click', (e) => {
              e.stopPropagation();
            }, false);
          }
        }

        // Prevent play button clicks from bubbling to parent
        const playToggle = playerRef.current.controlBar.playToggle;
        if (playToggle) {
          const playToggleEl = playToggle.el();
          if (playToggleEl) {
            playToggleEl.addEventListener('click', (e) => {
              e.stopPropagation();
            }, false);
          }
        }

        // Customize playback rate menu to look more like default HTML video
        const playbackRateMenuButton = playerRef.current.controlBar.playbackRateMenuButton;
        if (playbackRateMenuButton) {
          playbackRateMenuButton.show();

          // Force visibility on all screen sizes
          playbackRateMenuButton.removeClass("vjs-hidden");

          // Add custom styling for the playback rate menu
          const menuButton = playbackRateMenuButton.el();
          if (menuButton) {
            menuButton.style.fontSize = "13px";
            menuButton.style.fontFamily = "inherit";
            menuButton.style.display = "block";

            // Ensure it's always visible on mobile
            menuButton.classList.remove("vjs-hidden");
            menuButton.setAttribute("data-mobile-visible", "true");

            // Prevent playback rate menu clicks from bubbling to parent
            menuButton.addEventListener('click', (e) => {
              e.stopPropagation();
            }, false);
          }
        }

        // Ensure progress control is always visible
        const progressControl = playerRef.current.controlBar.progressControl;
        if (progressControl) {
          progressControl.show();

          // Only disable interactions if seeking is not allowed
          if (!canSkipVideo) {
            const progressControlEl = progressControl.el();
            const progressHolder = progressControlEl.querySelector(".vjs-progress-holder");
            const playProgressBar = progressControlEl.querySelector(".vjs-play-progress");
            const loadProgressBar = progressControlEl.querySelector(".vjs-load-progress");

            // Add class for CSS targeting
            progressControlEl.classList.add("no-seek");

            // Comprehensive pointer events blocking
            progressControlEl.style.pointerEvents = "none";
            progressControlEl.style.cursor = "default";
            progressControlEl.style.touchAction = "none";

            if (progressHolder) {
              progressHolder.style.pointerEvents = "none";
              progressHolder.style.cursor = "default";
              progressHolder.style.touchAction = "none";
            }

            // Block all child elements
            if (playProgressBar) {
              playProgressBar.style.pointerEvents = "none";
              playProgressBar.style.touchAction = "none";
            }
            if (loadProgressBar) {
              loadProgressBar.style.pointerEvents = "none";
              loadProgressBar.style.touchAction = "none";
            }

            // Remove all event listeners
            progressControl.off("click");
            progressControl.off("mousedown");
            progressControl.off("touchstart");
            progressControl.off("mouseup");
            progressControl.off("mousemove");
            progressControl.off("touchend");
            progressControl.off("touchmove");

            // Comprehensive event prevention for iOS Safari
            const preventSeekEvents = (e) => {
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation();
              return false;
            };

            // Add event listeners with capture for iOS compatibility
            progressControlEl.addEventListener('click', preventSeekEvents, true);
            progressControlEl.addEventListener('mousedown', preventSeekEvents, true);
            progressControlEl.addEventListener('mouseup', preventSeekEvents, true);
            progressControlEl.addEventListener('touchstart', preventSeekEvents, true);
            progressControlEl.addEventListener('touchend', preventSeekEvents, true);
            progressControlEl.addEventListener('touchmove', preventSeekEvents, true);

            // Also prevent on child elements for iOS
            if (progressHolder) {
              progressHolder.addEventListener('click', preventSeekEvents, true);
              progressHolder.addEventListener('mousedown', preventSeekEvents, true);
              progressHolder.addEventListener('touchstart', preventSeekEvents, true);
              progressHolder.addEventListener('touchend', preventSeekEvents, true);
              progressHolder.addEventListener('touchmove', preventSeekEvents, true);
            }

            // Add event listeners to the CSS overlay elements for iOS Safari
            setTimeout(() => {
              const overlayEl = progressControlEl.querySelector('::before');
              const holderOverlayEl = progressHolder?.querySelector('::before');

              // Since we can't directly access pseudo-elements, we'll add a real overlay
              const createOverlay = (parent) => {
                const overlay = document.createElement('div');
                overlay.style.position = 'absolute';
                overlay.style.top = '-10px';
                overlay.style.left = '0';
                overlay.style.right = '0';
                overlay.style.bottom = '-10px';
                overlay.style.zIndex = '999999';
                overlay.style.background = 'transparent';
                overlay.style.pointerEvents = 'auto';
                overlay.style.touchAction = 'none';

                overlay.addEventListener('click', preventSeekEvents, true);
                overlay.addEventListener('mousedown', preventSeekEvents, true);
                overlay.addEventListener('touchstart', preventSeekEvents, true);
                overlay.addEventListener('touchend', preventSeekEvents, true);
                overlay.addEventListener('touchmove', preventSeekEvents, true);

                parent.style.position = 'relative';
                parent.appendChild(overlay);
                return overlay;
              };

              // Create overlays for better iOS Safari blocking
              if (progressControlEl && !progressControlEl.querySelector('.seek-block-overlay')) {
                const overlay = createOverlay(progressControlEl);
                overlay.classList.add('seek-block-overlay');
              }
            }, 100);
          }
        }

        // Handle keyboard shortcuts
        if (!canSkipVideo) {

          // Disable keyboard shortcuts for seeking (but allow J for skip backward)
          playerRef.current.off("keydown");
          playerRef.current.on("keydown", (e) => {
            // Allow J key (74) for skip backward, prevent other seeking shortcuts
            if (e.which === 37 || e.which === 39 || e.which === 76) {
              // Left, Right, L keys
              e.preventDefault();
              e.stopPropagation();
            } else if (e.which === 74) {
              // J key - allow for skip backward
              const currentTime = playerRef.current.currentTime();
              const newTime = Math.max(0, currentTime - 5);
              const wasPlaying = !playerRef.current.paused();

              console.log("J key skip backward:", { from: currentTime, to: newTime, wasPlaying });

              if (onSkipBackward) {
                onSkipBackward({ from: currentTime, to: newTime, wasPlaying });
              }

              // Add a small delay to ensure the callback is processed first
              setTimeout(() => {
                console.log("Setting video time to:", newTime);
                playerRef.current.currentTime(newTime);

                // Resume playback if it was playing before
                if (wasPlaying) {
                  console.log("Resuming playback after J key skip");
                  playerRef.current.play();
                }
              }, 50);

              e.preventDefault();
              e.stopPropagation();
            }
          });
        }

        // Add custom skip backward button only when seeking is restricted
        if (!canSkipVideo) {
          const Button = videojs.getComponent("Button");

          class SkipBackwardButton extends Button {
            constructor(player, options) {
              super(player, options);
              this.controlText("Skip backward 5 seconds");
            }

            createEl() {
              return super.createEl("button", {
                className: "vjs-skip-backward vjs-control vjs-button",
                innerHTML: `
                  <span class="skip-backward-content">
                    <span class="skip-arrows-custom">◀◀</span>
                    <span class="skip-time">5</span>
                  </span>
                `,
              });
            }

            handleClick() {
              const currentTime = this.player().currentTime();
              const newTime = Math.max(0, currentTime - 5);
              const wasPlaying = !this.player().paused();

              // Skip backward button clicked

              // Call the callback if provided
              if (onSkipBackward) {
                onSkipBackward({ from: currentTime, to: newTime, wasPlaying });
              }

              // Add a small delay to ensure the callback is processed first
              setTimeout(() => {
                console.log("Setting video time to:", newTime);
                this.player().currentTime(newTime);

                // Resume playback if it was playing before
                if (wasPlaying) {
                  console.log("Resuming playback after skip");
                  this.player().play();
                }
              }, 50);
            }
          }

          videojs.registerComponent("SkipBackwardButton", SkipBackwardButton);

          const skipBackward = new SkipBackwardButton(playerRef.current, {});
          playerRef.current.controlBar.addChild(skipBackward, {}, 2);
        }

        // Add mobile double-tap functionality only when seeking is restricted
        if (!canSkipVideo) {
          const videoElement = playerRef.current.el();
          let tapCount = 0;
          let tapTimer = null;

          const showSkipAnimation = () => {
            const overlay = document.createElement("div");
            overlay.className = "skip-back-overlay";
            overlay.innerHTML = `
          <div class="skip-back-animation">
            <div class="skip-arrows">
              <span>◀◀</span>
              <span>◀◀</span>
            </div>
            <div class="skip-text">-5s</div>
          </div>
        `;
            videoElement.appendChild(overlay);

            setTimeout(() => {
              if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
              }
            }, 1000);
          };

          const handleVideoTap = (e) => {
            const rect = videoElement.getBoundingClientRect();
            const touch = e.touches[0] || e.changedTouches[0];
            const x = touch.clientX - rect.left;
            const videoWidth = rect.width;

            if (x < videoWidth / 2) {
              tapCount++;
              if (tapTimer) {
                clearTimeout(tapTimer);
              }

              tapTimer = setTimeout(() => {
                if (tapCount >= 2) {
                  const currentTime = playerRef.current.currentTime();
                  const newTime = Math.max(0, currentTime - 5);
                  const wasPlaying = !playerRef.current.paused();

                  console.log("Mobile double-tap skip backward:", { from: currentTime, to: newTime, wasPlaying });

                  // Call the callback if provided
                  if (onSkipBackward) {
                    onSkipBackward({ from: currentTime, to: newTime, wasPlaying });
                  }

                  // Add a small delay to ensure the callback is processed first
                  setTimeout(() => {
                    console.log("Setting video time to:", newTime);
                    playerRef.current.currentTime(newTime);

                    // Resume playback if it was playing before
                    if (wasPlaying) {
                      console.log("Resuming playback after mobile skip");
                      playerRef.current.play();
                    }
                  }, 50);

                  showSkipAnimation();
                }
                tapCount = 0;
              }, 300);

              e.preventDefault();
              e.stopPropagation();
            }
          };

          videoElement.addEventListener("touchend", handleVideoTap, { passive: false });
        }
      });

      // Event listeners
      playerRef.current.on("loadedmetadata", () => {
        const dur = playerRef.current.duration();
        setDuration(dur);

        // Set initial time if provided
        if (currentTime > 0) {
          playerRef.current.currentTime(currentTime);
        }

        if (onLoadedMetadata) {
          onLoadedMetadata({
            target: {
              duration: dur,
              currentTime: playerRef.current.currentTime(),
            },
          });
        }
      });

      playerRef.current.on("canplay", () => {
        if (onCanPlay) {
          onCanPlay({
            target: {
              duration: playerRef.current.duration(),
              currentTime: playerRef.current.currentTime(),
            },
          });
        }
      });

      playerRef.current.on("loadstart", () => {
        if (onLoadStart) {
          onLoadStart();
        }
      });

      playerRef.current.on("timeupdate", () => {
        const time = playerRef.current.currentTime();
        const dur = playerRef.current.duration();

        // Track previous time for seek prevention
        if (!seekingRef.current) {
          playerRef.current.previousTime = time;
        }

        if (onTimeUpdate) {
          onTimeUpdate({
            target: {
              currentTime: time,
              duration: dur,
              paused: playerRef.current.paused(),
            },
          });
        }
      });

      playerRef.current.on("seeking", () => {
        seekingRef.current = true;

        // Prevent seeking if canSkipVideo is false (iOS Safari specific)
        if (!canSkipVideo) {
          const currentTime = playerRef.current.currentTime();
          const previousTime = playerRef.current.previousTime || 0;

          // Restore to previous time to block the seek
          setTimeout(() => {
            if (playerRef.current && Math.abs(playerRef.current.currentTime() - currentTime) > 0.1) {
              playerRef.current.currentTime(previousTime);
            }
          }, 0);
        }

        if (onSeeking) {
          onSeeking();
        }
      });

      playerRef.current.on("seeked", () => {
        seekingRef.current = false;
        if (onSeeked) {
          onSeeked({
            target: {
              currentTime: playerRef.current.currentTime(),
            },
          });
        }
      });

      playerRef.current.on("play", () => {
        setIsPlaying(true);
        if (onPlay) {
          onPlay();
        }
      });

      playerRef.current.on("pause", () => {
        setIsPlaying(false);
        if (onPause) {
          onPause();
        }
      });

      playerRef.current.on("ended", () => {
        setIsPlaying(false);
        if (onEnded) {
          onEnded();
        }
      });

      playerRef.current.on("volumechange", () => {
        if (onVolumeChange) {
          onVolumeChange({
            target: {
              muted: playerRef.current.muted(),
              volume: playerRef.current.volume(),
            },
          });
        }
      });

      playerRef.current.on("ratechange", () => {
        if (onRateChange) {
          onRateChange({
            target: {
              playbackRate: playerRef.current.playbackRate(),
            },
          });
        }
      });

      // Additional iOS Safari seek prevention
      if (!canSkipVideo) {
        const videoElement = playerRef.current.el().querySelector('video');
        if (videoElement) {
          let lastValidTime = 0;

          const preventSeekOnVideo = () => {
            if (!seekingRef.current) {
              lastValidTime = videoElement.currentTime;
            }
          };

          const restoreTimeOnSeek = () => {
            if (seekingRef.current && Math.abs(videoElement.currentTime - lastValidTime) > 1) {
              videoElement.currentTime = lastValidTime;
            }
          };

          videoElement.addEventListener('timeupdate', preventSeekOnVideo);
          videoElement.addEventListener('seeking', restoreTimeOnSeek);
          videoElement.addEventListener('seeked', restoreTimeOnSeek);
        }
      }

      return () => {
        if (playerRef.current) {
          playerRef.current.dispose();
          playerRef.current = null;
        }
      };
    }, [src, isClient]);

    // Update player settings when props change
    useEffect(() => {
      if (playerRef.current) {
        playerRef.current.volume(volume);
      }
    }, [volume]);

    useEffect(() => {
      if (playerRef.current) {
        playerRef.current.playbackRate(playbackRate);
      }
    }, [playbackRate]);

    useEffect(() => {
      if (playerRef.current) {
        playerRef.current.muted(muted);
      }
    }, [muted]);

    const initialTimeSetRef = useRef(false);

    useEffect(() => {
      if (playerRef.current && currentTime > 0 && !initialTimeSetRef.current) {
        playerRef.current.currentTime(currentTime);
        initialTimeSetRef.current = true;
      }
    }, [currentTime]);

    // Reset the flag when src changes
    useEffect(() => {
      initialTimeSetRef.current = false;
    }, [src]);

    if (!isClient) {
      return (
        <div
          style={{
            width,
            height,
            backgroundColor: "#000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
          <div style={{ color: "white" }}>Loading...</div>
        </div>
      );
    }

    return (
      <div className={className} style={style}>
        <video ref={videoRef} className="video-js vjs-default-skin" width={width} height={height} data-setup="{}" />
        <style
          dangerouslySetInnerHTML={{
            __html: `
          /* Completely disable progress control interactions when seeking is disabled */
          .vjs-progress-control.no-seek,
          .vjs-progress-control.no-seek *,
          .vjs-progress-control.no-seek .vjs-progress-holder,
          .vjs-progress-control.no-seek .vjs-play-progress,
          .vjs-progress-control.no-seek .vjs-load-progress,
          .vjs-progress-control.no-seek .vjs-mouse-display {
            pointer-events: none !important;
            cursor: default !important;
            user-select: none !important;
            touch-action: none !important;
            -webkit-touch-callout: none !important;
            -webkit-user-select: none !important;
            -moz-user-select: none !important;
            -ms-user-select: none !important;
          }

          /* iOS Safari specific restrictions */
          .vjs-progress-control.no-seek {
            position: relative !important;
          }

          .vjs-progress-control.no-seek::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 999999;
            background: transparent;
            pointer-events: auto !important;
            touch-action: none !important;
          }

          /* Disable hover and active states */
          .vjs-progress-control.no-seek:hover,
          .vjs-progress-control.no-seek:active,
          .vjs-progress-control.no-seek:focus,
          .vjs-progress-control.no-seek:hover .vjs-progress-holder {
            transform: none !important;
            outline: none !important;
          }

          /* Additional iOS Safari restrictions */
          .vjs-progress-control.no-seek .vjs-progress-holder {
            position: relative !important;
          }

          .vjs-progress-control.no-seek .vjs-progress-holder::before {
            content: '';
            position: absolute;
            top: -10px;
            left: 0;
            right: 0;
            bottom: -10px;
            z-index: 999999;
            background: transparent;
            pointer-events: auto !important;
            touch-action: none !important;
          }

          .vjs-skip-backward {
            width: 3.2em;
            cursor: pointer;
            color: white !important; /* White color like other controls */
          }

          .vjs-skip-backward:hover {
            color: #f0f0f0 !important; /* Light gray on hover */
          }

          .skip-backward-content {
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: center;
            font-size: 1.2em;
            font-weight: bold;
            color: inherit;
            gap: 4px;
          }

          .skip-arrows-custom {
            font-size: 0.9em;
            line-height: 1;
            letter-spacing: -1px;
            color: inherit;
          }

          .skip-time {
            font-size: 0.9em;
            line-height: 1;
            color: inherit;
            font-weight: bold;
          }

          /* Mobile double-tap skip back animation */
          .skip-back-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 50%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            pointer-events: none;
            z-index: 1000;
          }

          .skip-back-animation {
            background: rgba(0, 0, 0, 0.7);
            border-radius: 50%;
            width: 80px;
            height: 80px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: white;
            animation: skipBackPulse 1s ease-out;
          }

          .skip-arrows {
            font-size: 24px;
            margin-bottom: 4px;
            color: white; /* Ensure arrows are white on dark overlay */
          }

          .skip-arrows span {
            display: inline-block;
            animation: skipArrowMove 0.6s ease-out;
            color: inherit;
          }

          .skip-arrows span:nth-child(2) {
            animation-delay: 0.1s;
          }

          .skip-text {
            font-size: 12px;
            font-weight: bold;
          }

          @keyframes skipBackPulse {
            0% {
              transform: scale(0.8);
              opacity: 0;
            }
            50% {
              transform: scale(1.1);
              opacity: 1;
            }
            100% {
              transform: scale(1);
              opacity: 0;
            }
          }

          @keyframes skipArrowMove {
            0% {
              transform: translateX(10px);
              opacity: 0;
            }
            50% {
              transform: translateX(0);
              opacity: 1;
            }
            100% {
              transform: translateX(-10px);
              opacity: 0.7;
            }
          }

          /* Responsive video player */
          .video-js {
            width: 100% !important;
            height: 100% !important;
          }

          .video-js .vjs-tech {
            object-fit: cover;
          }

          /* Hide fullscreen and picture-in-picture buttons */
          .video-js .vjs-fullscreen-control,
          .video-js .vjs-picture-in-picture-control {
            display: none !important;
          }

          /* Style playback rate menu to look more like default HTML video */
          .video-js .vjs-playback-rate .vjs-playback-rate-value {
            font-size: 13px;
            line-height: 2;
            font-family: inherit;
          }

          /* Ensure playback rate menu is always visible on all screen sizes */
          .video-js .vjs-playback-rate {
            display: block !important;
          }

          /* Mobile responsive adjustments for playback rate - Portrait mode */
          @media (max-width: 768px) and (orientation: portrait) {
            .video-js .vjs-playback-rate .vjs-playback-rate-value {
              font-size: 12px;
              line-height: 1.8;
              padding: 0 0.3em;
            }
            
            .video-js .vjs-playback-rate {
              min-width: 2.5em !important;
              max-width: 3em;
            }
            
            /* Adjust menu positioning for mobile */
            .video-js .vjs-playback-rate .vjs-menu {
              bottom: 3.5em;
            }
          }

          /* Mobile landscape mode - Desktop-like playback rate styling */
          @media (max-width: 768px) and (orientation: landscape) {
            .video-js .vjs-playback-rate .vjs-playback-rate-value {
              font-size: 13px;
              line-height: 2;
              padding: 0 0.4em;
            }
            
            .video-js .vjs-playback-rate {
              min-width: 2.8em !important;
              max-width: 3.5em;
            }
            

          }

          /* Very small screens - Portrait mode only */
          @media (max-width: 480px) and (orientation: portrait) {
            .video-js .vjs-playback-rate .vjs-playback-rate-value {
              font-size: 11px;
              line-height: 1.6;
              padding: 0 0.2em;
            }
            
            .video-js .vjs-playback-rate {
              min-width: 2.2em !important;
              max-width: 2.8em;
            }
            
            /* Adjust menu positioning for small mobile */
            .video-js .vjs-playback-rate .vjs-menu {
              bottom: 3em;
            }
          }

          .video-js .vjs-menu .vjs-menu-content {
            background-color: rgba(0, 0, 0, 0.8);
            border-radius: 4px;
          }

          /* Set margin-bottom for menu popup */
          .video-js .vjs-menu-button-popup .vjs-menu {
            margin-bottom: 0.8em !important;
          }

          /* Fix menu positioning for landscape mode */
          @media (max-width: 768px) and (orientation: landscape) {
            .video-js .vjs-menu-button-popup .vjs-menu {
              position: absolute !important;
              bottom: 100% !important;
              right: 0 !important;
              left: auto !important;
              margin-bottom: 0.5em !important;
              z-index: 1000 !important;
              transform: none !important;
            }
            
            .video-js .vjs-playback-rate .vjs-menu {
              bottom: 100% !important;
              right: 0 !important;
              left: auto !important;
              margin-bottom: 0.5em !important;
              min-width: 4em !important;
              max-width: 6em !important;
              transform: none !important;
            }
            
            /* Ensure menu button has proper positioning context */
            .video-js .vjs-playback-rate {
              position: relative !important;
            }
            
            /* Fix volume control sizing for landscape mode */
            .video-js .vjs-volume-panel {
              width: auto !important;
              min-width: 4em !important;
            }
            
            .video-js .vjs-volume-control {
              width: 5em !important;
              height: 2.5em !important;
            }
            
            .video-js .vjs-volume-bar {
              width: 4em !important;
              height: 0.3em !important;
              margin: 1.1em 0.5em !important;
            }
            
            .video-js .vjs-mute-control {
              width: 2em !important;
              height: 2.5em !important;
            }
            
            /* Ensure volume slider is visible and properly sized */
            .video-js .vjs-volume-level {
              height: 100% !important;
            }
            
            .video-js .vjs-volume-handle {
              width: 0.8em !important;
              height: 0.8em !important;
            }
            
            /* Volume panel hover state for better visibility */
            .video-js .vjs-volume-panel:hover .vjs-volume-control {
              opacity: 1 !important;
              visibility: visible !important;
            }
          }

          /* Increase max-height for tiny and x-small layouts */
          .video-js.vjs-layout-tiny .vjs-menu-button-popup .vjs-menu .vjs-menu-content,
          .video-js.vjs-layout-x-small .vjs-menu-button-popup .vjs-menu .vjs-menu-content {
            max-height: 11em !important;
          }

          .video-js .vjs-menu li {
            font-size: 13px;
            font-family: inherit;
            padding: 4px 12px !important;
            min-height: 1em !important;
          }
          
          /* Mobile menu adjustments - Portrait mode */
          @media (max-width: 768px) and (orientation: portrait) {
            .video-js .vjs-menu li {
              font-size: 14px;
              padding: 4px 12px !important;
              min-height: 1em !important;
            }
          }

          /* Mobile landscape mode - Desktop-like menu styling */
          @media (max-width: 768px) and (orientation: landscape) {
            .video-js .vjs-menu li {
              font-size: 13px;
              padding: 6px 12px !important;
              min-height: 1.5em !important;
              white-space: nowrap;
            }
            
            .video-js .vjs-menu .vjs-menu-content {
              background-color: rgba(0, 0, 0, 0.9) !important;
              border-radius: 4px !important;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3) !important;
            }
          }
          
          /* Very small screens - Portrait mode only */
          @media (max-width: 480px) and (orientation: portrait) {
            .video-js .vjs-menu li {
              font-size: 16px;
              padding: 20px 12px !important;
              min-height: 3.5em !important;
            }
          }

          .video-js .vjs-menu li:hover,
          .video-js .vjs-menu li:focus {
            background-color: rgba(255, 255, 255, 0.1);
          }

          .video-js .vjs-menu li.vjs-selected {
            background-color: rgba(255, 255, 255, 0.2);
            color: #fff;
          }

          /* Disable double-click selection */
          .video-js {
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
          }

          /* Mobile control bar optimizations - Portrait mode only */
          @media (max-width: 768px) and (orientation: portrait) {
            .video-js .vjs-control-bar {
              font-size: 1.4em;
              height: 3.5em;
            }
            
            .video-js .vjs-control-bar .vjs-control {
              width: auto;
              min-width: 2.5em;
            }
            
            /* Ensure playback rate is visible and properly sized */
            .video-js .vjs-playback-rate {
              order: -1; /* Move speed control towards the beginning */
              flex-shrink: 0;
            }
            
            /* Optimize spacing for mobile */
            .video-js .vjs-control-bar .vjs-control:not(.vjs-progress-control) {
              margin: 0 0.1em;
            }
          }

          /* Mobile landscape mode - Use desktop-like styling */
          @media (max-width: 768px) and (orientation: landscape) {
            .video-js .vjs-control-bar {
              font-size: 1em;
              height: 2.5em;
              padding: 0 0.5em;
            }
            
            .video-js .vjs-control-bar .vjs-control {
              width: auto;
              min-width: 2em;
            }
            
            /* Normal spacing for landscape */
            .video-js .vjs-control-bar .vjs-control:not(.vjs-progress-control) {
              margin: 0 0.1em;
            }
            
            /* Ensure volume panel has enough space */
            .video-js .vjs-volume-panel {
              flex-shrink: 0 !important;
              min-width: 6em !important;
            }
          }

          /* Very small screens - Portrait mode only */
          @media (max-width: 480px) and (orientation: portrait) {
            .video-js .vjs-control-bar {
              font-size: 1.2em;
              height: 3em;
            }
            
            .video-js .vjs-control-bar .vjs-control {
              min-width: 2.2em;
            }
            
            /* Compact layout for very small screens */
            .video-js .vjs-playback-rate {
              margin: 0;
            }
          }

          /* Force visibility of essential controls on all screen sizes */
          .video-js .vjs-playback-rate,
          .video-js .vjs-play-control,
          .video-js .vjs-volume-panel,
          .video-js .vjs-progress-control {
            display: flex !important;
            visibility: visible !important;
          }

          /* Ensure essential controls maintain proper pointer events */
          .video-js .vjs-control-bar .vjs-volume-panel,
          .video-js .vjs-control-bar .vjs-play-control,
          .video-js .vjs-control-bar .vjs-playback-rate {
            pointer-events: auto !important;
          }

          /* Ensure progress control allows interactions when seeking is enabled */
          .video-js .vjs-progress-control:not(.no-seek) {
            pointer-events: auto !important;
          }

          /* Simply expand the seek bar without changing layout order */
          .video-js .vjs-progress-control {
            flex-grow: 1 !important;
            width: auto !important;
            min-width: 4em !important;
          }

          /* Make sure other controls don't expand but have minimum space */
          .video-js .vjs-control-bar .vjs-control:not(.vjs-progress-control) {
            flex-shrink: 0 !important;
          }
          
          /* Ensure volume panel gets adequate space */
          .video-js .vjs-volume-panel {
            flex-shrink: 0 !important;
            min-width: 5em !important;
          }

          /* Hide or minimize the custom control spacer that's taking up space */
          .video-js .vjs-custom-control-spacer,
          .video-js .vjs-spacer {
            display: none !important;
            width: 0 !important;
            flex: 0 0 0 !important;
          }
        `,
          }}
        />
      </div>
    );
  }
);

VideoPlayer.displayName = "VideoPlayer";

export default VideoPlayer;
