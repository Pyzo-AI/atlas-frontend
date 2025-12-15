'use client';

import { useState, useEffect } from 'react';
import { useFullscreenOnLandscape } from '@/hooks/useFullscreenOnLandscape';
import { GiExpand } from "react-icons/gi";

const FullscreenController = ({ children, enableAutoFullscreen = true }) => {
  const [showLandscapePrompt, setShowLandscapePrompt] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [userExitedFullscreen, setUserExitedFullscreen] = useState(false);
  const { enterFullscreen, exitFullscreen } = useFullscreenOnLandscape(enableAutoFullscreen && !userExitedFullscreen);

  useEffect(() => {
    const checkOrientation = () => {
      const landscape = window.innerWidth > window.innerHeight;
      setIsLandscape(landscape);
      
      // Show prompt only on mobile devices in landscape
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setShowLandscapePrompt(landscape && isMobile && !document.fullscreenElement);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', () => {
      // Reset user preference when orientation changes
      setUserExitedFullscreen(false);
      checkOrientation();
    });
    
    // Listen for fullscreen changes
    const handleFullscreenChange = () => {
      const isFullscreen = document.fullscreenElement || 
                          document.webkitFullscreenElement || 
                          document.mozFullScreenElement || 
                          document.msFullscreenElement;
      
      if (isFullscreen) {
        setShowLandscapePrompt(false);
        setUserExitedFullscreen(false); // Reset when entering fullscreen
      } else {
        // User exited fullscreen - remember this preference
        if (isLandscape) {
          setUserExitedFullscreen(true);
        }
        checkOrientation();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
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
              Better Experience in Fullscreen
            </h3>
            <p className="text-gray-600 mb-4">
              For the best learning experience, we recommend using fullscreen mode in landscape orientation.
            </p>
            <div className="flex gap-3">
              {/* <button
                onClick={() => setShowLandscapePrompt(false)}
                className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Maybe Later
              </button> */}
              <button
                onClick={() => {
                  enterFullscreen();
                  setShowLandscapePrompt(false);
                  setUserExitedFullscreen(false);
                }}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover"
              >
                Go Fullscreen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FullscreenController;