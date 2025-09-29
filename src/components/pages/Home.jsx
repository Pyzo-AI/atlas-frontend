"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useGetPresentationsQuery } from "../../store/api/questionsApi";
import chat_star from "../../assets/svg/chat_star.svg";
import { getUserDetailsFromToken } from "@/store/utils/token";
import { usePostHog } from "@/hooks/usePostHog";
import overdue from "../../assets/svg/overdue.svg";
import locked from "../../assets/svg/locked.svg";
import unlocked from "../../assets/svg/unlocked.svg";
import completed from "../../assets/svg/completed.svg";
import dueSoon from "../../assets/svg/due-soon.svg";

// Course data matching Figma design
const presentations = {
  data: [
    {
      presentation_id: 1,
      title: "Introduction to Digital Banking",
      author: "Dr. Ananya Mehta",
      status: "locked",
      isCompleted: false,
      isPresentationCompleted: false,
      image:
        "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop",
      lock_info: {
        status: "locked",
        unlock_time: "2025-09-30T16:08:00+05:30",
      },
      due_info: {
        status: "due",
        due_time: "2025-10-03T16:08:00+05:30",
      },
    },
    {
      presentation_id: 2,
      title: "Basics of Financial Planning",
      author: "Ms. Shreya Iyer",
      status: "progress",
      isCompleted: false,
      isPresentationCompleted: false,
      image:
        "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop",
      lock_info: {
        status: "unlocked",
      },
      due_info: {
        status: "due",
        due_time: "2025-10-03T16:08:00+05:30",
      },
    },
    {
      presentation_id: 3,
      title: "Customer Service Excellence",
      author: "Mr. Arjun Deshmukh",
      status: "overdue",
      isCompleted: false,
      isPresentationCompleted: false,
      image:
        "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400&h=300&fit=crop",
      lock_info: {
        status: "unlocked",
      },
      due_info: {
        status: "overdue",
        due_time: "2025-09-25T16:08:00+05:30",
      },
    },
    {
      presentation_id: 4,
      title: "Effective Communication Skills",
      author: "Dr. Kavita Nair",
      status: "completed",
      isCompleted: true,
      isPresentationCompleted: true,
      presentationCompletedDate: "2024-12-15T14:30:00+05:30",
      image:
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=300&fit=crop",
      lock_info: {
        status: "unlocked",
      },
    },
  ],
};

const PresentationCard = ({ presentation, onClick, currentTime }) => {
  const getUnlockMessage = (targetTime) => {
    const target = new Date(targetTime);
    const diff = target - currentTime;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return `Unlocks in ${days} ${days === 1 ? "day" : "days"}`;
  };

  const getOverdueMessage = (targetTime) => {
    const target = new Date(targetTime);
    const diff = Math.abs(target - currentTime);
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return `Overdue by ${days} ${days === 1 ? "day" : "days"}`;
  };

  const getDueMessage = (targetTime) => {
    const target = new Date(targetTime);
    const diff = target - currentTime;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return `Due in ${days} ${days === 1 ? "day" : "days"}`;
  };

  const getBadgeInfo = () => {
    if (presentation.isPresentationCompleted) {
      const completedDate = presentation.presentationCompletedDate
        ? new Date(presentation.presentationCompletedDate).toLocaleDateString()
        : "Unknown date";
      return {
        icon: completed,
        color: "#008236",
        title: "Completed",
        subtitle: `Completed ${completedDate}`,
      };
    }

    // Check lock status first - highest priority
    if (
      presentation.lock_info?.status === "locked" &&
      presentation.lock_info?.unlock_time
    ) {
      return {
        icon: locked,
        color: "#E7E7E7",
        textColor: "#1A1C29",
        title: "Locked",
        subtitle: getUnlockMessage(presentation.lock_info.unlock_time),
      };
    }

    if (
      presentation.due_info?.status === "overdue" &&
      presentation.due_info?.due_time
    ) {
      return {
        icon: overdue,
        color: "#FEE2E2",
        textColor: "#DC2626",
        title: "Overdue",
        subtitle: getOverdueMessage(presentation.due_info.due_time),
      };
    }

    if (
      presentation.due_info?.status === "due" &&
      presentation.due_info?.due_time
    ) {
      return {
        icon: unlocked,
        color: "#DBEAFE",
        textColor: "#1447E6",
        title: "In Progress",
        subtitle: getDueMessage(presentation.due_info.due_time),
      };
    }

    // If no lock_info or due_info available, return minimal info
    if (!presentation.lock_info && !presentation.due_info) {
      return {
        icon: null,
        color: null,
        textColor: null,
        title: null,
        subtitle: null,
      };
    }

    return {
      icon: unlocked,
      color: "#DBEAFE",
      textColor: "#1447E6",
      title: "In Progress",
      subtitle: null,
    };
  };

  const badgeInfo = getBadgeInfo();
  const isLocked = presentation.lock_info?.status === "locked";

  return (
    <div
      className={`relative flex flex-col items-start p-3 sm:p-[12px_12px_16px] gap-2 sm:gap-[10px] w-full min-w-[200px] sm:min-w-[280px] aspect-[331/223.5] bg-white rounded-[8px] transition-shadow duration-300 ${
        isLocked
          ? " cursor-not-allowed"
          : "cursor-pointer hover:shadow-[0_4px_25px_rgba(0,0,0,0.1)]"
      }`}
      onClick={isLocked ? undefined : onClick}
    >
      {/* badge */}
      {badgeInfo.subtitle && (
        <div className="absolute top-4.5 right-4.5 flex flex-col items-end p-1 gap-0.5 bg-[#744FFF] rounded-[5px] z-10">
          <p className="font-lato font-medium text-[10px] leading-[10px] text-[#fff]">
            {badgeInfo.subtitle}
          </p>
        </div>
      )}
      <div className="flex flex-col items-start gap-[12px] w-full flex-1">
        {/* Thumbnail */}
        <div className="w-full flex-1 bg-[#F3EDFF] rounded-[8px] overflow-hidden relative">
          {presentation?.image && presentation.image.trim() !== "" && (
            <Image
              src={presentation.image}
              alt={presentation?.title}
              fill
              className="object-cover"
            />
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col items-start gap-2 sm:gap-[8px] w-full">
          <div className="flex items-center gap-2 sm:gap-[8px] w-full">
            <h3 className="font-lato font-semibold text-sm sm:text-[16px] leading-tight sm:leading-[19px] text-[#1D1F2C] flex-grow">
              {presentation?.title || "Unknown Title"}
            </h3>
          </div>

          <div className="flex justify-between items-start gap-2 sm:gap-[8px] w-full">
            <span className="font-lato font-normal text-xs sm:text-[12px] leading-tight sm:leading-[14px] text-[#585858]">
              {presentation?.author || "Unknown Author"}
            </span>
            {badgeInfo.title && (
              <div
                className="flex justify-center items-center px-1.5 py-[2.5px] h-5 rounded-[10px]"
                style={{ backgroundColor: badgeInfo.color }}
              >
                <span
                  className="font-lato font-medium text-[11px] leading-4"
                  style={{ color: badgeInfo.textColor || "#FFFFFF" }}
                >
                  {badgeInfo.title}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Home = () => {
  const router = useRouter();
  const [filter, setFilter] = useState("all");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { capture } = usePostHog();

  // Calculate counts for each filter


  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);
  const {
    data: presentations = [],
    isLoading: loading,
    error,
  } = useGetPresentationsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

    const getCounts = () => {
    const data = presentations?.data || [];
    return {
      all: data.length,
      locked: data.filter(p => p.lock_info?.status === "locked").length,
      "in-progress": data.filter(p => p.lock_info?.status === "unlocked" && !p.isPresentationCompleted && p.due_info?.status !== "overdue").length,
      overdue: data.filter(p => p.due_info?.status === "overdue").length,
      completed: data.filter(p => p.isPresentationCompleted).length,
    };
  };


  const counts = getCounts();
  const handlePresentationClick = (presentationId) => {
    const userDetails = getUserDetailsFromToken();
    const selectedPresentation = presentations?.data?.find(
      (p) => p.presentation_id === presentationId
    );

    // Track module start event
    capture("module_start", {
      user_id: userDetails?.sub,
      module_id: presentationId,
      // module_title: selectedPresentation?.title,
      // module_author: selectedPresentation?.author,
      // module_status: selectedPresentation?.status,
      timestamp: new Date().toISOString(),
    });

    router.push(`/lectures/${presentationId}`);
  };

  const userDetails = getUserDetailsFromToken();

  if (error) {
    return (
      <div className="w-full min-h-screen bg-[#F9F9F9] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">
            Error Loading Presentations
          </h2>
          <p className="text-gray-600">Failed to fetch data from the server.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-[#F9F9F9] animate-pulse">
        {/* Purple Header Section Skeleton */}
        <div className="w-full h-[112px] bg-gray-300 relative mt-1">
          {/* User Profile Skeleton */}
          <div className="absolute flex items-center gap-3 sm:gap-[12px] w-[150px] h-[48px] left-4 sm:left-[40px] top-[32px]">
            <div className="w-10 h-10 sm:w-[48px] sm:h-[48px] bg-gray-400 rounded-[60px]"></div>
            <div className="flex flex-col justify-center items-start gap-1 sm:gap-[4px] w-[90px] h-[38px]">
              <div className="w-[70px] h-[12px] bg-gray-400 rounded"></div>
              <div className="w-[60px] h-[17px] bg-gray-400 rounded"></div>
            </div>
          </div>
        </div>

        {/* Course Section Skeleton */}
        <div className="flex flex-col items-start gap-4 sm:gap-[16px] w-full px-4 sm:px-[40px] py-4 sm:py-[20px]">
          {/* Header with tabs skeleton */}
          <div className="flex justify-between items-center gap-[16px] w-full h-[30px]">
            <div className="w-[140px] h-[19px] bg-gray-300 rounded"></div>
            <div className="w-[234px] h-[32px] bg-gray-200 rounded-[6px]"></div>
          </div>

          {/* Course Grid Skeleton */}
          <div className="flex flex-col items-start gap-3 sm:gap-[12px] w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-[12px] w-full">
              {[...Array(8)].map((_, index) => (
                <div
                  key={index}
                  className="flex flex-col items-start p-3 sm:p-[12px_12px_16px] gap-2 sm:gap-[10px] w-full min-w-[200px] sm:min-w-[280px] aspect-[331/223.5] bg-white rounded-[8px]"
                >
                  <div className="flex flex-col items-start gap-3 sm:gap-[12px] w-full flex-1">
                    {/* Thumbnail skeleton */}
                    <div className="w-full flex-1 bg-gray-200 rounded-[8px]"></div>

                    {/* Content skeleton */}
                    <div className="flex flex-col items-start gap-2 sm:gap-[8px] w-full">
                      <div className="w-full h-[19px] bg-gray-200 rounded"></div>
                      <div className="flex justify-between items-start gap-2 sm:gap-[8px] w-full">
                        <div className="w-[100px] h-[14px] bg-gray-200 rounded"></div>
                        <div className="w-[80px] h-[17px] bg-gray-200 rounded-[10px]"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const completedCount = presentations?.data?.filter(
    (p) => p.isPresentationCompleted
  ).length;
  const totalCount = presentations?.data?.length;

  return (
    <div className="w-full min-h-screen bg-[#F9F9F9]">
      {/* Purple Header Section */}
      <div className="w-full h-auto min-h-[112px] bg-[#744FFF] relative mt-1">
        {/* User Profile */}
        <div className="flex items-center gap-3 sm:gap-[12px] px-4 sm:px-[40px] py-6 sm:py-8">
          <Image
            className="w-10 h-10 sm:w-[48px] sm:h-[48px] bg-[#F1F2F4] rounded-[60px] flex-shrink-0"
            src={chat_star}
            alt="User icon"
          />
          <div className="flex flex-col justify-center items-start gap-1 sm:gap-[4px] min-w-0 flex-1">
            <span className="font-lato font-semibold text-base sm:text-[17px] leading-tight sm:leading-[20px] text-white truncate">
              Hello, {userDetails?.name}
            </span>
            <span className="font-lato font-normal text-xs sm:text-[12px] leading-tight sm:leading-[14px] text-white opacity-70">
              Browse your courses and get instant answers to your questions with
              our AI guide.
            </span>
          </div>
        </div>

        {/* Learning Overview - Hidden by default as per Figma */}
        <div className="absolute flex flex-col items-start gap-3 sm:gap-[12px] w-full h-[138px] px-4 sm:px-[40px] top-[104px] invisible">
          <h3 className="w-full h-[17px] font-lato font-semibold text-sm sm:text-[14px] leading-[17px] text-white">
            Learning Overview
          </h3>
        </div>
      </div>

      {/* Course Section */}
      <div className="flex flex-col items-start gap-4 sm:gap-[16px] w-full px-4 sm:px-[40px] py-4 sm:py-[20px]">
        {/* Header with tabs */}
        <div className="flex justify-between items-center gap-4 sm:gap-[16px] w-full">
          <h2 className="font-lato font-bold text-base sm:text-[16px] leading-tight sm:leading-[19px] text-[#1A1C29]">
            Available Courses
          </h2>

          {/* Desktop Tabs */}
          <div className="hidden lg:flex items-start p-1 w-auto h-[32px] bg-white border border-[#E0E2E7] rounded-[6px] gap-1">
            {["all", "locked", "in-progress", "overdue", "completed"].map(
              (tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`flex justify-center items-center px-2 py-1 h-[22px] rounded-[4px] cursor-pointer ${
                    filter === tab ? "bg-[#744FFF]" : ""
                  }`}
                >
                  <span
                    className={`font-lato font-medium text-[10px] leading-[20px] whitespace-nowrap ${
                      filter === tab ? "text-white" : "text-[#667085]"
                    }`}
                  >
                    {tab === "all"
                      ? `All (${counts.all})`
                      : tab === "locked"
                      ? `Locked`
                      : tab === "in-progress"
                      ? `In Progress`
                      : tab === "overdue"
                      ? `Overdue`
                      : `Completed`}
                  </span>
                </button>
              )
            )}
          </div>

          {/* Mobile/Tablet Dropdown */}
          <div className="relative lg:hidden">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center justify-between px-3 py-2 w-32 h-[30px] bg-white border border-[#E0E2E7] rounded-[6px]"
            >
              <span className="font-lato font-medium text-[12px] text-[#667085]">
                {filter === "all"
                  ? `All (${counts.all})`
                  : filter === "locked"
                  ? `Locked`
                  : filter === "in-progress"
                  ? `In Progress`
                  : filter === "overdue"
                  ? `Overdue`
                  : `Completed`}
              </span>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {isDropdownOpen && (
              <div className="absolute top-full mt-1 w-32 bg-white border border-[#E0E2E7] rounded-[6px] shadow-lg z-50">
                {["all", "locked", "in-progress", "overdue", "completed"].map(
                  (tab) => (
                    <button
                      key={tab}
                      onClick={() => {
                        setFilter(tab);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-[12px] font-lato hover:bg-gray-50 ${
                        filter === tab
                          ? "bg-[#744FFF] text-white"
                          : "text-[#667085]"
                      }`}
                    >
                      {tab === "all"
                        ? `All (${counts.all})`
                        : tab === "locked"
                        ? `Locked`
                        : tab === "in-progress"
                        ? `In Progress`
                        : tab === "overdue"
                        ? `Overdue`
                        : `Completed`}
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        </div>

        {/* Course Grid */}
        <div className="flex flex-col items-start gap-3 sm:gap-[12px] w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-[12px] w-full">
            {presentations?.data
              .filter((p) => {
                if (filter === "all") return true;
                if (filter === "locked")
                  return p.lock_info?.status === "locked";
                if (filter === "in-progress")
                  return (
                    p.lock_info?.status === "unlocked" &&
                    !p.isPresentationCompleted &&
                    p.due_info?.status !== "overdue"
                  );
                if (filter === "overdue")
                  return p.due_info?.status === "overdue";
                if (filter === "completed") return p.isPresentationCompleted;
                return true;
              })
              .map((presentation) => (
                <PresentationCard
                  key={presentation.presentation_id}
                  presentation={presentation}
                  currentTime={currentTime}
                  onClick={() =>
                    handlePresentationClick(presentation.presentation_id)
                  }
                />
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
