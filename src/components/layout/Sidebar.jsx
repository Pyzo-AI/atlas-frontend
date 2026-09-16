"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocalizedRouter } from "@/hooks/useLocalizedRouter";
import Image from "next/image";
import logo from "@/assets/svg/pyzo-atlas-logo.svg";
import modules from "@/assets/svg/modules.svg";
import modulesActive from "@/assets/svg/modules_active.svg";
import certificate from "@/assets/svg/certificate.svg";
import certificateActive from "@/assets/svg/certificate_active.svg";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import SidebarToolsSwitcher from "@/components/common/SidebarToolsSwitcher";
import Tooltip from "@/components/common/Tooltip";
import { useOverlayTransition } from "@/hooks/useOverlayTransition";

// Visual chrome (widths, colors, collapse behavior, tools switcher) ported
// from pyzo-central-frontend's Sidebar.tsx so switching tabs between PYZO
// products doesn't feel like a different app. Menu items stay Atlas's own.
const Sidebar = ({ isOpen = false, onClose, isCollapsed = false }) => {
  const pathname = usePathname();
  const { localizePath } = useLocalizedRouter();
  const { t } = useTranslation();
  const orgConfig = useSelector((state) => state.organization?.config);
  const { shouldRender: shouldRenderMobileOverlay, transitionStyle, backdropTransitionClassName, leftDrawerTransitionClassName } =
    useOverlayTransition(isOpen);

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
      {/* Overlay for mobile */}
      {shouldRenderMobileOverlay && (
        <div
          className={`fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden ${backdropTransitionClassName}`}
          style={transitionStyle}
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 bottom-0 bg-white shadow-[2.81525px_0px_21.1144px_rgba(131,98,234,0.05)] flex flex-col z-[60] ${leftDrawerTransitionClassName} ${
          isCollapsed ? "w-[70px]" : "w-[200px]"
        } md:translate-x-0 md:opacity-100`}
        style={transitionStyle}>
        {/* Main Content */}
        <div className="flex flex-col gap-2">
          {/* Logo + tools switcher */}
          <div className={`flex items-center ${isCollapsed ? "justify-center" : "justify-between"} px-4 py-3 h-[48px] relative`}>
            {!isCollapsed && !orgConfig?.disable_logo && (
              <Image src={logo} height={25} width={92} alt="Pyzo Logo" className="shrink-0" unoptimized />
            )}
            <SidebarToolsSwitcher isCollapsed={isCollapsed} />
          </div>

          {/* Menu Section */}
          <div className="flex flex-col gap-2">
            {menuItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Tooltip key={item.name} content={item.name} position="right" disabled={!isCollapsed} className="w-full">
                  <Link
                    href={localizePath(item.href)}
                    onClick={handleLinkClick}
                    className={`relative flex items-center w-full h-9 transition-all duration-200 ${
                      isCollapsed ? "justify-center mx-2 px-0 rounded-lg" : "px-4 py-2"
                    } ${active ? "bg-[rgba(40,119,238,0.1)]" : "hover:bg-gray-100"}`}>
                    <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-1"}`}>
                      <div className="w-4 h-4 flex items-center justify-center shrink-0">
                        <Image src={active ? item.activeIcon : item.icon} width={16} height={16} alt={item.name} unoptimized />
                      </div>
                      {!isCollapsed && (
                        <span
                          className={`text-xs leading-[150%] whitespace-nowrap font-lato ${
                            active ? "font-semibold text-[#2877EE]" : "font-medium text-[rgba(26,28,41,0.8)]"
                          }`}>
                          {item.name}
                        </span>
                      )}
                    </div>

                    {/* Active Indicator */}
                    {active && (
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-[27px] bg-[#2877EE] rounded-l-[8px]" />
                    )}
                  </Link>
                </Tooltip>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
