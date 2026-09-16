"use client";
import React, { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { decodeJWT } from "@/utils/jwt";
import { getAuthTokens } from "@esmagico/pyzo-auth-sdk";
import { logout } from "@/utils/auth";
import Image from "next/image";
import hamburger from "@/assets/svg/hamburger.svg";
import logo from "@/assets/svg/pyzo-atlas-logo.svg";
import LogoutModal from "@/components/ui/auth/LogoutModal";
import { LuChevronsLeft } from "react-icons/lu";
import NotificationDrawer from "./NotificationDrawer";
import notification from "@/assets/svg/notification.svg";
import { useNotifications } from "@/hooks/useNotifications";
import { useTranslation } from "react-i18next";
import { useGetOrganizationConfigQuery } from "@/store/api/organizationsApi";
import { useSidebar } from "./LayoutWrapper";
import { useOverlayTransition } from "@/hooks/useOverlayTransition";

/** "Ankit Kumar" -> "AK"; falls back to the first two letters for a single word. */
function getInitials(name) {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Visual chrome (48px height, avatar-initials dropdown, collapse toggle)
// ported from pyzo-central-frontend's Header.tsx so switching tabs between
// PYZO products doesn't feel like a different app. Notification bell +
// org-config gating stay Atlas's own, real functionality.
const Header = ({ onMenuClick }) => {
  const pathname = usePathname();
  const { isSidebarCollapsed, toggleSidebarCollapse, shouldHideSidebar } = useSidebar();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [userInfo, setUserInfo] = useState({ name: "", email: "" });
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [token, setToken] = useState(null);
  const { notifications, unreadCount, markAsRead, loadMore, hasMore, loading } = useNotifications(token);
  const { t } = useTranslation();
  const { shouldRender, transitionStyle, dropdownTransitionClassName } = useOverlayTransition(isDropdownOpen, false);

  const { data: orgConfig } = useGetOrganizationConfigQuery(undefined, {
    skip: !token,
  });

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      typeof Notification !== "undefined" &&
      Notification.permission === "default"
    ) {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const tokens = getAuthTokens() || {};
    if (tokens.access_token) {
      setToken(tokens.access_token);
      const decoded = decodeJWT(tokens.access_token);
      if (decoded) {
        setUserInfo({
          name: decoded.name || decoded.preferred_username || t("header.user"),
          email: decoded.email || "",
        });
      }
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogoutClick = () => {
    setIsDropdownOpen(false);
    setIsLogoutModalOpen(true);
  };

  const confirmLogout = async () => {
    setIsLoggingOut(true);
    setIsLogoutModalOpen(false);
    localStorage.removeItem("trainboost_conversation_history");
    setIsDropdownOpen(false);
    logout("/login");
  };

  const hideMenuButton = orgConfig?.disable_sidebar || shouldHideSidebar;

  return (
    <header
      className={`fixed top-0 right-0 h-12 flex items-center justify-between whitespace-nowrap border-b border-[#E5E7EB] px-4 md:px-6 bg-white z-[120] transition-all duration-300 ${
        hideMenuButton ? "left-0" : isSidebarCollapsed ? "left-0 md:left-[70px]" : "left-0 md:left-[200px]"
      } ${pathname.startsWith("/lectures") ? "hidden lg:flex" : ""}`}>
      <div className="flex items-center gap-2 md:gap-4">
        {/* Mobile Menu Button */}
        {!hideMenuButton && (
          <button
            onClick={onMenuClick}
            className="md:hidden p-1.5 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu">
            <Image src={hamburger} alt="Menu" width={24} height={24} />
          </button>
        )}

        {/* Sidebar Collapse Toggle — desktop only */}
        {!hideMenuButton && (
          <button
            onClick={toggleSidebarCollapse}
            className={`hidden md:flex p-1.5 text-[#5F6069] hover:bg-gray-100 rounded-md transition-all duration-300 cursor-pointer ${
              isSidebarCollapsed ? "rotate-180" : ""
            }`}
            aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}>
            <LuChevronsLeft className="w-4 h-4" />
          </button>
        )}

        {/* Sidebar is hidden on the lecture player — keep branding visible here instead. */}
        {pathname.includes("/lectures/") && !orgConfig?.disable_logo && (
          <Image src={logo} height={28} width={103} alt="Pyzo Logo" />
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Notification Icon */}
        {!orgConfig?.disable_notification && (
          <div
            className="flex items-center justify-center w-10 h-10 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors p-2"
            onClick={() => setIsNotificationOpen(true)}>
            <div className="relative w-6 h-6 flex items-center justify-center">
              <Image src={notification} alt="Notification" width={18} height={18} className="object-contain" />
              {unreadCount > 0 && (
                <div className="absolute left-[13px] top-[-3px] flex flex-col justify-center items-center px-1.5 py-0.5 bg-[#FF7676] rounded-[4px] min-w-[14px] h-[14px] z-10">
                  <span className="font-lato font-semibold text-[10px] leading-tight text-white">{unreadCount}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Avatar + dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            aria-label="Account menu"
            className="w-7 h-7 shrink-0 flex items-center justify-center rounded-full bg-primary cursor-pointer transition-opacity hover:opacity-90"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
            <span className="font-lato font-semibold text-[12px] leading-[14px] text-white text-center">
              {getInitials(userInfo.name) || "?"}
            </span>
          </button>

          {shouldRender && (
            <div
              className={`absolute right-0 top-[calc(100%+2px)] w-[240px] origin-top-right bg-white border border-[#E7E9EE] rounded-[12px] flex flex-col z-[70] ${dropdownTransitionClassName}`}
              style={{ boxShadow: "0px 1px 4px rgba(0,0,0,0.04), 0px 4px 16px rgba(0,0,0,0.08)", ...transitionStyle }}>
              <div className="flex items-center gap-3 px-4 py-3 w-full">
                <span className="w-8 h-8 shrink-0 flex items-center justify-center rounded-full bg-primary">
                  <span className="font-lato font-semibold text-[13px] leading-[16px] text-white text-center">
                    {getInitials(userInfo.name) || "?"}
                  </span>
                </span>
                <div className="flex flex-col gap-1 overflow-hidden">
                  <div className="font-lato font-bold text-[13px] leading-[16px] text-[#1E293B] truncate">
                    {userInfo.name}
                  </div>
                  {userInfo.email && (
                    <div className="font-lato font-normal text-[12px] leading-[14px] text-[#64748B] truncate">
                      {userInfo.email}
                    </div>
                  )}
                </div>
              </div>

              <div className="w-full h-px bg-[#F1F5F9]" />

              <button
                onClick={handleLogoutClick}
                disabled={isLoggingOut}
                className="flex items-center gap-1 px-4 py-3 w-full cursor-pointer hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <span className="font-lato font-medium text-[12px] leading-[14px] text-[#E05345]">
                  {isLoggingOut ? t("header.signingOut") : t("header.logOut")}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      <LogoutModal isOpen={isLogoutModalOpen} onClose={() => setIsLogoutModalOpen(false)} onConfirm={confirmLogout} />

      <NotificationDrawer
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        notifications={notifications}
        unreadCount={unreadCount}
        markAsRead={markAsRead}
        hasMore={hasMore}
        loadMore={loadMore}
        loading={loading}
      />
    </header>
  );
};

export default Header;
