'use client';

import { useState, useEffect } from 'react';
import { useFullscreenOnLandscape } from '@/hooks/useFullscreenOnLandscape';

const FullscreenController = ({ children, enableAutoFullscreen = true }) => {
  const [showLandscapePrompt, setShowLandscapePrompt] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const { enterFullscreen, exitFullscreen } = useFullscreenOnLandscape(enableAutoFullscreen);

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
    window.addEventListener('orientationchange', checkOrientation);
    
    // Listen for fullscreen changes
    const handleFullscreenChange = () => {
      const isFullscreen = document.fullscreenElement || 
                          document.webkitFullscreenElement || 
                          document.mozFullScreenElement || 
                          document.msFullscreenElement;
      
      if (isFullscreen) {
        setShowLandscapePrompt(false);
      } else {
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
              <svg className="w-12 h-12 mx-auto text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Better Experience in Fullscreen
            </h3>
            <p className="text-gray-600 mb-4">
              For the best learning experience, we recommend using fullscreen mode in landscape orientation.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLandscapePrompt(false)}
                className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Maybe Later
              </button>
              <button
                onClick={() => {
                  enterFullscreen();
                  setShowLandscapePrompt(false);
                }}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Go Fullscreen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Toggle Button (always visible on mobile) */}
      <button
        onClick={() => {
          const isFullscreen = document.fullscreenElement || 
                              document.webkitFullscreenElement || 
                              document.mozFullScreenElement || 
                              document.msFullscreenElement;
          
          if (isFullscreen) {
            exitFullscreen();
          } else {
            enterFullscreen();
          }
        }}
        className="fixed bottom-4 right-4 z-40 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 transition-all md:hidden"
        title="Toggle Fullscreen"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
      </button>
    </div>
  );
};

export default FullscreenController;