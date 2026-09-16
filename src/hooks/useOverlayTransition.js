"use client";

import { useEffect, useLayoutEffect, useReducer } from "react";

// Edit this configuration to change dropdown open/close animation everywhere.
export const OVERLAY_ANIMATION = {
  openDuration: 350,
  closeDuration: 200,
  backdrop: {
    open: "transition-opacity ease-out opacity-100",
    close: "transition-opacity ease-in opacity-0",
  },
  leftDrawer: {
    open: "transition-all ease-out opacity-100 translate-x-0",
    close: "transition-all ease-in opacity-0 -translate-x-full",
  },
  dropdown: {
    open: "transition-all ease-out opacity-100 scale-100 translate-y-0",
    close: "transition-all ease-in opacity-0 scale-95 -translate-y-1 pointer-events-none",
  },
};

let bodyScrollLockCount = 0;
let previousBodyOverflow = "";
let previousHtmlOverflow = "";

const lockBodyScroll = () => {
  if (bodyScrollLockCount === 0) {
    previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    previousHtmlOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
  }
  bodyScrollLockCount += 1;
};

const unlockBodyScroll = () => {
  bodyScrollLockCount = Math.max(0, bodyScrollLockCount - 1);
  if (bodyScrollLockCount === 0) {
    document.body.style.overflow = previousBodyOverflow;
    document.documentElement.style.overflow = previousHtmlOverflow;
  }
};

const transitionReducer = (state, action) => {
  switch (action.type) {
    case "open":
      return { shouldRender: true, isVisible: false };
    case "visible":
      return { ...state, isVisible: true };
    case "close":
      return { ...state, isVisible: false };
    case "unmount":
      return { ...state, shouldRender: false };
    default:
      return state;
  }
};

/** Keeps a dropdown mounted long enough for matching enter and exit transitions. */
export const useOverlayTransition = (isOpen, lockScroll = true) => {
  const [state, dispatch] = useReducer(transitionReducer, {
    shouldRender: false,
    isVisible: false,
  });

  useLayoutEffect(() => {
    if (!state.shouldRender || !lockScroll) return;
    lockBodyScroll();
    return unlockBodyScroll;
  }, [lockScroll, state.shouldRender]);

  useEffect(() => {
    if (isOpen) {
      dispatch({ type: "open" });

      // Wait a second frame so the hidden state has painted before transitioning in,
      // otherwise the browser may skip straight to the visible state.
      let visibleFrame = 0;
      const mountedFrame = requestAnimationFrame(() => {
        visibleFrame = requestAnimationFrame(() => dispatch({ type: "visible" }));
      });

      return () => {
        cancelAnimationFrame(mountedFrame);
        if (visibleFrame) cancelAnimationFrame(visibleFrame);
      };
    }

    dispatch({ type: "close" });
    const timer = setTimeout(() => dispatch({ type: "unmount" }), OVERLAY_ANIMATION.closeDuration);
    return () => clearTimeout(timer);
  }, [isOpen]);

  const transitionStyle = {
    transitionDuration: `${state.isVisible ? OVERLAY_ANIMATION.openDuration : OVERLAY_ANIMATION.closeDuration}ms`,
  };

  const dropdownTransitionClassName = state.isVisible ? OVERLAY_ANIMATION.dropdown.open : OVERLAY_ANIMATION.dropdown.close;
  const backdropTransitionClassName = state.isVisible ? OVERLAY_ANIMATION.backdrop.open : OVERLAY_ANIMATION.backdrop.close;
  const leftDrawerTransitionClassName = state.isVisible ? OVERLAY_ANIMATION.leftDrawer.open : OVERLAY_ANIMATION.leftDrawer.close;

  return { ...state, transitionStyle, dropdownTransitionClassName, backdropTransitionClassName, leftDrawerTransitionClassName };
};
