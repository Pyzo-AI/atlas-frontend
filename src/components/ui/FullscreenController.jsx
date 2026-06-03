'use client';

import { useState, useEffect, useRef } from 'react';
import { useFullscreenOnLandscape } from '@/hooks/useFullscreenOnLandscape';
import { GiExpand } from "react-icons/gi";
import { useTranslation } from 'react-i18next';

const FullscreenController = ({ children, enableAutoFullscreen = true }) => {
  const { t } = useTranslation();
  const [showLandscapePrompt, setShowLandscapePrompt] = useState(false);
  const { enterFullscreen } = useFullscreenOnLandscape(false); // disable auto — we handle manually

  // Tracks whether user has already been prompted/handled this landscape session.
  // Using a ref so closures always read the latest value without causing re-renders.
  const promptHandledRef = useRef(false);
  // Track last orientation so we only reset on a real portrait→landscape transition
  const wasPortraitRef = useRef(false);

  useEffect(() => {
    if (!enableAutoFullscreen) return;

    let resizeTimer;

    const isMobileDevice = () =>
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    const checkOrientation = () => {
      const landscape = window.innerWidth > window.innerHeight;

      if (!landscape) {
        // In portrait — record this so we know orientation really changed next time
        wasPortraitRef.current = true;
        setShowLandscapePrompt(false);
        return;
      }

      // In landscape
      if (wasPortraitRef.current) {
        // Real orientation change from portrait → landscape: reset handled flag
        promptHandledRef.current = false;
        wasPortraitRef.current = false;
      }

      // Only show prompt once per landscape session
      if (!promptHandledRef.current && isMobileDevice()) {
        setShowLandscapePrompt(true);
        promptHandledRef.current = true; // Mark handled immediately — don't re-show on scroll
      }
    };

    // Debounced resize — ignores transient resizes from mobile URL bar toggling
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(checkOrientation, 350);
    };

    // Orientation events are reliable — run without debounce
    const handleOrientationChange = () => {
      checkOrientation();
    };

    // Initial check
    checkOrientation();

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, [enableAutoFullscreen]);

  const handleGoFullscreen = () => {
    enterFullscreen(); // best-effort: works on desktop, silently fails on mobile Chrome
    setShowLandscapePrompt(false);
    // promptHandledRef.current is already true — prompt won't reappear this session
  };

  return (
    <div className="relative w-full h-full">
      {children}

      {/* Landscape Fullscreen Prompt */}
      {showLandscapePrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-auto text-center">
            <div className="mb-4">
              <GiExpand className="w-12 h-12 mx-auto text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t("fullscreen.title")}
            </h3>
            <p className="text-gray-600 mb-4">
              {t("fullscreen.description")}
            </p>
            <button
              onClick={handleGoFullscreen}
              className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover"
            >
              {t("fullscreen.goFullscreen")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FullscreenController;