'use client';

import { useState, useEffect, useRef } from 'react';
import { useFullscreenOnLandscape } from '@/hooks/useFullscreenOnLandscape';
import { GiExpand } from "react-icons/gi";
import { useTranslation } from 'react-i18next';

const FullscreenController = ({ children, enableAutoFullscreen = true }) => {
  const { t } = useTranslation();
  const [showLandscapePrompt, setShowLandscapePrompt] = useState(false);
  const [userExitedFullscreen, setUserExitedFullscreen] = useState(false);
  const { enterFullscreen, exitFullscreen } = useFullscreenOnLandscape(enableAutoFullscreen && !userExitedFullscreen);

  // Use a ref so closures inside useEffect always read the latest value
  const userExitedRef = useRef(false);
  useEffect(() => { userExitedRef.current = userExitedFullscreen; }, [userExitedFullscreen]);

  useEffect(() => {
    let resizeTimer;

    const checkOrientation = () => {
      const landscape = window.innerWidth > window.innerHeight;
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isFullscreen = !!document.fullscreenElement || !!document.webkitFullscreenElement;

      // Only show prompt if user hasn't already exited fullscreen this session
      setShowLandscapePrompt(landscape && isMobile && !isFullscreen && !userExitedRef.current);
    };

    // Debounced resize — ignores transient resizes from URL bar toggling
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(checkOrientation, 300);
    };

    const handleOrientationChange = () => {
      // Reset user preference when orientation actually changes
      userExitedRef.current = false;
      setUserExitedFullscreen(false);
      checkOrientation();
    };

    // Listen for fullscreen changes
    const handleFullscreenChange = () => {
      const isFullscreen = document.fullscreenElement || 
                          document.webkitFullscreenElement || 
                          document.mozFullScreenElement || 
                          document.msFullscreenElement;
      
      if (isFullscreen) {
        setShowLandscapePrompt(false);
        userExitedRef.current = false;
        setUserExitedFullscreen(false);
      } else {
        // User exited fullscreen — remember so we don't re-prompt on every scroll
        const landscape = window.innerWidth > window.innerHeight;
        if (landscape) {
          userExitedRef.current = true;
          setUserExitedFullscreen(true);
          setShowLandscapePrompt(false);
        }
      }
    };

    checkOrientation();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

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
            <div className="flex gap-3">
              {/* <button
                onClick={() => setShowLandscapePrompt(false)}
                className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {t("fullscreen.maybeLater")}
              </button> */}
              <button
                onClick={() => {
                  enterFullscreen();
                  setShowLandscapePrompt(false);
                  userExitedRef.current = false;
                  setUserExitedFullscreen(false);
                }}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover"
              >
                {t("fullscreen.goFullscreen")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FullscreenController;