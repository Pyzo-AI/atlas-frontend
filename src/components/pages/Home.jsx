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
      status: "start",
      isCompleted: false,
      image:
        "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop",
      lock_info: {
        status: "locked",
        status_msg: "Unlocks in 2h 4m",
        unlock_time: "2025-09-25T16:08:00+05:30",
      },
    },
    {
      presentation_id: 2,
      title: "Basics of Financial Planning",
      author: "Ms. Shreya Iyer",
      status: "completed",
      isCompleted: true,
      image:
        "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop",
      lock_info: {
        status: "unlocked",
      },
      due_info: {
        status: "due",
        status_msg: "Due in 2 days",
        due_time: "2025-09-27T23:59:00+05:30",
      },
    },
    {
      presentation_id: 3,
      title: "Customer Service Excellence",
      author: "Mr. Arjun Deshmukh",
      status: "progress",
      isCompleted: false,
      image:
        "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400&h=300&fit=crop",
      lock_info: {
        status: "unlocked",
      },
      due_info: {
        status: "overdue",
        status_msg: "Overdue by 2 days",
        due_time: "2025-09-23T23:59:00+05:30",
      },
    },
    {
      presentation_id: 4,
      title: "Effective Communication Skills",
      author: "Dr. Kavita Nair",
      status: "completed",
      isCompleted: true,
      image:
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=300&fit=crop",
      lock_info: {
        status: "unlocked",
      },
      due_info: {
        status: "not_set",
        status_msg: "No due date",
      },
    },
    {
      presentation_id: 5,
      title: "Workplace Ethics & Compliance",
      author: "Mr. Kunal Verma",
      status: "start",
      isCompleted: false,
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop",
      lock_info: {
        status: "locked",
        status_msg: "Unlocks in 3h 10m",
        unlock_time: "2025-09-25T17:14:00+05:30",
      },
    },
    {
      presentation_id: 6,
      title: "Understanding Investment Products",
      author: "Dr. Sneha Reddy",
      status: "progress",
      isCompleted: false,
      image:
        "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=300&fit=crop",
      lock_info: {
        status: "unlocked",
      },
      due_info: {
        status: "due",
        status_msg: "Due in 1 week",
        due_time: "2025-10-02T23:59:00+05:30",
      },
    },
    {
      presentation_id: 7,
      title: "Leadership and Team Management",
      author: "Prof. Aditya Bansal",
      status: "start",
      isCompleted: false,
      image:
        "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop",
      lock_info: {
        status: "locked",
        status_msg: "Unlocks in 2h 30m",
        unlock_time: "2025-09-25T16:34:00+05:30",
      },
    },
    {
      presentation_id: 8,
      title: "Time Management for Professionals",
      author: "Prof. Neeraj Sharma",
      status: "progress",
      isCompleted: false,
      image:
        "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=400&h=300&fit=crop",
      lock_info: {
        status: "unlocked",
      },
      due_info: {
        status: "overdue",
        status_msg: "Overdue by 1 day",
        due_time: "2025-09-24T23:59:00+05:30",
      },
    },
  ],
};

const PresentationCard = ({ presentation, onClick }) => {
  const calculateTimeDifference = (targetTime) => {
    const now = new Date();
    const target = new Date(targetTime);
    const diff = Math.abs(target - now);
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${days}D: ${hours}H: ${minutes}M`;
  };

  const getBadgeInfo = () => {
    if (presentation.isCompleted || presentation.status === "completed") {
      return {
        icon: completed,
        color: "#008236",
        title: "Completed",
        subtitle: "Completed 3/10/2024"
      };
    }
    
    if (presentation.due_info?.status === "overdue" && presentation.due_info?.due_time) {
      return {
        icon: overdue,
        color: "#F04638",
        title: "Overdue",
        subtitle: `Overdue by ${calculateTimeDifference(presentation.due_info.due_time)}`
      };
    }
    
    if (presentation.due_info?.status === "due" && presentation.due_info?.due_time) {
      return {
        icon: dueSoon,
        color: "#E08910",
        title: "Due Soon",
        subtitle: `Due in ${calculateTimeDifference(presentation.due_info.due_time)}`
      };
    }
    
    if (presentation.lock_info?.status === "locked" && presentation.lock_info?.unlock_time) {
      return {
        icon: locked,
        color: "#3F68E8",
        title: "Locked",
        subtitle: `Unlocks in ${calculateTimeDifference(presentation.lock_info.unlock_time)}`
      };
    }
    
    return {
      icon: unlocked,
      color: "#685EDD",
      title: "Unlocked",
      subtitle: presentation.due_info?.due_time ? `Due in ${calculateTimeDifference(presentation.due_info.due_time)}` : "No due date"
    };
  };



  const badgeInfo = getBadgeInfo();
  const isLocked = presentation.lock_info?.status === "locked";

  return (
    <div
      className={`relative flex flex-col items-start p-3 sm:p-[12px_12px_16px] gap-2 sm:gap-[10px] w-full min-w-[200px] sm:min-w-[280px] aspect-[331/223.5] bg-white rounded-[8px] transition-shadow duration-300 ${
        isLocked ? " cursor-not-allowed" : "cursor-pointer hover:shadow-[0_4px_25px_rgba(0,0,0,0.1)]"
      }`}
      onClick={isLocked ? undefined : onClick}
    >
      {/* badge */}
      <div className="absolute top-4.5 right-4.5 bg-[#FEF3F359] backdrop-blur-lg p-1.5 rounded z-10">
        <div className="flex items-center gap-1" style={{ color: badgeInfo.color }}>
          <Image width={12} height={12} src={badgeInfo.icon} alt={badgeInfo.title} />
          <p className="font-lato font-semibold text-[10px] leading-[100%] tracking-[0em]">
            {badgeInfo.title}
          </p>
        </div>
        <p className="mt-1 font-lato font-normal text-[10px] leading-[100%] tracking-[0em] text-[#111827]">
          {badgeInfo.subtitle}
        </p>
      </div>
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
            {/* {getStatusBadge()} */}
          </div>
        </div>
      </div>
    </div>
  );
};

const Home = () => {
  const router = useRouter();
  const [filter, setFilter] = useState("all");
  const { capture } = usePostHog();
  const {
    data: presentation = [],
    isLoading: loading,
    error,
  } = useGetPresentationsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

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
    (p) => p.isCompleted || p.status === "completed"
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

          {/* Tabs */}
          {/* <div className="flex items-start p-1 w-[234px] h-[32px] bg-white border border-[#E0E2E7] rounded-[6px]">
            <button
              onClick={() => setFilter("all")}
              className={`flex justify-center items-center px-[8px] py-[2px] gap-[8px] flex-1 h-[22px] rounded-[4px] cursor-pointer ${
                filter === "all" ? "bg-[#744FFF]" : ""
              }`}
            >
              <span
                className={`font-lato font-medium text-[12px] leading-[20px] ${
                  filter === "all" ? "text-white" : "text-[#667085]"
                }`}
              >
                All
              </span>
            </button>
            <button
              onClick={() => setFilter("in-progress")}
              className={`flex justify-center items-center px-[12px] py-[6px] gap-[8px] flex-1 h-[22px] rounded-[4px] cursor-pointer ${
                filter === "in-progress" ? "bg-[#744FFF]" : ""
              }`}
            >
              <span
                className={`font-lato font-medium text-[12px] leading-[20px] whitespace-nowrap ${
                  filter === "in-progress" ? "text-white" : "text-[#667085]"
                }`}
              >
                In Progress
              </span>
            </button>
            <button
              onClick={() => setFilter("completed")}
              className={`flex justify-center items-center px-[12px] py-[6px] gap-[8px] flex-1 h-[22px] rounded-[4px] cursor-pointer ${
                filter === "completed" ? "bg-[#744FFF]" : ""
              }`}
            >
              <span
                className={`font-lato font-medium text-[12px] leading-[20px] ${
                  filter === "completed" ? "text-white" : "text-[#667085]"
                }`}
              >
                Completed
              </span>
            </button>
          </div> */}
        </div>

        {/* Course Grid */}
        <div className="flex flex-col items-start gap-3 sm:gap-[12px] w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-[12px] w-full">
            {presentations?.data
              .filter(
                (p) =>
                  filter === "all" ||
                  (filter === "completed" && p.isCompleted) ||
                  (filter === "in-progress" && !p.isCompleted)
              )
              .map((presentation) => (
                <PresentationCard
                  key={presentation.presentation_id}
                  presentation={presentation}
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
