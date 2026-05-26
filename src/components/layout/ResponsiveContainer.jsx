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
  const shouldShowPadding = (isDesktop || (!isDesktop && isPortrait) || !containLecture) && !isLoginPage;

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
