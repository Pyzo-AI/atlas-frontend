import { useState, useEffect } from "react";

export const usePortraitMode = () => {
  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      const isMobileOrTablet = window.innerWidth <= 1024;
      const isPortraitMode = window.innerHeight > window.innerWidth;
      setIsPortrait(isMobileOrTablet && isPortraitMode);
    };

    checkOrientation();
    window.addEventListener("resize", checkOrientation);
    window.addEventListener("orientationchange", checkOrientation);
    // iOS Safari doesn't fire resize when returning from another tab — re-check on visibility.
    document.addEventListener("visibilitychange", checkOrientation);

    return () => {
      window.removeEventListener("resize", checkOrientation);
      window.removeEventListener("orientationchange", checkOrientation);
      document.removeEventListener("visibilitychange", checkOrientation);
    };
  }, []);

  return isPortrait;
};
