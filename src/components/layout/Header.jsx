"use client";
import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import logo from "@/assets/svg/pyzo-logo.svg";
import { decodeJWT } from "@/utils/jwt";
import userIcon from "@/assets/svg/user.svg";
import { trackLogout } from "@/utils/authTracking";
import Image from "next/image";
import hamburger from "@/assets/svg/hamburger.svg";
import Lottie from "lottie-react";
import spinnerAnimation from "@/assets/json/spinner.json";

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
  const dropdownRef = useRef(null);

  // Check if sidebar should be hidden (and thus menu button too)
  const hideSidebarRoutes = ['/lectures/', '/assessment/', '/login'];
  const shouldHideMenuButton = hideSidebarRoutes.some(route => pathname.includes(route));

  // Get user info from JWT token
  useEffect(() => {
    const tokens = JSON.parse(
      localStorage.getItem("trainboost_tokens") || "{}"
    );
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

  const handleLogout = async () => {
    setIsLoggingOut(true);

    // Get user ID for tracking before clearing tokens
    const tokens = JSON.parse(
      localStorage.getItem("trainboost_tokens") || "{}"
    );
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
    <header className={`fixed top-0 right-0 flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#f1f2f4] px-4 md:px-6 py-2 bg-white backdrop-blur-sm z-50 ${shouldHideMenuButton ? 'left-0' : 'left-0 md:left-[200px]'} ${pathname.startsWith("/lectures")?"hidden lg:flex":""}`}>
      {/* Left side - Menu button */}
      <div className="flex items-center gap-3 md:flex-1">
        {/* Mobile Menu Button - Hidden on certain routes */}
        {!shouldHideMenuButton && (
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            <Image src={hamburger} alt="Menu" width={24} height={24} />
          </button>
        )}

        {/* Logo - Only visible on desktop for /lectures page */}
        {pathname.includes('/lectures/') && (
          <div
            className="hidden md:block cursor-pointer"
            onClick={() => router.push("/")}
          >
            <Image src={logo} height={20} width={46} alt="Pyzo Logo" />
          </div>
        )}
      </div>

      {/* Center - Logo on mobile only */}
      <div
        className="md:hidden absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer"
        onClick={() => router.push("/")}
      >
        <Image src={logo} height={20} width={46} alt="Pyzo Logo" />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-10">
        <nav className="flex items-center gap-5">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`font-lato font-semibold text-[14px] leading-[100%] tracking-[0.02em] ${
                  isActive
                    ? "text-primary "
                    : "text-primary-text hover:text-primary"
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>
     
        <div className="relative" ref={dropdownRef}>
          <Image
            className="cursor-pointer w-8 h-8 rounded-full"
            src={userIcon}
            alt="User"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          />
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg py-1 z-50">
              <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                <div className="font-medium">{userInfo.name}</div>
                <div className="text-gray-500 break-all">{userInfo.email}</div>
              </div>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="cursor-pointer w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoggingOut && (
                  <Lottie
                    animationData={spinnerAnimation}
                    className="h-4 w-4"
                    loop={true}
                  />
                )}
                {isLoggingOut ? "Signing out..." : "Sign out"}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
