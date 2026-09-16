"use client";

import { useState, createContext, useContext } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import { useSelector } from "react-redux";

const SidebarContext = createContext();

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within LayoutWrapper");
  }
  return context;
};

export default function LayoutWrapper({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const pathname = usePathname();
  const orgConfig = useSelector((state) => state.organization?.config);

  // Check if sidebar should be hidden
  const hideSidebarRoutes = ["/lectures/", "/assessment/", "/login"];
  const shouldHideSidebar = orgConfig?.disable_sidebar || hideSidebarRoutes.some((route) =>
    pathname.includes(route)
  );

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => !prev);
  };

  return (
    <SidebarContext.Provider
      value={{ toggleSidebar, closeSidebar, isSidebarCollapsed, toggleSidebarCollapse, shouldHideSidebar }}>
      {!shouldHideSidebar && (
        <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} isCollapsed={isSidebarCollapsed} />
      )}
      <div
        className={`transition-all duration-300 ${
          shouldHideSidebar ? "" : isSidebarCollapsed ? "md:ml-[70px]" : "md:ml-[200px]"
        }`}>
        {children}
      </div>
    </SidebarContext.Provider>
  );
}
