"use client";
import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import trainBoostLogo from "@/assets/svg/train-boost-logo.svg";
import { decodeJWT } from "@/utils/jwt";
import userIcon from "@/assets/svg/user.svg"; 

const navigation = [
  { name: "Home", href: "/" },
  // { name: "Assessment", href: "/assessment" },
  // { name: 'Resources', href: '/' },
  // { name: 'Community', href: '/' },
];

const Header = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userInfo, setUserInfo] = useState({ name: '', email: '' });
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const dropdownRef = useRef(null);

  // Get user info from JWT token
  useEffect(() => {
    const tokens = JSON.parse(localStorage.getItem("trainboost_tokens") || '{}');
    if (tokens.access_token) {
      const decoded = decodeJWT(tokens.access_token);
      if (decoded) {
        setUserInfo({
          name: decoded.name || decoded.preferred_username || 'User',
          email: decoded.email || ''
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
    // try {
    //   const tokens = JSON.parse(localStorage.getItem("trainboost_tokens") || '{}');
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
    <header className="fixed top-0 left-0 right-0 flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#f1f2f4] px-10 py-2 bg-white/80 backdrop-blur-sm z-50">
      <div className="flex items-center gap-1 text-[#121416] cursor-pointer"
      onClick={() => router.push("/")}
      >
        <img
          className="w-6 h-6"
          src={trainBoostLogo.src}
          alt="trainBoostLogo"
        />
        <h2 className="text-[16px] font-lato font-bold leading-[100%] tracking-[0.02em]">
          Train Boost
        </h2>
      </div>
      <div className="flex flex-1 justify-end gap-10">
        <nav className="flex items-center gap-5">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`font-lato font-semibold text-[14px] leading-[100%] tracking-[0.02em] ${
                  isActive 
                    ? 'text-blue-600 ' 
                    : 'text-[#1A1C29] hover:text-blue-600'
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>
        {/* <button className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 bg-[#f1f2f4] gap-2 text-sm font-bold leading-normal tracking-[0.015em] min-w-0 px-2.5">
          <div data-icon="Bell" data-size="20px" data-weight="regular">
            <svg xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" fill="currentColor" viewBox="0 0 256 256">
              <path d="M221.8,175.94C216.25,166.38,208,139.33,208,104a80,80,0,1,0-160,0c0,35.34-8.26,62.38-13.81,71.94A16,16,0,0,0,48,200H88.81a40,40,0,0,0,78.38,0H208a16,16,0,0,0,13.8-24.06ZM128,216a24,24,0,0,1-22.62-16h45.24A24,24,0,0,1,128,216ZM48,184c7.7-13.24,16-43.92,16-80a64,64,0,1,1,128,0c0,36.05,8.28,66.73,16,80Z"/>
            </svg>
          </div>
        </button> */}
        <div className="relative" ref={dropdownRef}>
          <img
            className="cursor-pointer w-10 h-10 rounded-full"
            src={userIcon.src}
            alt="User"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          />
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg py-1 z-50">
              <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                <div className="font-medium">{userInfo.name}</div>
                <div className="text-gray-500 break-all">
                  {userInfo.email}
                </div>
              </div>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="cursor-pointer w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoggingOut && (
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {isLoggingOut ? 'Signing out...' : 'Sign out'}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
