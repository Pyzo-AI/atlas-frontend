"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocalizedRouter } from "@/hooks/useLocalizedRouter";
import Image from "next/image";
import logo from "@/assets/svg/pyzo-atlas-logo.svg";
import modules from "@/assets/svg/modules.svg";
import modulesActive from "@/assets/svg/modules_active.svg";
import assessment from "@/assets/svg/assessment.svg";
import assessmentActive from "@/assets/svg/assessment_active.svg";
import analytics from "@/assets/svg/analytics.svg";
import analyticsActive from "@/assets/svg/analytics_active.svg";
import certificate from "@/assets/svg/certificate.svg";
import certificateActive from "@/assets/svg/certificate_active.svg";
import { useTranslation } from "react-i18next";

const Sidebar = ({ isOpen = false, onClose }) => {
  const pathname = usePathname();
  const { localizePath } = useLocalizedRouter();
  const { t } = useTranslation();

  // Hide sidebar on certain routes
  const hideSidebarRoutes = ["/lectures/", "/login"];
  const shouldHideSidebar = hideSidebarRoutes.some((route) => pathname.includes(route));

  if (shouldHideSidebar) {
    return null;
  }

  const menuItems = [
    {
      name: t("sidebar.modules"),
      href: "/",
      icon: modules,
      activeIcon: modulesActive,
    },
    {
      name: t("sidebar.certificates"),
      href: "/certificates",
      icon: certificate,
      activeIcon: certificateActive,
    },
    {
      name: t("sidebar.analytics"),
      href: "/analytics?tab=learning",
      icon: analytics,
      activeIcon: analyticsActive,
    },
    // {
    //   name: t("sidebar.assessments"),
    //   href: "/assessments",
    //   icon: assessment,
    //   activeIcon: assessmentActive,
    // },
  ];

  const isActive = (href) => {
    const basePath = href.split("?")[0];
    // Strip locale from pathname for comparison (e.g. /en/analytics -> /analytics)
    let normalizedPath = pathname.replace(/^\/[a-z]{2}(\/|$)/, "/");
    if (normalizedPath !== "/" && normalizedPath.endsWith("/")) {
      normalizedPath = normalizedPath.slice(0, -1);
    }
    return normalizedPath === basePath || normalizedPath.startsWith(basePath + "/");
  };

  const handleLinkClick = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* Transparent clickable area for mobile - closes sidebar when clicking outside */}
      {isOpen && <div className="fixed inset-0 z-40 md:hidden" onClick={onClose} />}

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 bottom-0 w-[200px] bg-white shadow-[2.81525px_0px_21.1144px_rgba(131,98,234,0.05)] flex flex-col z-[60] transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}>
        {/* Main Content */}
        <div className="flex flex-col">
          {/* Logo Section */}
          <div className="flex flex-col justify-center items-start p-3 px-4 h-[68px]">
            <div className="flex items-center gap-1">
              {/* Logo Icon */}
              <Image src={logo} height={25} width={92} alt="Pyzo Logo" />
            </div>
          </div>

          {/* Menu Section */}
          <div className="flex flex-col gap-2 px-0">
            {menuItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  href={localizePath(item.href)}
                  onClick={handleLinkClick}
                  className={`relative flex items-center px-4 py-2 mx-0 h-9 rounded-md transition-all duration-200 ${
                    active ? "bg-bg-primary-light text-primary" : "text-text-subtle-alt hover:bg-gray-50"
                  }`}>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4">
                      <Image src={active ? item.activeIcon : item.icon} width={16} height={16} alt={item.name} />
                    </div>
                    <span className="text-xs font-medium leading-[150%] font-lato">{item.name}</span>
                  </div>
                  {/* Active Indicator */}
                  {active && (
                    <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-[3px] h-[27px] bg-primary rounded-l-lg" />
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
