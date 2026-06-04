'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { GiExpand } from "react-icons/gi";
import { useTranslation } from 'react-i18next';

// ─── Fullscreen helpers ──────────────────────────────────────────────────────

/**
 * iOS Safari does NOT support the Fullscreen API on the document element.
 * We detect it so we can skip the fullscreen step entirely on that platform.
 */
function isFullscreenSupported() {
  const el = document.documentElement;
  return !!(
    el.requestFullscreen ||
    el.webkitRequestFullscreen ||
    el.mozRequestFullScreen ||
    el.msRequestFullscreen
  );
}

async function enterFullscreen() {
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

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * FullscreenController
 *
 * On mobile landscape:
 *   1. Shows a one-time overlay asking for mic permission
 *   2. Then enters fullscreen (skipped on iOS Safari where it is unsupported)
 *
 * Key design choices:
 *   - Children are ALWAYS rendered — the prompt is just an overlay, never a gate
 *   - All values read inside event listeners are stored in refs to avoid stale closures
 *   - `sessionCompletedRef` tracks whether the user has gone through the flow;
 *     orientation changes never re-show the prompt once the flow is done
 *   - On iOS Safari (fullscreen unsupported), we only ask for mic and then dismiss
 */
const FullscreenController = ({ children, enableAutoFullscreen = true }) => {
  const { t } = useTranslation();

  const [showPrompt, setShowPrompt] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Refs — readable from event listeners without stale-closure bugs
  const isLandscapeRef            = useRef(false);
  const isRequestingPermissionRef = useRef(false);
  const userDismissedRef          = useRef(false);  // "Maybe later" clicked
  const sessionCompletedRef       = useRef(false);  // flow fully completed once
  const promptShownRef            = useRef(false);  // guard: show once per landscape entry

  // ── Evaluate whether to show the prompt ────────────────────────────────────
  const evaluatePrompt = useCallback(() => {
    if (!enableAutoFullscreen) return;

    const landscape = window.innerWidth > window.innerHeight;
    isLandscapeRef.current = landscape;

    if (!landscape) {
      // Rotated back to portrait — hide prompt, but keep session/dismissed flags
      promptShownRef.current = false;
      setShowPrompt(false);
      return;
    }

    // Landscape — show prompt only if:
    //   • on a mobile device
    //   • not already in fullscreen (or fullscreen not supported — iOS)
    //   • not currently requesting permission
    //   • user hasn't dismissed with "maybe later"
    //   • session flow not already completed
    //   • prompt not already visible
    const alreadyFullscreen = isCurrentlyFullscreen();

    if (
      isMobileDevice() &&
      !alreadyFullscreen &&
      !isRequestingPermissionRef.current &&
      !userDismissedRef.current &&
      !sessionCompletedRef.current &&
      !promptShownRef.current
    ) {
      promptShownRef.current = true;
      setShowPrompt(true);
    }
  }, [enableAutoFullscreen]);

  // ── Event listeners ─────────────────────────────────────────────────────────
  useEffect(() => {
    const onResize = () => evaluatePrompt();

    const onOrientationChange = () => {
      // Only re-allow the prompt on the next landscape entry if the session
      // hasn't been completed yet (i.e. user rotated before completing flow)
      if (!sessionCompletedRef.current) {
        promptShownRef.current = false;
      }
      setTimeout(evaluatePrompt, 200); // wait for dimensions to settle
    };

    const onFullscreenChange = () => {
      if (isCurrentlyFullscreen()) {
        setShowPrompt(false);
      } else {
        // Exited fullscreen — only treat as deliberate user exit when we are
        // NOT mid-way through the mic-permission request (some browsers
        // briefly exit fullscreen to show the mic dialog)
        if (isLandscapeRef.current && !isRequestingPermissionRef.current) {
          userDismissedRef.current = true;
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

  // ── Button handler ──────────────────────────────────────────────────────────
  const handleStartExperience = async () => {
    setIsLoading(true);

    try {
      // Step 1 — ask mic permission
      // Set the flag BEFORE getUserMedia so that the fullscreenchange listener
      // knows not to treat an accidental fullscreen-exit as a user action.
      isRequestingPermissionRef.current = true;

      if (navigator.mediaDevices?.getUserMedia) {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      isRequestingPermissionRef.current = false;

      // Step 2 — enter fullscreen (skip on iOS Safari where it is unsupported)
      if (isFullscreenSupported()) {
        await enterFullscreen();
      }

      // Mark the session as done — orientation changes will not re-show prompt
      sessionCompletedRef.current = true;
      setShowPrompt(false);
    } catch (err) {
      console.warn('Mic or fullscreen request failed:', err);
      isRequestingPermissionRef.current = false;

      // Mic was denied — still try fullscreen and mark session done
      if (isFullscreenSupported()) {
        await enterFullscreen();
      }
      sessionCompletedRef.current = true;
      setShowPrompt(false);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="relative w-full h-full">
      {/* Lecture content — always visible */}
      {children}

      {/* Mic + fullscreen prompt overlay */}
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
                  userDismissedRef.current = true;
                  sessionCompletedRef.current = true; // treat dismiss as done too
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