"use client";

import { useState, createContext, useContext } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Header from "./Header";

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
  const pathname = usePathname();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  // Check if sidebar should be hidden
  const hideSidebarRoutes = ["/lectures/", "/assessment/", "/login"];
  const shouldHideSidebar = hideSidebarRoutes.some((route) =>
    pathname.includes(route)
  );

  return (
    <SidebarContext.Provider value={{ toggleSidebar, closeSidebar }}>
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      <div className={shouldHideSidebar ? "" : "md:ml-[200px]"}>
        {children}
      </div>
    </SidebarContext.Provider>
  );
}
