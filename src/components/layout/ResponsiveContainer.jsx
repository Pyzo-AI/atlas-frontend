"use client";
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useDeviceType } from "@/hooks/useDeviceType";
import { usePortraitMode } from "@/hooks/usePortraitMode";
import { usePathname } from "next/navigation";
import Header from "./Header";
import { useSidebar } from "./LayoutWrapper";
import AccessDeniedState from "@/components/common/AccessDeniedState";
import ErrorState from "@/components/common/ErrorState";
import { setApiErrorStatus } from "@/store/features/accessDeniedSlice";

const ResponsiveContainer = ({ children }) => {
  const { isDesktop } = useDeviceType();
  const isPortrait = usePortraitMode();
  const pathname = usePathname();
  const containLecture = pathname.includes("/lectures/");
  const { toggleSidebar } = useSidebar();
  const dispatch = useDispatch();
  const apiErrorStatus = useSelector((state) => state.accessDenied.status);

  // Navigating to a different page always gets a fresh look at that page's
  // own data, not the previous page's stale error. Only clears on an actual
  // pathname CHANGE, never on initial mount - a plain mount-effect would
  // also fire on first load and could race an already-landed error back to
  // null (query responses can resolve before React settles the mount).
  const prevPathnameRef = useRef(pathname);
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      dispatch(setApiErrorStatus(null));
    }
  }, [pathname, dispatch]);

  const isLoginPage = pathname === "/login" || pathname.endsWith("/login");
  // On mobile portrait lectures the global header is hidden (Header has `hidden lg:flex` on /lectures).
  // Don't add top padding in that case — PortraitLectureView manages its own height.
  const headerHiddenOnMobile = containLecture && !isDesktop;
  const shouldShowPadding = (isDesktop || (!isDesktop && isPortrait) || !containLecture) && !isLoginPage && !headerHiddenOnMobile;

  // Don't show header on login page
  const showHeader = !isLoginPage;

  return (
    <>
      {showHeader && <Header onMenuClick={toggleSidebar} />}
      <div className={`${headerHiddenOnMobile ? "" : "min-h-screen"} ${shouldShowPadding ? "pt-[45px]" : ""}`}>
        {apiErrorStatus === 403 ? (
          <AccessDeniedState />
        ) : apiErrorStatus ? (
          <ErrorState status={apiErrorStatus} onRetry={() => window.location.reload()} />
        ) : (
          children
        )}
      </div>
    </>
  );
};

export default ResponsiveContainer;
