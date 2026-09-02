"use client";
import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocalizedRouter } from "@/hooks/useLocalizedRouter";
import logo from "@/assets/svg/pyzo-atlas-logo.svg";
import { decodeJWT } from "@/utils/jwt";
import { getAuthTokens } from "@esmagico/pyzo-auth-sdk";
import user_icon from "@/assets/svg/user-icon.svg";
import { trackLogout } from "@/utils/authTracking";
import { logout } from "@/utils/auth";
import Image from "next/image";
import hamburger from "@/assets/svg/hamburger.svg";
import logout_icon from "@/assets/svg/logout.svg";
import { toast } from "react-toastify";
import LogoutModal from "@/components/ui/auth/LogoutModal";
import { FiChevronDown } from "react-icons/fi";
import NotificationDrawer from "./NotificationDrawer";
import notification from "@/assets/svg/notification.svg";
import { useNotifications } from "@/hooks/useNotifications";
import { useTranslation } from "react-i18next";
import { useGetOrganizationConfigQuery } from "@/store/api/organizationsApi";

const navigation = [
  // { name: "Home", href: "/" },
  // { name: "Assessment", href: "/assessment" },
  // { name: 'Resources', href: '/' },
  // { name: 'Community', href: '/' },
];

const Header = ({ onMenuClick }) => {
  const router = useLocalizedRouter();
  const { localizePath } = router;
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [userInfo, setUserInfo] = useState({ name: "", email: "" });
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [token, setToken] = useState(null);
  const { notifications, unreadCount, markAsRead, refresh, loadMore, hasMore, loading } = useNotifications(token);
  const { t } = useTranslation();

  // Fetch organization config
  const { data: orgConfig } = useGetOrganizationConfigQuery(undefined, {
    skip: !token, // Only fetch if we have a token
  });

  useEffect(() => {
    if (orgConfig) {
      console.log("Organization Config API Response:", orgConfig);
    }
  }, [orgConfig]);

useEffect(() => {
  if (
    typeof window !== "undefined" &&
    typeof Notification !== "undefined" &&
    Notification.permission === "default"
  ) {
    Notification.requestPermission();
  }
}, []);



  const hideSidebarRoutes = ["/lectures/", "/assessment/", "/login"];
  const shouldHideMenuButton = orgConfig?.disable_sidebar || hideSidebarRoutes.some((route) => pathname.includes(route));

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
    localStorage.removeItem("trainboost_conversation_history");
    setIsDropdownOpen(false);
    // logout() itself redirects to loginUrl once it's done, so this only
    // resolves — and the modal only closes — after that navigation would
    // already be underway; kept for the (rare) case it doesn't.
    await logout("/login");
    // Keep the loader up for a bit past whatever the request itself took, so
    // a fast response doesn't just flash the spinner for a frame.
    await new Promise((resolve) => setTimeout(resolve, 300));
    setIsLoggingOut(false);
    setIsLogoutModalOpen(false);
  };

  return (
    <header
      className={`fixed top-0 right-0 h-12 flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#E5E7EB] px-4 md:px-5 bg-white backdrop-blur-sm z-50 ${shouldHideMenuButton ? "left-0" : "left-0 md:left-[200px]"} ${pathname.startsWith("/lectures") ? "hidden lg:flex" : ""}`}>
      <div className="flex items-center gap-2 md:gap-3 md:flex-1">
        {/* Mobile Menu Button - Hidden on certain routes */}
        {!shouldHideMenuButton && (
          <button
            onClick={onMenuClick}
            className="md:hidden p-1.5 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu">
            <Image src={hamburger} alt="Menu" width={24} height={24} />
          </button>
        )}

        {/* Logo - Always visible on mobile, visible on desktop for /lectures page */}
        {!orgConfig?.disable_logo && (
          <div
            className={`cursor-pointer ${pathname.includes("/lectures/") ? "" : "md:hidden"}`}
            onClick={() => router.push("/")}>
            <Image src={logo} height={28} width={103} alt="Pyzo Logo" />
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <nav className="flex items-center gap-5">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={localizePath(item.href)}
                className={`font-lato font-semibold text-[14px] leading-[100%] tracking-[0.02em] ${
                  isActive ? "text-primary " : "text-primary-text hover:text-primary"
                }`}>
                {item.name}
              </Link>
            );
          })}
        </nav>

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

        <div className="relative" ref={dropdownRef}>
          <div
            className="flex items-center gap-1 cursor-pointer py-[5px] px-[5px] bg-white border border-[#E3E7EF] rounded-full hover:bg-gray-50 transition-colors"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
            <Image src={user_icon} alt="user-icon" width={22} height={22} />
            <span className="hidden lg:block font-mulish font-semibold text-[12px] leading-[15px] text-[#1D1F2C]">
              {userInfo.name || t("header.user")}
            </span>
            <FiChevronDown
              className={`hidden lg:block w-4 h-4 text-[#4A4C56] transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
            />
          </div>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-[244px] bg-white border border-[#ECECEC] shadow-[0px_3px_8px_rgba(0,0,0,0.12)] rounded-[10px] px-3 pt-3 pb-2 flex flex-col gap-[10px] z-[70] font-lato">
              <div className="flex items-center gap-[6px] w-full">
                <Image src={user_icon} alt="user-icon" width={36} height={36} />
                <div className="flex flex-col gap-[1px] overflow-hidden">
                  <div className="text-[14px] font-semibold text-[#1D1F2C] leading-[17px] truncate">
                    {userInfo.name}
                  </div>
                  {userInfo.email && (
                    <div className="text-[12px] font-normal text-[#585858] leading-[14px] truncate">
                      {userInfo.email}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-[10px] items-start w-full">                <div className="flex flex-col gap-1.5 w-full">
                  <div className="w-full h-[1px] bg-[#E5E7EB]" />
                  <button
                    onClick={handleLogoutClick}
                    disabled={isLoggingOut}
                    className="py-1 flex items-center gap-[8px] w-full cursor-pointer hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-[#F04638]">
                    <Image src={logout_icon} alt="logout-icon" width={16} height={16} />
                    <span className="text-[12px] font-normal leading-[14px] text-[#F04638]">
                      {isLoggingOut ? t("header.signingOut") : t("header.logOut")}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={confirmLogout}
        isLoggingOut={isLoggingOut}
      />

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
