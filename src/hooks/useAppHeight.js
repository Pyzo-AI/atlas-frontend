import { useEffect } from 'react';

/**
 * useAppHeight
 *
 * Maintains a global `--app-height` CSS variable equal to the *actual visible*
 * viewport height, measured from the `visualViewport` API.
 *
 * Why this exists:
 *   On iOS Safari, CSS units (`vh`, `dvh`, `svh`) and `position: fixed` are
 *   anchored to the layout viewport, NOT the visible area. After the mic
 *   permission dialog appears/dismisses, Safari's toolbar reappears and the
 *   visible area shrinks — but a `100vh`/`100dvh` fixed container keeps its old
 *   height, leaving the bottom portion stuck behind the toolbar / off-screen.
 *   iOS also frequently does NOT fire a `window.resize` for this transition.
 *
 *   `visualViewport` reflects the truly visible region and fires `resize`/`scroll`
 *   reliably on iOS. We read it and write it to `--app-height` so layouts can use
 *   `height: var(--app-height)` instead of any vh unit.
 *
 * Usage:
 *   useAppHeight();                       // anywhere near the top of the page
 *   style={{ height: 'var(--app-height)' }}
 */
export const useAppHeight = () => {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const vv = window.visualViewport;

    const setHeight = () => {
      // Prefer visualViewport; fall back to innerHeight where unsupported.
      const height = vv?.height ?? window.innerHeight;
      document.documentElement.style.setProperty('--app-height', `${height}px`);
    };

    setHeight();

    // iOS settles the viewport asynchronously after a dialog dismiss or
    // orientation change — re-measure a couple of times to catch the final size.
    const setHeightDeferred = () => {
      setHeight();
      setTimeout(setHeight, 100);
      setTimeout(setHeight, 250);
      setTimeout(setHeight, 500);
      setTimeout(setHeight, 800);
    };

    if (vv) {
      vv.addEventListener('resize', setHeight);
      vv.addEventListener('scroll', setHeight);
    }
    window.addEventListener('resize', setHeight);
    window.addEventListener('orientationchange', setHeightDeferred);
    document.addEventListener('visibilitychange', setHeightDeferred);

    return () => {
      if (vv) {
        vv.removeEventListener('resize', setHeight);
        vv.removeEventListener('scroll', setHeight);
      }
      window.removeEventListener('resize', setHeight);
      window.removeEventListener('orientationchange', setHeightDeferred);
      document.removeEventListener('visibilitychange', setHeightDeferred);
    };
  }, []);
};
