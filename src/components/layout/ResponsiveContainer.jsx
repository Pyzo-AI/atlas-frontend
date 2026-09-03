"use client";
import { useDeviceType } from "@/hooks/useDeviceType";
import { usePortraitMode } from "@/hooks/usePortraitMode";
import { usePathname } from "next/navigation";
import Header from "./Header";
import { useSidebar } from "./LayoutWrapper";

const ResponsiveContainer = ({ children }) => {
  const { isDesktop } = useDeviceType();
  const isPortrait = usePortraitMode();
  const pathname = usePathname();
  const containLecture = pathname.includes("/lectures/");
  const { toggleSidebar } = useSidebar();

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
      <div className={`min-h-screen ${shouldShowPadding ? "pt-[45px]" : ""}`}>{children}</div>
    </>
  );
};

export default ResponsiveContainer;
