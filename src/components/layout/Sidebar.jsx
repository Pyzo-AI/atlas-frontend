"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

const Sidebar = ({ isOpen = false, onClose }) => {
  const pathname = usePathname();

  // Hide sidebar on certain routes
  const hideSidebarRoutes = ['/lectures/', '/login'];
  const shouldHideSidebar = hideSidebarRoutes.some(route => pathname.includes(route));

  if (shouldHideSidebar) {
    return null;
  }

  const menuItems = [
    // {
    //   name: "Analytics",
    //   href: "/analytics?tab=learning",
    //   icon: "/icon.png",
    //   activeIcon: "/icon.png",
    // },
    {
      name: "Modules",
      href: "/",
      icon: "/icon.png",
      activeIcon: "/icon.png",
    },
    {
      name: "Assessments",
      href: "/assessments",
      icon: "/icon.png",
      activeIcon: "/icon.png",
    },
    {
      name: "Users",
      href: "/users",
      icon: "/icon.png",
      activeIcon: "/icon.png",
    },
  ];

  const isActive = (href) => {
    const basePath = href.split('?')[0];
    return pathname === basePath || pathname.startsWith(basePath + "/");
  };

  const handleLinkClick = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* Transparent clickable area for mobile - closes sidebar when clicking outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 bottom-0 w-[200px] bg-white shadow-[2.81525px_0px_21.1144px_rgba(131,98,234,0.05)] flex flex-col z-50 transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        {/* Main Content */}
        <div className="flex flex-col">
          {/* Logo Section */}
          <div className="flex flex-col justify-center items-start p-3 px-4 h-[68px]">
            <div className="flex items-center gap-1">
              {/* Logo Icon */}
              <Image src="/icon.png" height={25} width={58} alt="Upskillr Logo" />
            </div>
          </div>

          {/* Menu Section */}
          <div className="flex flex-col gap-2 px-0">
            {menuItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={handleLinkClick}
                  className={`relative flex items-center px-4 py-2 mx-0 h-9 rounded-md transition-all duration-200 ${
                    active
                      ? "bg-[rgba(39,98,234,0.1)] text-[#2762EA]"
                      : "text-[rgba(26,28,41,0.8)] hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4">
                      <Image
                        src={active ? item.activeIcon : item.icon}
                        width={16}
                        height={16}
                        alt={item.name}
                      />
                    </div>
                    <span className="text-xs font-medium leading-[150%] font-lato">
                      {item.name}
                    </span>
                  </div>
                  {/* Active Indicator */}
                  {active && (
                    <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-[3px] h-[27px] bg-[#2762EA] rounded-l-lg" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
