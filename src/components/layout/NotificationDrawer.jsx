"use client";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useRouter } from "next/navigation";
import readNotification from "@/assets/svg/read_notification.svg";
import unreadNotification from "@/assets/svg/unread_notification.svg";

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
        <div className="h-12 flex items-center justify-between px-4 border-b border-[#E5E5E5] flex-shrink-0">
          <h2 className="text-base font-semibold text-[#111827]">Notifications (2)</h2>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center cursor-pointer hover:bg-gray-100 rounded-full transition-colors">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M1 1L13 13M1 13L13 1"
                stroke="#111827"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {DUMMY_NOTIFICATIONS.map((notif, index) => (
            <React.Fragment key={notif.id}>
              <div
                className="flex gap-3 relative cursor-pointer hover:bg-gray-50 p-1 rounded-md transition-colors"
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

              {/* Dashed divider */}
              {index < DUMMY_NOTIFICATIONS.length - 1 && (
                <div className="w-full border-b border-dashed border-[#E5E7EB]" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default NotificationDrawer;
