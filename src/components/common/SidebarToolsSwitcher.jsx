"use client";

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { LuChevronsUpDown, LuCheck } from "react-icons/lu";
import { useGetSidebarToolsQuery } from "@/store/api/productsApi";
import ToolIcon from "@/components/common/ToolIcon";
import OpenInNewTabModal from "@/components/common/OpenInNewTabModal";
import { useOverlayTransition } from "@/hooks/useOverlayTransition";

/**
 * The sidebar's top-row app switcher — sits next to the PYZO logo, ported
 * verbatim (visually + behaviorally) from pyzo-central-frontend's
 * SidebarToolsSwitcher.tsx so every PYZO product frontend shares the same
 * control. Fully data-driven from GET /products/sidebar-tools — no product
 * id is hardcoded here, "current" comes from each entry's own `is_current`
 * flag (set server-side from CURRENT_PRODUCT_ID).
 */
const SidebarToolsSwitcher = ({ isCollapsed }) => {
  const [open, setOpen] = useState(false);
  const [pendingProduct, setPendingProduct] = useState(null);
  const { data: rawTools = [] } = useGetSidebarToolsQuery();
  // Current tool pinned first — matches the fixed top position this row has always had.
  const tools = [...rawTools].sort((a, b) => Number(b.is_current) - Number(a.is_current));
  const containerRef = useRef(null);
  const portalPanelRef = useRef(null);
  const [portalPosition, setPortalPosition] = useState(null);
  const { shouldRender, transitionStyle, dropdownTransitionClassName } = useOverlayTransition(open, false);

  // The shared Tooltip component positions its bubble with plain CSS
  // (absolute + left-full/ml-2), which gets rendered behind the sticky page
  // header whenever the trigger sits near the sidebar's own edge (true in
  // both the collapsed rail and the expanded sidebar too). So this trigger
  // gets its own minimal portaled tooltip instead, following the trigger's
  // live bounding box the same way the dropdown panel below does.
  const triggerButtonRef = useRef(null);
  const tooltipBubbleRef = useRef(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState(null);

  const positionTooltip = useCallback(() => {
    const trigger = triggerButtonRef.current;
    const bubble = tooltipBubbleRef.current;
    if (!trigger || !bubble) return;
    const triggerRect = trigger.getBoundingClientRect();
    const bubbleRect = bubble.getBoundingClientRect();
    setTooltipPosition({
      left: triggerRect.left + (triggerRect.width - bubbleRect.width) / 2,
      top: triggerRect.bottom + 6,
    });
  }, []);

  useLayoutEffect(() => {
    if (showTooltip) positionTooltip();
  }, [showTooltip, positionTooltip]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event) => {
      if (containerRef.current?.contains(event.target)) return;
      if (portalPanelRef.current?.contains(event.target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Collapsed only: the panel is portaled to document.body (see the render
  // below) so it always paints above the sticky page header regardless of
  // the sidebar's own stacking context, and positioned here from the
  // trigger's live bounding box — just to its right, top edges aligned —
  // rather than relying on CSS anchoring within the (narrow, collapsed)
  // sidebar column.
  const positionPortalPanel = useCallback(() => {
    const trigger = containerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    setPortalPosition({ left: rect.right + 8, top: rect.top });
  }, []);

  useLayoutEffect(() => {
    if (isCollapsed && shouldRender) positionPortalPanel();
  }, [isCollapsed, shouldRender, positionPortalPanel]);

  useEffect(() => {
    if (!isCollapsed || !shouldRender) return;
    window.addEventListener("resize", positionPortalPanel);
    window.addEventListener("scroll", positionPortalPanel, true);
    return () => {
      window.removeEventListener("resize", positionPortalPanel);
      window.removeEventListener("scroll", positionPortalPanel, true);
    };
  }, [isCollapsed, shouldRender, positionPortalPanel]);

  // Nothing to switch to — only the product itself is in the list, so the
  // trigger would open a panel with one non-interactive, already-checked row.
  if (tools.length <= 1) return null;

  const handleTriggerClick = () => {
    setOpen((o) => !o);
  };

  const openProduct = (product) => {
    setOpen(false);
    if (product.redirect_url) setPendingProduct(product);
  };

  const confirmOpenProduct = () => {
    if (pendingProduct?.redirect_url) window.open(pendingProduct.redirect_url, "_blank", "noopener,noreferrer");
  };

  const trigger = (
    <button
      ref={triggerButtonRef}
      type="button"
      onClick={handleTriggerClick}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onFocus={() => setShowTooltip(true)}
      onBlur={() => setShowTooltip(false)}
      aria-label="Switch PYZO tool"
      aria-expanded={open}
      className={`flex items-center justify-center w-[18px] h-6 rounded-[4px] border border-[#2762EA80] bg-white transition-colors cursor-pointer ${
        open ? "bg-[#F1F5F9]" : "hover:bg-[#F9FAFB]"
      }`}>
      <LuChevronsUpDown className="w-3.5 h-3.5 text-[#334155]" />
    </button>
  );

  const panelBody = (
    <>
      <div className="flex items-start px-4 pt-[14px] pb-2 w-full">
        <span className="flex-1 font-lato font-medium text-[10px] leading-[150%] text-[rgba(26,28,41,0.5)]">
          PYZO TOOLS
        </span>
      </div>
      <div className="w-full border-t border-[#E2E8F0]" />

      <div className="flex flex-col p-2 gap-[1px] w-full">
        {tools.map((product, i) => (
          <React.Fragment key={product.id}>
            {product.is_current ? (
              <div className="flex items-center gap-[14px] p-1.5 rounded-[6px] bg-[#F8FAFC] w-full h-9">
                <span className="flex items-center justify-center w-6 h-6 rounded-[4.5px] border-[0.75px] border-[#E6E6E6] bg-white shrink-0 overflow-hidden">
                  {product.mini_icon ? (
                    <Image src={product.mini_icon} alt="" width={12} height={12} className="object-contain" unoptimized />
                  ) : (
                    <Image src={product.icon} alt="" width={18} height={6} className="w-[18px] h-[6px] object-contain" unoptimized />
                  )}
                </span>
                <span className="flex-1 font-lato font-medium text-[12px] leading-[14px] text-[#334155] truncate">
                  {product.name.replace(/^pyzo\s*/i, "")}
                </span>
                <LuCheck className="w-4 h-4 text-[#2877EE] shrink-0" />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => openProduct(product)}
                disabled={!product.redirect_url}
                className="flex items-center gap-[14px] p-1.5 rounded-[6px] w-full h-9 hover:bg-[#F8FAFC] transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50">
                <span className="flex items-center justify-center w-6 h-6 rounded-[4.5px] border-[0.75px] border-[#E6E6E6] bg-white shrink-0 overflow-hidden">
                  {product.mini_icon ? (
                    <Image src={product.mini_icon} alt="" width={12} height={12} className="object-contain" unoptimized />
                  ) : (
                    <ToolIcon toolId={product.id} size={12} />
                  )}
                </span>
                <span className="flex-1 font-lato font-medium text-[12px] leading-[14px] text-[#334155] text-left truncate">
                  {product.name.replace(/^pyzo\s*/i, "")}
                </span>
              </button>
            )}
            {i < tools.length - 1 && <div className="w-full border-t border-[#E2E8F0]" />}
          </React.Fragment>
        ))}
      </div>

      <div className="w-full border-t border-[#E2E8F0]" />
    </>
  );

  const panelBoxShadow = "0px 1px 4px rgba(0,0,0,0.04), 0px 4px 16px rgba(0,0,0,0.08)";

  return (
    <>
      <div ref={containerRef} className="relative shrink-0">
        {trigger}

        {/* Expanded: stays within the sidebar's own stacking context,
            right-anchored to the trigger. Never overlaps the page header
            since it stays inside the sidebar's own (wider) column. */}
        {!isCollapsed && shouldRender && (
          <div
            className={`absolute right-0 top-[calc(100%+8px)] w-[168px] origin-top-right bg-white border border-[#E7E9EE] rounded-[12px] flex flex-col z-[130] ${dropdownTransitionClassName}`}
            style={{ boxShadow: panelBoxShadow, ...transitionStyle }}>
            {panelBody}
          </div>
        )}
      </div>

      {showTooltip &&
        !open &&
        createPortal(
          <div
            ref={tooltipBubbleRef}
            className="fixed z-[1000] pointer-events-none rounded-md bg-[#1E1E1E] px-2 py-1 text-[11px] leading-4 text-white whitespace-nowrap"
            style={{
              left: tooltipPosition?.left ?? -9999,
              top: tooltipPosition?.top ?? -9999,
              visibility: tooltipPosition ? "visible" : "hidden",
            }}>
            Switch tool
          </div>,
          document.body
        )}

      {/* Collapsed: the sidebar column is too narrow to anchor the panel
          within it (168px would overflow into the main content area, right
          where the sticky page header sits with a higher stacking context
          than the sidebar's own). Portaled to <body> and positioned from
          the trigger's live bounding box instead, just to its right with
          the top edges aligned. */}
      {isCollapsed &&
        shouldRender &&
        portalPosition &&
        createPortal(
          <div
            ref={portalPanelRef}
            className={`fixed z-[1000] w-[168px] origin-top-left bg-white border border-[#E7E9EE] rounded-[12px] flex flex-col ${dropdownTransitionClassName}`}
            style={{ left: portalPosition.left, top: portalPosition.top, boxShadow: panelBoxShadow, ...transitionStyle }}>
            {panelBody}
          </div>,
          document.body
        )}

      <OpenInNewTabModal isOpen={pendingProduct !== null} onClose={() => setPendingProduct(null)} onConfirm={confirmOpenProduct} />
    </>
  );
};

export default SidebarToolsSwitcher;
