'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { GiExpand } from "react-icons/gi";
import { useTranslation } from 'react-i18next';

/**
 * Attempts to enter fullscreen on the document element.
 */
async function requestFullscreen() {
  const el = document.documentElement;
  try {
    if (el.requestFullscreen) {
      await el.requestFullscreen();
    } else if (el.webkitRequestFullscreen) {
      await el.webkitRequestFullscreen();
    } else if (el.mozRequestFullScreen) {
      await el.mozRequestFullScreen();
    } else if (el.msRequestFullscreen) {
      await el.msRequestFullscreen();
    }
  } catch (err) {
    console.warn('Fullscreen request failed:', err);
  }
}

function isCurrentlyFullscreen() {
  return !!(
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement
  );
}

function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * FullscreenController
 *
 * - Always renders children (never hides the lecture)
 * - On mobile landscape, shows a one-time overlay prompting the user to
 *   grant mic permission and enter fullscreen
 * - Uses refs for all state that is read inside event listeners to
 *   avoid stale-closure bugs
 * - Does NOT re-show the prompt when the browser briefly exits fullscreen
 *   during a mic permission dialog (isRequestingPermission guard)
 * - Once the user manually exits fullscreen we remember that preference
 *   and stop prompting for the rest of the session
 */
const FullscreenController = ({ children, enableAutoFullscreen = true }) => {
  const { t } = useTranslation();

  const [showPrompt, setShowPrompt] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Refs keep event-listener callbacks in sync without re-registering them
  const isLandscapeRef = useRef(false);
  const isRequestingPermissionRef = useRef(false);
  const userExitedFullscreenRef = useRef(false);
  const promptShownRef = useRef(false); // only show once per landscape entry

  // -------------------------------------------------------------------
  // Core helper: decide whether to show the prompt
  // -------------------------------------------------------------------
  const evaluatePrompt = useCallback(() => {
    if (!enableAutoFullscreen) return;

    const landscape = window.innerWidth > window.innerHeight;
    isLandscapeRef.current = landscape;

    if (
      landscape &&
      isMobileDevice() &&
      !isCurrentlyFullscreen() &&
      !isRequestingPermissionRef.current &&
      !userExitedFullscreenRef.current &&
      !promptShownRef.current
    ) {
      promptShownRef.current = true;
      setShowPrompt(true);
    } else if (!landscape) {
      // Portrait → reset so the prompt can appear again next landscape entry
      promptShownRef.current = false;
      userExitedFullscreenRef.current = false;
      setShowPrompt(false);
    }
  }, [enableAutoFullscreen]);

  // -------------------------------------------------------------------
  // Event listeners (registered once, use refs for current values)
  // -------------------------------------------------------------------
  useEffect(() => {
    const onResize = () => evaluatePrompt();

    const onOrientationChange = () => {
      // Reset per-session flags when the device rotates
      promptShownRef.current = false;
      userExitedFullscreenRef.current = false;
      // Small delay to let the browser finish rotating
      setTimeout(evaluatePrompt, 150);
    };

    const onFullscreenChange = () => {
      if (isCurrentlyFullscreen()) {
        // Entered fullscreen – hide prompt
        setShowPrompt(false);
      } else {
        // Exited fullscreen
        // Only count it as "user manually exited" when we are NOT in the
        // middle of the mic-permission dialog (which also drops fullscreen)
        if (isLandscapeRef.current && !isRequestingPermissionRef.current) {
          userExitedFullscreenRef.current = true;
          setShowPrompt(false);
        }
      }
    };

    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onOrientationChange);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
    document.addEventListener('mozfullscreenchange', onFullscreenChange);
    document.addEventListener('MSFullscreenChange', onFullscreenChange);

    // Check initial state
    evaluatePrompt();

    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onOrientationChange);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
      document.removeEventListener('mozfullscreenchange', onFullscreenChange);
      document.removeEventListener('MSFullscreenChange', onFullscreenChange);
    };
  }, [evaluatePrompt]);

  // -------------------------------------------------------------------
  // Button handler: mic permission → fullscreen
  // -------------------------------------------------------------------
  const handleStartExperience = async () => {
    setIsLoading(true);

    try {
      // Step 1: Request mic permission (this may briefly exit fullscreen on
      // some browsers — the flag prevents us from treating that as user exit)
      isRequestingPermissionRef.current = true;

      if (navigator.mediaDevices?.getUserMedia) {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      isRequestingPermissionRef.current = false;

      // Step 2: Enter fullscreen
      await requestFullscreen();

      setShowPrompt(false);
    } catch (err) {
      console.warn('Mic or fullscreen request failed:', err);
      isRequestingPermissionRef.current = false;
      // Even if mic is denied, still try to enter fullscreen
      await requestFullscreen();
      setShowPrompt(false);
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------------------------------------------------
  // Render – children are ALWAYS rendered; prompt is an overlay on top
  // -------------------------------------------------------------------
  return (
    <div className="relative w-full h-full">
      {/* Always render the lecture content */}
      {children}

      {/* Fullscreen + mic permission overlay – only on mobile landscape */}
      {showPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full text-center shadow-xl">
            <div className="mb-4">
              <GiExpand className="w-12 h-12 mx-auto text-primary" />
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t("fullscreen.title")}
            </h3>

            <p className="text-gray-600 mb-6 text-sm">
              {t("fullscreen.description")}
            </p>

            <div className="flex flex-col gap-2">
              <button
                onClick={handleStartExperience}
                disabled={isLoading}
                className="w-full px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 font-medium"
              >
                {isLoading ? 'Please wait…' : t("fullscreen.goFullscreen")}
              </button>

              <button
                onClick={() => {
                  userExitedFullscreenRef.current = true;
                  setShowPrompt(false);
                }}
                className="w-full px-4 py-2.5 text-gray-500 text-sm hover:text-gray-700"
              >
                {t("fullscreen.maybeLater")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FullscreenController;