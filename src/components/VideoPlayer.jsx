"use client";
import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import { getTokens } from "@/store/utils/token";

/**
 * Helper to detect if a URL is an HLS stream
 * @param {string} url - The video source URL
 * @returns {boolean} - True if the URL is an HLS manifest
 */
const isHlsStream = (url) => {
  if (!url || typeof url !== "string") return false;
  return url.includes(".m3u8") || url.includes("master.m3u8");
};

/**
 * Get the appropriate MIME type for the video source
 * @param {string} url - The video source URL
 * @returns {string} - The MIME type
 */
const getVideoType = (url) => {
  if (isHlsStream(url)) {
    return "application/x-mpegURL";
  }
  return "video/mp4";
};

/**
 * Get access token using the centralized token utility
 * @returns {string|null} - The access token or null
 */
const getAccessToken = () => {
  const tokens = getTokens();
  return tokens.access_token || null;
};

/**
 * Detect if the browser is Safari
 * Safari uses native HLS and doesn't support XHR interception for HLS streams
 * @returns {boolean} - True if running in Safari
 */
const isSafari = () => {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  const ua = navigator.userAgent.toLowerCase();
  // Safari but not Chrome (Chrome UA also includes "safari")
  return ua.includes("safari") && !ua.includes("chrome") && !ua.includes("chromium") && !ua.includes("android");
};

/**
 * Helper to append token as query parameter to URL
 * @param {string} url - The original URL
 * @param {string} token - The access token
 * @returns {string} - URL with token appended as query parameter
 */
const appendTokenToUrl = (url, token) => {
  if (!url || !token) return url;
  // Check if token is already in the URL to avoid duplication
  if (url.includes("token=")) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}token=${encodeURIComponent(token)}`;
};

/**
 * Get the source URL - no token needed since VHS will add it to key requests only
 * @param {string} url - The original source URL
 * @returns {string} - URL without token
 */
const getSourceUrlWithToken = (url) => {
  // Don't add token to source URL - VHS hooks will add it only to /key requests
  return url;
};

/**
 * Setup global VHS xhr hook for HLS authentication
 * This must be called before the player is initialized
 * It intercepts ALL HLS requests including manifests, segments, and encryption keys
 */
const setupVhsXhrHook = () => {
  if (typeof window === "undefined") return;

  // Access the VHS module from videojs
  const vhs = videojs.Vhs || videojs.VHS;

  if (vhs) {
    // CRITICAL: Set global VHS options to force overrideNative for ALL browsers
    // This prevents Safari from using its native AVFoundation HLS player
    // which makes OS-level requests that bypass JavaScript XHR/fetch
    
    // Create options object if it doesn't exist
    if (!vhs.options) {
      vhs.options = {};
    }
    vhs.options.overrideNative = true;

    // Also set on videojs.options for good measure
    if (!videojs.options) {
      videojs.options = {};
    }
    if (!videojs.options.html5) {
      videojs.options.html5 = {};
    }
    videojs.options.html5.vhs = videojs.options.html5.vhs || {};
    videojs.options.html5.vhs.overrideNative = true;
    videojs.options.html5.hls = videojs.options.html5.hls || {};
    videojs.options.html5.hls.overrideNative = true;
    videojs.options.html5.nativeAudioTracks = false;
    videojs.options.html5.nativeVideoTracks = false;

    if (vhs.xhr) {
      // Set the global onRequest hook (replaces deprecated beforeRequest)
      vhs.xhr.onRequest = (options) => {
        // Ensure options object exists
        if (!options) {
          return options;
        }

        const uri = options.uri || options.url || "";
        
        // Only add token to encryption key requests
        if (uri.includes('/key')) {
          const accessToken = getAccessToken();
          if (accessToken) {
            // Append token as URL query parameter
            if (options.uri) {
              options.uri = appendTokenToUrl(options.uri, accessToken);
            }
            if (options.url) {
              options.url = appendTokenToUrl(options.url, accessToken);
            }
            console.log("[VHS Global Hook] Token added to key request:", uri.substring(0, 120));
          } else {
            console.warn("[VHS Global Hook] No access token for key request:", uri.substring(0, 120));
          }
        } else {
          console.log("[VHS Global Hook] No token for:", uri.substring(0, 120));
        }

        return options;
      };

      console.log("[VHS] Global xhr.onRequest hook installed");
    }

    console.log("[VHS] Global overrideNative configured:", vhs.options?.overrideNative);
  } else {
    console.warn("[VHS] Could not find VHS module for configuration");
  }
};

// Safari interceptors removed - VHS handles all requests including key requests

/**
 * Disable Safari's native HLS capability to force VHS/MSE usage
 * Safari's AVFoundation makes OS-level requests that bypass JavaScript
 * By disabling native HLS detection, we force Video.js to use MSE via VHS
 */
const disableSafariNativeHls = () => {
  if (typeof window === "undefined") return;
  if (!isSafari()) return;

  // Only run once
  if (window._safariNativeHlsDisabled) return;
  window._safariNativeHlsDisabled = true;

  try {
    // Override the canPlayType function on HTMLVideoElement to report no native HLS support
    // This forces Video.js to use MSE instead of native HLS
    const originalCanPlayType = HTMLVideoElement.prototype.canPlayType;
    HTMLVideoElement.prototype.canPlayType = function (type) {
      // Block native HLS type detection for Safari
      if (
        type &&
        (type.includes("application/vnd.apple.mpegurl") ||
          type.includes("application/x-mpegURL") ||
          type.includes("audio/mpegurl") ||
          type.includes("audio/x-mpegurl"))
      ) {
        console.log("[Safari Native HLS Disabled] Blocking native HLS for type:", type);
        return ""; // Return empty string to indicate no support
      }
      return originalCanPlayType.call(this, type);
    };

    console.log("[Safari] Native HLS capability disabled - forcing MSE/VHS usage");
  } catch (e) {
    console.warn("[Safari] Failed to disable native HLS:", e.message);
  }
};

// Initialize VHS hook when module loads (client-side only)
if (typeof window !== "undefined") {
  // IMPORTANT: Disable Safari native HLS BEFORE setting up VHS
  disableSafariNativeHls();
  setupVhsXhrHook();
}

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
      showRemainingDuration = false,
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
    const skipBackwardInProgressRef = useRef(false);
    // Unique key to force video element recreation on mount
    const [videoElementKey] = useState(() => Date.now());

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
          const sourceUrl = getSourceUrlWithToken(src);
          playerRef.current.src({ src: sourceUrl, type: getVideoType(src) });
        }
      },
    }));

    useEffect(() => {
      if (!isClient || !videoRef.current) return;

      // Check if video element is in the DOM (Video.js removes it on dispose)
      if (!document.body.contains(videoRef.current)) {
        console.log("Video element not in DOM, skipping initialization");
        return;
      }

      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }

      // Ensure VHS xhr hook is setup before creating player
      // This is critical for HLS encrypted streams
      // Also ensure Safari native HLS is disabled BEFORE player creation
      disableSafariNativeHls();
      setupVhsXhrHook();

      // For Safari, add token directly to source URL as a fallback
      // But we still need VHS to intercept key/segment requests
      const sourceUrl = getSourceUrlWithToken(src);
      const usingSafari = isSafari();

      // Log detailed info for debugging Safari issues
      const vhsModule = videojs.Vhs || videojs.VHS;
      console.log("[VideoPlayer] Initializing player:", {
        isSafari: usingSafari,
        originalSrc: src?.substring(0, 80),
        sourceUrl: sourceUrl?.substring(0, 80),
        hasToken: sourceUrl?.includes("token="),
        isHLS: isHlsStream(src),
        videoType: getVideoType(src),
        vhsAvailable: !!vhsModule,
        vhsVersion: vhsModule?.VERSION || 'unknown',
        mseSupported: typeof window !== 'undefined' && 'MediaSource' in window,
        videoJsVersion: videojs.VERSION,
        videojsObject: Object.keys(videojs).filter(k => k.toLowerCase().includes('vhs') || k.toLowerCase().includes('hls')),
      });
      
      // Critical check
      if (!vhsModule) {
        console.error("[VideoPlayer] ❌ VHS MODULE NOT FOUND! HLS will not work.");
        console.error("[VideoPlayer] Available videojs properties:", Object.keys(videojs).slice(0, 20));
      } else {
        console.log("[VideoPlayer] ✅ VHS module found:", vhsModule.VERSION);
      }

      if (usingSafari) {
        console.log("[Safari] Forcing VHS with overrideNative=true for HLS playback");
      }

      playerRef.current = videojs(videoRef.current, {
        controls: controls,
        responsive: true,
        fluid: true,
        sources: [
          {
            src: sourceUrl,
            type: getVideoType(src),
          },
        ],
        preload: "auto",
        poster: poster,
        muted: muted,
        autoplay: autoPlay,
        playbackRates: [0.5, 1, 1.5, 2],
        disablePictureInPicture: true,
        userActions: {
          click: false,
        },
        controlBar: {
          remainingTimeDisplay: showRemainingDuration,
        },
        // iOS-specific configurations to prevent fullscreen
        playsinline: true,
        webkit_playsinline: true,
        fullscreen: {
          options: {
            navigationUI: "hide",
          },
        },
        // Disable native fullscreen and controls on iOS
        techOrder: ["html5"],
        html5: {
          nativeControlsForTouch: false,
          nativeAudioTracks: false,
          nativeVideoTracks: false,
          nativeTextTracks: false,
          // VHS (Video.js HTTP Streaming) configuration for HLS with encrypted streams
          // IMPORTANT: Force VHS to handle ALL HLS for ALL browsers including Safari
          // Safari's native HLS (AVFoundation) makes OS-level requests that bypass JavaScript
          vhs: {
            overrideNative: true,
            // Force VHS to use MSE instead of native HLS
            // This is critical for Safari where native HLS bypasses XHR hooks
            enableLowInitialPlaylist: true,
            smoothQualityChange: true,
            allowSeeksWithinUnsafeLiveWindow: true,
            // Disable bandwidth calculation to prevent issues
            handleManifestRedirects: true,
            // Enable withCredentials if needed for CORS
            withCredentials: false,
            // Custom key loader that ensures token is added only to key requests
            xhr: {
              onRequest: (options) => {
                // Ensure options exist
                if (!options) {
                  console.warn("[VHS XHR] Options is null/undefined");
                  return options;
                }

                const uri = options.uri || options.url || "";
                
                // Only add token to encryption key requests
                if (uri.includes('/key')) {
                  const accessToken = getAccessToken();
                  if (accessToken) {
                    // Append token as URL query parameter to BOTH uri and url
                    if (options.uri) {
                      options.uri = appendTokenToUrl(options.uri, accessToken);
                    }
                    if (options.url) {
                      options.url = appendTokenToUrl(options.url, accessToken);
                    }
                    console.log("[VHS XHR onRequest] Token added to key request:", uri.substring(0, 150));
                  } else {
                    console.warn("[VHS XHR onRequest] No token for key request:", uri.substring(0, 150));
                  }
                } else {
                  console.log("[VHS XHR onRequest] No token for:", uri.substring(0, 120));
                }
                return options;
              },
            },
          },
          // Force Safari to NOT use native HLS
          hls: {
            overrideNative: true,
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
        // Re-setup VHS xhr hook after player is ready as fallback
        // This ensures the hook is active for the tech instance
        try {
          const tech = playerRef.current.tech({ IWillNotUseThisInPlugins: true });
          if (tech && tech.vhs && tech.vhs.xhr) {
            const originalXhr = tech.vhs.xhr;
            tech.vhs.xhr = (options, callback) => {
              const uri = options.uri || options.url || "";
              
              // Only add token to encryption key requests
              if (uri.includes('/key')) {
                const accessToken = getAccessToken();
                if (accessToken) {
                  // Append token as URL query parameter
                  if (options.uri) {
                    options.uri = appendTokenToUrl(options.uri, accessToken);
                  }
                  if (options.url) {
                    options.url = appendTokenToUrl(options.url, accessToken);
                  }
                  console.log("[VHS Tech Hook] Token added to key request:", uri.substring(0, 100));
                }
              } else {
                console.log("[VHS Tech Hook] No token for:", uri.substring(0, 100));
              }
              return originalXhr(options, callback);
            };
            console.log("[VHS] Tech-level xhr hook installed");
          }
        } catch (e) {
          console.log("[VHS] Tech hook setup skipped:", e.message);
        }

        // Show/hide remaining time based on prop
        if (showRemainingDuration) {
          playerRef.current.addClass("vjs-show-remaining-time");
          const remainingTimeDisplay = playerRef.current.controlBar.remainingTimeDisplay;
          if (remainingTimeDisplay) {
            remainingTimeDisplay.show();
          }
        } else {
          playerRef.current.removeClass("vjs-show-remaining-time");
          const remainingTimeDisplay = playerRef.current.controlBar.remainingTimeDisplay;
          if (remainingTimeDisplay) {
            remainingTimeDisplay.hide();
          }
        }

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

        // iOS-specific: Disable native fullscreen and controls
        const videoEl = playerRef.current.el().querySelector("video");
        if (videoEl) {
          videoEl.setAttribute("playsinline", "true");
          videoEl.setAttribute("webkit-playsinline", "true");
          videoEl.setAttribute("x-webkit-airplay", "deny");

          // Prevent iOS native fullscreen
          videoEl.webkitEnterFullscreen = undefined;
          videoEl.webkitExitFullscreen = undefined;

          // Override fullscreen API methods
          if (videoEl.requestFullscreen) {
            videoEl.requestFullscreen = () => {};
          }
          if (videoEl.webkitRequestFullscreen) {
            videoEl.webkitRequestFullscreen = () => {};
          }
          if (videoEl.mozRequestFullScreen) {
            videoEl.mozRequestFullScreen = () => {};
          }
          if (videoEl.msRequestFullscreen) {
            videoEl.msRequestFullscreen = () => {};
          }
        }

        // Disable Video.js fullscreen functionality completely
        if (playerRef.current.requestFullscreen) {
          playerRef.current.requestFullscreen = () => {};
        }
        if (playerRef.current.exitFullscreen) {
          playerRef.current.exitFullscreen = () => {};
        }

        // Disable double-click to fullscreen
        playerRef.current.off("dblclick");
        playerRef.current.on("dblclick", (e) => {
          e.preventDefault();
          e.stopPropagation();
        });

        // Add click to play/pause on video element
        const videoElement = playerRef.current.el().querySelector("video");
        if (videoElement) {
          videoElement.addEventListener(
            "click",
            (e) => {
              e.stopPropagation();
              if (playerRef.current.paused()) {
                playerRef.current.play();
              } else {
                playerRef.current.pause();
              }
            },
            true
          );
        }

        // Add spacebar to play/pause
        const handleKeyDown = (e) => {
          if (e.code === "Space") {
            e.preventDefault();
            if (playerRef.current.paused()) {
              playerRef.current.play();
            } else {
              playerRef.current.pause();
            }
          }
        };

        document.addEventListener("keydown", handleKeyDown);

        // Store cleanup function
        playerRef.current.spacebarCleanup = () => {
          document.removeEventListener("keydown", handleKeyDown);
        };

        // Prevent iOS fullscreen events
        const videoElForEvents = playerRef.current.el().querySelector("video");
        if (videoElForEvents) {
          videoElForEvents.addEventListener(
            "webkitbeginfullscreen",
            (e) => {
              e.preventDefault();
              e.stopPropagation();
              return false;
            },
            true
          );

          videoElForEvents.addEventListener(
            "webkitendfullscreen",
            (e) => {
              e.preventDefault();
              e.stopPropagation();
              return false;
            },
            true
          );

          // Prevent fullscreen change events
          videoElForEvents.addEventListener("fullscreenchange", (e) => {
            if (document.fullscreenElement === videoElForEvents) {
              document.exitFullscreen();
            }
          });

          videoElForEvents.addEventListener("webkitfullscreenchange", (e) => {
            e.preventDefault();
            e.stopPropagation();
          });
        }

        // Prevent volume/mute control clicks from bubbling to parent
        const volumePanel = playerRef.current.controlBar.volumePanel;
        if (volumePanel) {
          const volumePanelEl = volumePanel.el();
          if (volumePanelEl) {
            volumePanelEl.addEventListener(
              "click",
              (e) => {
                e.stopPropagation();
              },
              false
            );
          }
        }

        // Prevent play button clicks from bubbling to parent
        const playToggle = playerRef.current.controlBar.playToggle;
        if (playToggle) {
          const playToggleEl = playToggle.el();
          if (playToggleEl) {
            playToggleEl.addEventListener(
              "click",
              (e) => {
                e.stopPropagation();
              },
              false
            );
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
            menuButton.addEventListener(
              "click",
              (e) => {
                e.stopPropagation();
              },
              false
            );
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
            progressControlEl.addEventListener("click", preventSeekEvents, true);
            progressControlEl.addEventListener("mousedown", preventSeekEvents, true);
            progressControlEl.addEventListener("mouseup", preventSeekEvents, true);
            progressControlEl.addEventListener("touchstart", preventSeekEvents, true);
            progressControlEl.addEventListener("touchend", preventSeekEvents, true);
            progressControlEl.addEventListener("touchmove", preventSeekEvents, true);

            // Also prevent on child elements for iOS
            if (progressHolder) {
              progressHolder.addEventListener("click", preventSeekEvents, true);
              progressHolder.addEventListener("mousedown", preventSeekEvents, true);
              progressHolder.addEventListener("touchstart", preventSeekEvents, true);
              progressHolder.addEventListener("touchend", preventSeekEvents, true);
              progressHolder.addEventListener("touchmove", preventSeekEvents, true);
            }

            // Add event listeners to the CSS overlay elements for iOS Safari
            setTimeout(() => {
              const overlayEl = progressControlEl.querySelector("::before");
              const holderOverlayEl = progressHolder?.querySelector("::before");

              // Since we can't directly access pseudo-elements, we'll add a real overlay
              const createOverlay = (parent) => {
                const overlay = document.createElement("div");
                overlay.style.position = "absolute";
                overlay.style.top = "-10px";
                overlay.style.left = "0";
                overlay.style.right = "0";
                overlay.style.bottom = "-10px";
                overlay.style.zIndex = "999999";
                overlay.style.background = "transparent";
                overlay.style.pointerEvents = "auto";
                overlay.style.touchAction = "none";

                overlay.addEventListener("click", preventSeekEvents, true);
                overlay.addEventListener("mousedown", preventSeekEvents, true);
                overlay.addEventListener("touchstart", preventSeekEvents, true);
                overlay.addEventListener("touchend", preventSeekEvents, true);
                overlay.addEventListener("touchmove", preventSeekEvents, true);

                parent.style.position = "relative";
                parent.appendChild(overlay);
                return overlay;
              };

              // Create overlays for better iOS Safari blocking
              if (progressControlEl && !progressControlEl.querySelector(".seek-block-overlay")) {
                const overlay = createOverlay(progressControlEl);
                overlay.classList.add("seek-block-overlay");
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

              // Set flag to disable seeking prevention during skip backward
              skipBackwardInProgressRef.current = true;

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

                // Reset flag after skip backward is complete
                setTimeout(() => {
                  skipBackwardInProgressRef.current = false;
                }, 100);
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

              // Set flag to disable seeking prevention during skip backward
              skipBackwardInProgressRef.current = true;

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

                // Reset flag after skip backward is complete
                setTimeout(() => {
                  skipBackwardInProgressRef.current = false;
                }, 100);
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

                  // Set flag to disable seeking prevention during skip backward
                  skipBackwardInProgressRef.current = true;

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

                    // Reset flag after skip backward is complete
                    setTimeout(() => {
                      skipBackwardInProgressRef.current = false;
                    }, 100);
                  }, 50);

                  showSkipAnimation();
                  e.preventDefault();
                  e.stopPropagation();
                } else {
                  // Single tap - toggle play/pause
                  if (playerRef.current.paused()) {
                    playerRef.current.play();
                  } else {
                    playerRef.current.pause();
                  }
                }
                tapCount = 0;
              }, 300);
            } else {
              // Right side tap - toggle play/pause
              if (playerRef.current.paused()) {
                playerRef.current.play();
              } else {
                playerRef.current.pause();
              }
            }
          };

          const actualVideo = videoElement.querySelector("video");
          if (actualVideo) {
            actualVideo.addEventListener("touchend", handleVideoTap, { passive: false });
          }
        } else {
          // When seeking is allowed, add simple mobile touch handler
          const videoElementForTouch = playerRef.current.el();
          const handleMobileTouch = (e) => {
            if (playerRef.current.paused()) {
              playerRef.current.play();
            } else {
              playerRef.current.pause();
            }
          };

          const actualVideoForTouch = videoElementForTouch.querySelector("video");
          if (actualVideoForTouch) {
            actualVideoForTouch.addEventListener("touchend", handleMobileTouch, { passive: true });
          }
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

        // Prevent seeking if canSkipVideo is false, but allow skip backward operations
        if (!canSkipVideo && !skipBackwardInProgressRef.current) {
          const currentTime = playerRef.current.currentTime();
          const previousTime = playerRef.current.previousTime || 0;

          console.log("VideoPlayer seeking - blocking seek, restoring to:", previousTime);
          // Restore to previous time to block seeking
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

      // HLS/VHS error handling for encrypted streams
      playerRef.current.on("error", (e) => {
        const error = playerRef.current.error();
        const tech = playerRef.current.tech({ IWillNotUseThisInPlugins: true });
        
        if (error) {
          console.error("[VideoPlayer] Playback error:", {
            code: error.code,
            message: error.message,
            src: src?.substring(0, 100),
            isHLS: isHlsStream(src),
            vhsAvailable: !!(videojs.Vhs || videojs.VHS),
            techName: tech?.name,
            canPlayType: tech?.canPlayType?.(getVideoType(src)),
            mseSupported: typeof window !== 'undefined' && 'MediaSource' in window,
          });

          // Check for specific HLS/encryption errors
          if (error.code === 4) {
            console.error("[VideoPlayer] MEDIA_ERR_SRC_NOT_SUPPORTED - Possible causes:");
            console.error("  1. VHS not loaded or initialized");
            console.error("  2. MSE not supported in browser");
            console.error("  3. MIME type mismatch");
            console.error("  4. HLS manifest parsing failed");
            
            // Check if VHS is actually available
            if (!(videojs.Vhs || videojs.VHS)) {
              console.error("  ❌ VHS module not found! HLS playback will not work.");
            } else {
              console.log("  ✅ VHS module is available");
            }
            
            // Check MSE support
            if (typeof window !== 'undefined' && !('MediaSource' in window)) {
              console.error("  ❌ MediaSource API not supported in this browser");
            } else {
              console.log("  ✅ MediaSource API is supported");
            }
          }
        }
      });

      // VHS-specific event for key load issues
      const tech = playerRef.current.tech({ IWillNotUseThisInPlugins: true });
      if (tech && tech.vhs) {
        tech.vhs.on("error", (err) => {
          console.error("[VHS] HLS streaming error:", err);
        });

        // Log when segments are being loaded (useful for debugging)
        if (process.env.NODE_ENV === "development") {
          tech.vhs.on("bandwidthupdate", () => {
            console.log("[VHS] Bandwidth update - stream is loading");
          });
        }
      }

      // Additional iOS Safari seek prevention
      if (!canSkipVideo) {
        const videoElement = playerRef.current.el().querySelector("video");
        if (videoElement) {
          let lastValidTime = 0;

          const preventSeekOnVideo = () => {
            if (!seekingRef.current) {
              lastValidTime = videoElement.currentTime;
            }
          };

          const restoreTimeOnSeek = () => {
            if (
              seekingRef.current &&
              Math.abs(videoElement.currentTime - lastValidTime) > 1 &&
              !skipBackwardInProgressRef.current
            ) {
              console.log("Native video - blocking seek, restoring to:", lastValidTime);
              videoElement.currentTime = lastValidTime;
            } else if (skipBackwardInProgressRef.current) {
              console.log("Native video - allowing skip backward to:", videoElement.currentTime);
              lastValidTime = videoElement.currentTime;
            }
          };

          videoElement.addEventListener("timeupdate", preventSeekOnVideo);
          videoElement.addEventListener("seeking", restoreTimeOnSeek);
          videoElement.addEventListener("seeked", restoreTimeOnSeek);
        }
      }

      return () => {
        if (playerRef.current) {
          if (playerRef.current.spacebarCleanup) {
            playerRef.current.spacebarCleanup();
          }
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
            backgroundColor: "var(--color-dark)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
          <div style={{ color: "var(--color-light)" }}>Loading...</div>
        </div>
      );
    }

    return (
      <div className={className} style={style}>
        <video
          key={`video-element-${videoElementKey}`}
          ref={videoRef}
          className="video-js vjs-default-skin"
          width={width}
          height={height}
          data-setup="{}"
          playsInline
          webkit-playsinline="true"
          x-webkit-airplay="deny"
        />
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
            color: var(--color-video-text-hover) !important; /* Light gray on hover */
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

          /* iOS-specific fixes to prevent fullscreen and native controls */
          .video-js video {
            -webkit-playsinline: true !important;
            playsinline: true !important;
          }

          /* Force inline playback on iOS Safari */
          @supports (-webkit-overflow-scrolling: touch) {
            .video-js video {
              -webkit-playsinline: true !important;
              playsinline: true !important;
            }
          }

          /* Disable iOS native video controls overlay */
          .video-js video::-webkit-media-controls {
            display: none !important;
          }

          .video-js video::-webkit-media-controls-enclosure {
            display: none !important;
          }

          .video-js video::-webkit-media-controls-panel {
            display: none !important;
          }

          .video-js video::-webkit-media-controls-play-button {
            display: none !important;
          }

          .video-js video::-webkit-media-controls-timeline {
            display: none !important;
          }

          .video-js video::-webkit-media-controls-current-time-display {
            display: none !important;
          }

          .video-js video::-webkit-media-controls-time-remaining-display {
            display: none !important;
          }

          .video-js video::-webkit-media-controls-mute-button {
            display: none !important;
          }

          .video-js video::-webkit-media-controls-volume-slider {
            display: none !important;
          }

          .video-js video::-webkit-media-controls-fullscreen-button {
            display: none !important;
          }

          /* Hide fullscreen and picture-in-picture buttons */
          .video-js .vjs-fullscreen-control,
          .video-js .vjs-picture-in-picture-control {
            display: none !important;
          }

          /* Show remaining time when enabled */
          .video-js.vjs-show-remaining-time .vjs-remaining-time {
            display: none !important;
          }

          // /* Ensure remaining time is visible on mobile */
          // .video-js .vjs-remaining-time {
          //   display: none;
          // }

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
              font-size: 11px;
              padding: 4px 10px !important;
              min-height: 1.5em !important;
              white-space: nowrap;
            }
            
            .video-js .vjs-menu .vjs-menu-content {
              background-color: rgba(0, 0, 0, 0.9) !important;
              border-radius: 4px !important;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3) !important;
            }
            
            /* Fix menu positioning for tiny and x-small layouts in landscape */
            .video-js.vjs-layout-tiny .vjs-menu-button-popup .vjs-menu .vjs-menu-content,
            .video-js.vjs-layout-x-small .vjs-menu-button-popup .vjs-menu .vjs-menu-content {
              bottom: 0em !important;
            }
            
            /* Override default menu content bottom positioning */
            .video-js .vjs-menu-button-popup .vjs-menu .vjs-menu-content {
              bottom: 0em !important;
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
            color: var(--color-light);
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
            
            /* Optimize spacing for mobile - add more space between controls */
            .video-js .vjs-control-bar .vjs-control:not(.vjs-progress-control) {
              margin: 0 0.2em;
            }
            
            /* Add extra spacing for skip backward button */
            .video-js .vjs-skip-backward {
              margin-right: 0.3em !important;
            }
            
            /* Ensure volume panel has adequate space */
            .video-js .vjs-volume-panel {
              margin-left: 0.3em !important;
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
            
            /* Better spacing for landscape */
            .video-js .vjs-control-bar .vjs-control:not(.vjs-progress-control) {
              margin: 0 0.15em;
            }
            
            /* Add extra spacing for skip backward button */
            .video-js .vjs-skip-backward {
              margin-right: 0.25em !important;
              margin-top: 2.5px !important;
            }
            
            /* Ensure volume panel has enough space */
            .video-js .vjs-volume-panel {
              flex-shrink: 0 !important;
              min-width: 6em !important;
              margin-left: 0.25em !important;
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
            
            /* Better spacing for very small screens */
            .video-js .vjs-control-bar .vjs-control:not(.vjs-progress-control) {
              margin: 0 0.15em;
            }
            
            /* Add extra spacing for skip backward button */
            .video-js .vjs-skip-backward {
              margin-right: 0.25em !important;
            }
            
            /* Ensure volume panel has space */
            .video-js .vjs-volume-panel {
              margin-left: 0.25em !important;
            }
            
            /* Compact layout for very small screens */
            .video-js .vjs-playback-rate {
              margin: 0 0.1em;
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
