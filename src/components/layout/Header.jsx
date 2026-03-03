"use client";
import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import logo from "@/assets/svg/pyzo-logo.svg";
import { decodeJWT } from "@/utils/jwt";
import user_icon from "@/assets/svg/user-icon.svg";
import { trackLogout } from "@/utils/authTracking";
import Image from "next/image";
import hamburger from "@/assets/svg/hamburger.svg";
import Lottie from "lottie-react";
import spinnerAnimation from "@/assets/json/spinner.json";
import logout_icon from "@/assets/svg/logout.svg";
import reset_password_icon from "@/assets/svg/reset-password.svg";
import { useForgotPasswordMutation } from "@/store/api/authApi";
import { toast } from "react-toastify";
import PasswordResetModal from "@/components/ui/auth/PasswordResetModal";
import LogoutModal from "@/components/ui/auth/LogoutModal";

const navigation = [
  // { name: "Home", href: "/" },
  // { name: "Assessment", href: "/assessment" },
  // { name: 'Resources', href: '/' },
  // { name: 'Community', href: '/' },
];

const Header = ({ onMenuClick }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userInfo, setUserInfo] = useState({ name: "", email: "" });
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [forgotPassword, { isLoading: isResetLoading }] = useForgotPasswordMutation();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("reset_pending") === "true") {
      setShowResetModal(true);
    }
  }, []);

  // Check if sidebar should be hidden (and thus menu button too)
  const hideSidebarRoutes = ["/lectures/", "/assessment/", "/login"];
  const shouldHideMenuButton = hideSidebarRoutes.some((route) => pathname.includes(route));

  // Get user info from JWT token
  useEffect(() => {
    const tokens = JSON.parse(localStorage.getItem("trainboost_tokens") || "{}");
    if (tokens.access_token) {
      const decoded = decodeJWT(tokens.access_token);
      if (decoded) {
        setUserInfo({
          name: decoded.name || decoded.preferred_username || "User",
          email: decoded.email || "",
        });
      }
    }
  }, []);

  // Close dropdown when clicking outside
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

  const handleResetPassword = async () => {
    if (!userInfo.email || isResetLoading) return;
    try {
      await forgotPassword({ email: userInfo.email }).unwrap();
      setIsDropdownOpen(false);
      toast.success("Password reset link sent successfully.");

      // Add param to URL and open modal
      const url = new URL(window.location.href);
      url.searchParams.set("reset_pending", "true");
      window.history.pushState({}, "", url.toString());
      setShowResetModal(true);
    } catch (error) {
      toast.error(error?.data?.error || error?.data?.message || "Failed to initiate reset password.");
    }
  };

  const handleLogoutClick = () => {
    setIsDropdownOpen(false);
    setIsLogoutModalOpen(true);
  };

  const confirmLogout = async () => {
    setIsLoggingOut(true);
    setIsLogoutModalOpen(false);

    // Get user ID for tracking before clearing tokens
    const tokens = JSON.parse(localStorage.getItem("trainboost_tokens") || "{}");
    let userId = null;
    if (tokens.access_token) {
      const decoded = decodeJWT(tokens.access_token);
      userId = decoded?.sub;
    }

    // Track session end event
    if (userId) {
      trackLogout(userId);
    }

    // try {
    //   if (tokens.refresh_token) {
    //     const response = await fetch('https://xstk67r5-3001.inc1.devtunnels.ms/auth/logout', {
    //       method: 'POST',
    //       headers: {
    //         'Content-Type': 'application/json',
    //       },
    //       body: JSON.stringify({ refresh_token: tokens.refresh_token }),
    //     });

    //     if (response.ok) {
    localStorage.removeItem("trainboost_tokens");
    // Clear conversation history on logout
    localStorage.removeItem("trainboost_conversation_history");
    setIsDropdownOpen(false);
    router.push("/login");
    //     }
    //   }
    // } catch (error) {
    //   console.log('Logout API error:', error);
    // } finally {
    //   setIsLoggingOut(false);
    // }
  };

  return (
    <header
      className={`fixed top-0 right-0 h-12 flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#E5E7EB] px-4 md:px-5 bg-white backdrop-blur-sm z-50 ${shouldHideMenuButton ? "left-0" : "left-0 md:left-[200px]"} ${pathname.startsWith("/lectures") ? "hidden lg:flex" : ""}`}>
      {/* Left side - Menu button */}
      <div className="flex items-center gap-3 md:flex-1">
        {/* Mobile Menu Button - Hidden on certain routes */}
        {!shouldHideMenuButton && (
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu">
            <Image src={hamburger} alt="Menu" width={24} height={24} />
          </button>
        )}

        {/* Logo - Only visible on desktop for /lectures page */}
        {pathname.includes("/lectures/") && (
          <div className="hidden md:block cursor-pointer" onClick={() => router.push("/")}>
            <Image src={logo} height={20} width={46} alt="Pyzo Logo" />
          </div>
        )}
      </div>

      {/* Center - Logo on mobile only */}
      <div
        className="md:hidden absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer"
        onClick={() => router.push("/")}>
        <Image src={logo} height={20} width={46} alt="Pyzo Logo" />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-6">
        <nav className="flex items-center gap-5">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`font-lato font-semibold text-[14px] leading-[100%] tracking-[0.02em] ${
                  isActive ? "text-primary " : "text-primary-text hover:text-primary"
                }`}>
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="relative" ref={dropdownRef}>
          <div
            className="flex items-center gap-1 cursor-pointer py-[5px] px-[5px] bg-white border border-[#E3E7EF] rounded-full hover:bg-gray-50 transition-colors"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
            <Image src={user_icon} alt="user-icon" width={22} height={22} />
            <span className="font-mulish font-semibold text-[12px] leading-[15px] text-[#1D1F2C]">
              {userInfo.name || "User"}
            </span>
            <svg
              className={`w-4 h-4 text-[#4A4C56] transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.8} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-[244px] bg-white border border-[#ECECEC] shadow-[0px_3px_8px_rgba(0,0,0,0.12)] rounded-[10px] p-[12px] flex flex-col gap-[10px] z-[70] font-lato">
              {/* User Info Section */}
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

              <div className="flex flex-col gap-[10px] items-start w-full">
                {/* Reset Password */}
                <button
                  className="flex items-center gap-[4px] w-full cursor-pointer hover:bg-gray-50 transition-colors py-1 disabled:opacity-50"
                  onClick={handleResetPassword}
                  disabled={isResetLoading}>
                  <Image src={reset_password_icon} alt="reset-password-icon" width={16} height={16} />
                  <span className="text-[12px] font-medium text-[rgba(26,28,41,0.7)] leading-[14px]">
                    {isResetLoading ? "Initialising..." : "Reset Password"}
                  </span>
                </button>

                <div className="flex flex-col gap-[10px] w-full">
                  {/* Divider */}
                  <div className="w-full h-[1px] bg-[#E5E7EB]" />

                  {/* Logout Button */}
                  <button
                    onClick={handleLogoutClick}
                    disabled={isLoggingOut}
                    className="flex items-center gap-[8px] w-full cursor-pointer hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-[#F04638]">
                    <Image src={logout_icon} alt="logout-icon" width={16} height={16} />
                    <span className="text-[12px] font-normal leading-[14px] text-[#F04638]">
                      {isLoggingOut ? "Signing out..." : "Log Out"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <LogoutModal isOpen={isLogoutModalOpen} onClose={() => setIsLogoutModalOpen(false)} onConfirm={confirmLogout} />

      <PasswordResetModal
        isOpen={showResetModal}
        email={userInfo.email}
        onClose={() => {
          setShowResetModal(false);
          const url = new URL(window.location.href);
          url.searchParams.delete("reset_pending");
          window.history.pushState({}, "", url.toString());
        }}
      />
    </header>
  );
};

export default Header;
