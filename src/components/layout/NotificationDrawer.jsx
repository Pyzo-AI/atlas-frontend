"use client";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useRouter } from "next/navigation";
import readNotification from "@/assets/svg/read_notification.svg";
import unreadNotification from "@/assets/svg/unread_notification.svg";
import back from "@/assets/svg/back.svg";
import close from "@/assets/svg/close.svg";

const DUMMY_NOTIFICATIONS = [
  {
    id: 1,
    title: "Admin reminded you to start the module 'Python Basics' in the course 'Learn Python'",
    time: "2h ago",
    isRead: false,
    slide_url: "/modules",
  },
  {
    id: 2,
    title: "Admin reminded you to complete the assessment 'Loops Quiz' in the course 'Learn Python'",
    time: "2h ago",
    isRead: true,
    slide_url: "/assessment",
  },
  {
    id: 3,
    title: "Admin reminded you to start the module 'Python Basics' in the course 'Learn Python'",
    time: "2h ago",
    isRead: false,
    slide_url: "/modules",
  },
  {
    id: 4,
    title: "Admin reminded you to complete the assessment 'Loops Quiz' in the course 'Learn Python'",
    time: "2h ago",
    isRead: true,
    slide_url: "/assessment",
  },
  {
    id: 5,
    title: "Admin reminded you to start the module 'Python Basics' in the course 'Learn Python'",
    time: "2h ago",
    isRead: false,
    slide_url: "/modules",
  },
  {
    id: 6,
    title: "Admin reminded you to complete the assessment 'Loops Quiz' in the course 'Learn Python'",
    time: "2h ago",
    isRead: true,
    slide_url: "/assessment",
  },
];

const NotificationDrawer = ({ isOpen, onClose }) => {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  const unreadCount = DUMMY_NOTIFICATIONS.filter((n) => !n.isRead).length;

  const handleNotificationClick = (url) => {
    if (url) {
      router.push(url);
      onClose();
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity" onClick={onClose} />

      {/* Drawer */}
      <div className="absolute right-0 top-0 h-full bg-white shadow-[-7px_3px_34px_rgba(217,217,233,0.3)] w-full sm:w-[415px] flex flex-col font-lato animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="h-12 flex items-center px-4 border-b border-[#E5E5E5] flex-shrink-0 relative">
          {/* Back button for mobile */}
          <button
            onClick={onClose}
            className="md:hidden flex items-center justify-center cursor-pointer p-1 -ml-1 relative z-10"
            aria-label="Back">
            <Image src={back} alt="Back" width={24} height={24} />
          </button>

          {/* Title - Centered on mobile, Left-aligned on Desktop */}
          <h2 className="absolute inset-0 flex items-center justify-center text-base font-semibold text-[#111827] pointer-events-none md:static md:justify-start md:pointer-events-auto md:flex-1">
            Notifications ({unreadCount})
          </h2>

          {/* Close button for desktop */}
          <button
            onClick={onClose}
            className="hidden md:flex w-6 h-6 items-center justify-center cursor-pointer hover:bg-gray-100 rounded-full transition-colors ml-auto relative z-10"
            aria-label="Close">
            <Image src={close} alt="Close" width={24} height={24} />
          </button>
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto pb-4 flex flex-col">
          {DUMMY_NOTIFICATIONS.map((notif, index) => (
            <div
              key={notif.id}
              className={`px-4 flex gap-3 relative cursor-pointer hover:bg-gray-50 p-1 rounded-md transition-colors ${
                index < DUMMY_NOTIFICATIONS.length - 1 ? "border-b border-dashed border-[#E5E7EB] py-4" : ""
              }`}
              onClick={() => handleNotificationClick(notif.slide_url)}>
              {/* Bell Icon container */}
              <Image
                src={notif.isRead ? readNotification : unreadNotification}
                alt="Notification Bell"
                width={36}
                height={36}
              />

              {/* Text content */}
              <div className="flex flex-col gap-2 flex-grow">
                <p
                  className={`text-[12px] leading-4 ${notif.isRead ? "text-[#4B5563] font-normal" : "text-[#1D1F2C] font-medium"}`}>
                  {notif.title}
                </p>
                <span className="text-[12px] text-[#585858] font-normal">{notif.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default NotificationDrawer;
