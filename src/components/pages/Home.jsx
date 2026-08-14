"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useLocalizedRouter } from "@/hooks/useLocalizedRouter";
import Image from "next/image";
import { useGetPresentationsQuery, useGetInterviewLinkMutation } from "../../store/api/questionsApi";
import chat_star from "../../assets/svg/chat_star.svg";
import { getUserDetailsFromToken } from "@/store/utils/token";
import { usePostHog } from "@/hooks/usePostHog";
import overdue from "../../assets/svg/overdue.svg";
import locked from "../../assets/svg/locked.svg";
import unlocked from "../../assets/svg/unlocked.svg";
import completed from "../../assets/svg/completed.svg";
import dueSoon from "../../assets/svg/due-soon.svg";
import FeedbackSuccessModal from "../modals/FeedbackSuccessModal";
import { useDispatch, useSelector } from "react-redux";
import { setAutoPlayEnabled, setSelectedAssessmentId, setShowChat, setIsQuestionMode } from "@/store/features/videoSlice";
import { HiBookOpen, HiChevronDown } from "react-icons/hi2";
import FloatingChatbot from "../common/FloatingChatbot";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { getApiErrorMessage } from "@/utils/errorHandler";

const PresentationCard = ({ presentation, onClick, currentTime }) => {
  const { t } = useTranslation();

  const formatDuration = (seconds) => {
    const totalSeconds = Math.max(0, Math.round(seconds));
    if (totalSeconds < 60) {
      return `${totalSeconds}${t("courseCard.s")}`;
    }
    const totalMinutes = Math.floor(totalSeconds / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0) {
      return minutes > 0 ? `${hours}${t("courseCard.hr")} ${minutes}${t("courseCard.m")}` : `${hours}${t("courseCard.hr")}`;
    }
    return `${minutes}${t("courseCard.m")}`;
  };
  const getTimeDiffMessage = (targetTime, prefix) => {
    const target = new Date(targetTime);
    const diff = target - currentTime;
    const absDiff = Math.abs(diff);

    const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));
    if (days >= 1) {
      return `${prefix} ${days} ${days === 1 ? t("courseCard.day") : t("courseCard.days")}`;
    }

    const hours = Math.floor(absDiff / (1000 * 60 * 60));
    if (hours >= 1) {
      return `${prefix} ${hours}${t("courseCard.hr")}`;
    }

    const minutes = Math.floor(absDiff / (1000 * 60));
    if (minutes >= 1) {
      return `${prefix} ${minutes}${t("courseCard.m")}`;
    }

    const seconds = Math.floor(absDiff / 1000);
    return `${prefix} ${seconds}${t("courseCard.s")}`;
  };

  const getUnlockMessage = (targetTime) => {
    return getTimeDiffMessage(targetTime, t("courseCard.unlocksIn"));
  };

  const getOverdueMessage = (targetTime) => {
    return getTimeDiffMessage(targetTime, t("courseCard.overdueBy"));
  };

  const getDueMessage = (targetTime) => {
    return getTimeDiffMessage(targetTime, t("courseCard.dueIn"));
  };

  const getBadgeInfo = () => {
    // Status priority: Completed -> Locked -> Overdue -> In Progress
    
    // 1. Check completion
    if (presentation.isPresentationCompleted) {
      const completedDate = presentation.presentationCompletedDate
        ? new Date(presentation.presentationCompletedDate).toLocaleDateString("en-GB")
        : t("courseCard.unknownDate");
      return {
        icon: completed,
        colorClass: "bg-status-completed",
        textColorClass: "text-light",
        title: t("courseCard.completed"),
        subtitle: t("courseCard.completedDate", { date: completedDate }),
      };
    }

    // 2. Check lock status (only if it's currently locked AND the unlock time is still in the future)
    if (presentation.lock_info?.status === "locked" && presentation.lock_info?.unlock_time) {
      const unlockTime = new Date(presentation.lock_info.unlock_time);
      if (unlockTime > currentTime) {
        return {
          icon: locked,
          colorClass: "bg-status-locked-bg",
          textColorClass: "text-primary-text",
          title: t("courseCard.locked"),
          subtitle: getUnlockMessage(presentation.lock_info.unlock_time),
        };
      }
    }

    // 3. Check overdue status (if server says overdue OR the due date has passed)
    const isActuallyOverdue = 
      presentation.due_info?.due_time && new Date(presentation.due_info.due_time) < currentTime;
    
    if (
      (presentation.due_info?.status === "overdue" || isActuallyOverdue) && 
      presentation.due_info?.due_time &&
      !presentation.isPresentationCompleted
    ) {
      return {
          icon: overdue,
          colorClass: "bg-status-error",
          textColorClass: "text-status-error-text",
          title: t("courseCard.overdue"),
          subtitle:  presentation?.due_info?.status_msg ?? getOverdueMessage(presentation.due_info.due_time),
        };
    }

    // 4. Fallback to In Progress
    return {
      icon: unlocked,
      colorClass: "bg-status-progress-bg",
      textColorClass: "text-status-progress-text",
      title: "In Progress",
      subtitle: (presentation.due_info?.due_time && !isActuallyOverdue) 
        ? getDueMessage(presentation.due_info.due_time) 
        : null,
    };

    // If no lock_info or due_info available, return minimal info
    if (!presentation.lock_info && !presentation.due_info) {
      return {
        icon: null,
        colorClass: null,
        textColorClass: null,
        title: null,
        subtitle: null,
      };
    }

    return {
      icon: unlocked,
      colorClass: "bg-status-progress-bg",
      textColorClass: "text-status-progress-text",
      title: "In Progress",
      subtitle: null,
    };
  };

  const badgeInfo = getBadgeInfo();
  const isLocked = presentation.lock_info?.status === "locked";

  return (
    <div
      className={`relative flex flex-col items-start p-3 sm:p-[12px_12px_16px] gap-2 sm:gap-[10px] w-full min-w-[200px] sm:min-w-[280px] aspect-[331/223.5] bg-white rounded-[8px] transition-shadow duration-300 ${
        isLocked ? " cursor-not-allowed" : "cursor-pointer hover:shadow-[0_4px_25px_rgba(0,0,0,0.1)]"
      }`}
      onClick={isLocked ? undefined : onClick}>
      {/* badge */}
      {badgeInfo.subtitle && (
        <div className="absolute top-4.5 right-4.5 flex flex-col items-end p-1 gap-0.5 bg-primary rounded-[5px] z-10">
          <p className="font-lato font-medium text-[10px] leading-[10px] text-light">{badgeInfo.subtitle}</p>
        </div>
      )}
      <div className="flex flex-col items-start gap-[12px] w-full flex-1">
        {/* Thumbnail */}
        <div className="w-full flex-1 bg-bg-light-purple rounded-[8px] overflow-hidden relative">
          {presentation?.image && presentation.image.trim() !== "" && (
            <Image src={presentation.image} alt={presentation?.title} fill className="object-cover" />
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col items-start gap-2 sm:gap-[8px] w-full">
          <div className="flex items-center gap-2 sm:gap-[8px] w-full">
            <h3 className="font-lato font-semibold text-sm sm:text-[16px] leading-tight sm:leading-[19px] text-text-title flex-grow">
              {presentation?.title || "Unknown Title"}
            </h3>
            {presentation?.presentation_duration > 0 && presentation?.presentation_duration && (
              <div className="flex justify-center items-center px-1.5 py-[2.5px] h-5 rounded-[10px] bg-primary">
                <span className="font-lato font-medium text-[11px] leading-4 text-light whitespace-nowrap">
                  {formatDuration(presentation.presentation_duration)}
                </span>
              </div>
            )}
          </div>

          <div className="flex justify-between items-start gap-2 sm:gap-[8px] w-full">
            <span className="font-lato font-normal text-xs sm:text-[12px] leading-tight sm:leading-[14px] text-text-secondary">
              {presentation?.author || "Unknown Author"}
            </span>
            {badgeInfo.title && (
              <div
                className={`flex justify-center items-center px-1.5 py-[2.5px] h-5 rounded-[10px] ${badgeInfo.colorClass}`}>
                <span className={`font-lato font-medium text-[11px] leading-4 ${badgeInfo.textColorClass}`}>
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

const CIPLA_EMAIL = "cipla@pyzo.io";
const ASSESSMENT_MODULE_TITLE = "Basic cGMP & Gowning Requirements";

const Home = () => {
  const router = useLocalizedRouter();
  const searchParams = useSearchParams();
  const [filter, setFilter] = useState("all");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { capture } = usePostHog();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const orgConfig = useSelector((state) => state.organization?.config);

  // Check for feedback success parameter
  useEffect(() => {
    const feedbackParam = searchParams.get("feedback");
    if (feedbackParam === "success") {
      setShowSuccessModal(true);
    }
  }, [searchParams]);

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    // Remove the feedback parameter from URL
    router.replace("/");
  };

  // Calculate counts for each filter

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    dispatch(setAutoPlayEnabled(false));
    dispatch(setSelectedAssessmentId(null));
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
      locked: data.filter((p) => p.lock_info?.status === "locked").length,
      "in-progress": data.filter(
        (p) => p.lock_info?.status === "unlocked" && !p.isPresentationCompleted && p.due_info?.status !== "overdue"
      ).length,
      overdue: data.filter((p) => p.due_info?.status === "overdue").length,
      completed: data.filter((p) => p.isPresentationCompleted).length,
    };
  };

  const counts = getCounts();
  const handlePresentationClick = (presentationId) => {
    const userDetails = getUserDetailsFromToken();
    const selectedPresentation = presentations?.data?.find((p) => p.presentation_id === presentationId);

    // Track module start event
    capture("module_start", {
      user_id: userDetails?.sub,
      module_id: presentationId,
      // module_title: selectedPresentation?.title,
      // module_author: selectedPresentation?.author,
      // module_status: selectedPresentation?.status,
      timestamp: new Date().toISOString(),
    });

    // Close any open chat or question mode when navigating to a new module
    dispatch(setShowChat(false));
    dispatch(setIsQuestionMode(false));

    router.push(`/lectures/${presentationId}`);
  };

  const userDetails = getUserDetailsFromToken();
  const isCiplaUser = userDetails?.email === CIPLA_EMAIL;

  const [getInterviewLink, { isLoading: isAssessmentLinkLoading }] = useGetInterviewLinkMutation();

  const handleAssessmentCardClick = async () => {
    try {
      const result = await getInterviewLink().unwrap();
      const link = result?.interview_link || result?.link || result?.url;
      if (link) {
        window.open(link, "_blank", "noopener,noreferrer");
      } else {
        toast.error("Assessment link not found in response.");
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to fetch assessment link"));
    }
  };

  if (error) {
    return (
      <div className="w-full min-h-screen bg-page-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">{t("home.errorTitle")}</h2>
          <p className="text-gray-600">{t("home.errorDesc")}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-page-background animate-pulse">
        {/* Purple Header Section Skeleton */}
        <div className="w-full bg-gray-300 relative mt-1">
          {/* User Profile Skeleton */}
          <div className="flex items-center gap-3 sm:gap-[12px] px-4 sm:px-5 py-4 sm:py-6">
            <div className="w-10 h-10 sm:w-[48px] sm:h-[48px] bg-gray-400 rounded-[60px] flex-shrink-0"></div>
            <div className="flex flex-col justify-center items-start gap-1 sm:gap-[4px] min-w-0 flex-1">
              <div className="w-[120px] h-[17px] bg-gray-400 rounded"></div>
              <div className="w-[200px] h-[12px] bg-gray-400 rounded opacity-70"></div>
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
                  className="flex flex-col items-start p-3 sm:p-[12px_12px_16px] gap-2 sm:gap-[10px] w-full min-w-[200px] sm:min-w-[280px] aspect-[331/223.5] bg-white rounded-[8px]">
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

  const completedCount = presentations?.data?.filter((p) => p.isPresentationCompleted).length;
  const totalCount = presentations?.data?.length;

  return (
    <>
      <div className="w-full min-h-screen bg-page-background">
        {/* Purple Header Section */}
        <div className="w-full bg-primary relative mt-1">
          {/* User Profile */}
          <div className="flex items-center gap-3 sm:gap-[12px] px-4 sm:px-5 py-4 sm:py-6">
            <Image
              className="w-10 h-10 sm:w-[48px] sm:h-[48px] bg-bg-light-gray rounded-[60px] flex-shrink-0"
              src={chat_star}
              alt="User icon"
            />
            <div className="flex flex-col justify-center items-start gap-1 sm:gap-[4px] min-w-0 flex-1">
              <span className="font-lato font-semibold text-base sm:text-[17px] leading-tight sm:leading-[20px] text-light truncate">
                {t("home.hello", { name: userDetails?.name })}
              </span>
              <span className="font-lato font-normal text-xs sm:text-[12px] leading-tight sm:leading-[14px] text-light opacity-70">
                {t("home.browseDescription")}
              </span>
            </div>
          </div>

          {/* Learning Overview - Hidden by default as per Figma */}
          {/* <div className="absolute flex flex-col items-start gap-3 sm:gap-[12px] w-full h-[138px] px-4 sm:px-[40px] top-[104px] invisible">
            <h3 className="w-full h-[17px] font-lato font-semibold text-sm sm:text-[14px] leading-[17px] text-light">
              {t("home.learningOverview")}
            </h3>
          </div> */}
        </div>

        {/* Course Section */}
        <div className="flex flex-col items-start gap-4 sm:gap-[16px] w-full px-4 sm:px-5 py-4 sm:py-4">
          {/* Header with search and tabs */}
          {!orgConfig?.disable_course_header_row && (
            <div className="flex justify-between items-center gap-4 sm:gap-[16px] w-full">
            <div className="flex items-center gap-4">
              <h2 className="font-lato font-bold text-base sm:text-[16px] leading-tight sm:leading-[19px] text-primary-text">
                {t("home.availableCourses")}
              </h2>

              {/* Search Box - Hidden on mobile, visible on iPad and desktop */}
              {!orgConfig?.disable_course_search && (
                <input
                  type="text"
                  placeholder={t("home.searchCourses")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="hidden md:block w-64 px-3 h-[32px] border border-border-dark rounded-[6px] font-lato text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              )}
            </div>

            {/* Desktop Tabs */}
            {!orgConfig?.disable_course_filters && (
              <div className="hidden lg:flex items-start p-1 w-auto h-[32px] bg-white border border-border rounded-[6px] gap-1">
                {["all", "locked", "in-progress", "overdue", "completed"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setFilter(tab)}
                    className={`flex justify-center items-center px-2 py-1 h-[22px] rounded-[4px] cursor-pointer ${
                      filter === tab ? "bg-primary" : ""
                    }`}>
                    <span
                      className={`font-lato font-medium text-[10px] leading-[20px] whitespace-nowrap ${
                        filter === tab ? "text-light" : "text-text-muted"
                      }`}>
                      {tab === "all"
                        ? t("home.tabs.all")
                        : tab === "locked"
                          ? t("home.tabs.locked")
                          : tab === "in-progress"
                            ? t("home.tabs.inProgress")
                            : tab === "overdue"
                              ? t("home.tabs.overdue")
                              : t("home.tabs.completed")}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Mobile/Tablet Dropdown */}
            {!orgConfig?.disable_course_filters && (
              <div className="relative lg:hidden">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center justify-between px-3 py-2 w-32 h-[30px] bg-white border border-border rounded-[6px]">
                  <span className="font-lato font-medium text-[12px] text-text-muted">
                    {filter === "all"
                      ? t("home.tabs.all")
                      : filter === "locked"
                        ? t("home.tabs.locked")
                        : filter === "in-progress"
                          ? t("home.tabs.inProgress")
                          : filter === "overdue"
                            ? t("home.tabs.overdue")
                            : t("home.tabs.completed")}
                  </span>
                  <HiChevronDown
                    className={`w-4 h-4 text-text-muted transition-transform duration-200 ${
                      isDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isDropdownOpen && (
                  <div className="absolute top-full mt-1 w-32 bg-white border border-border rounded-[6px] shadow-lg z-50">
                    {["all", "locked", "in-progress", "overdue", "completed"].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => {
                          setFilter(tab);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-[12px] font-lato hover:bg-gray-50 ${
                          filter === tab ? "bg-primary text-light" : "text-text-muted"
                        }`}>
                        <span className="font-lato font-medium text-[12px] leading-4">
                          {tab === "all"
                            ? t("home.tabs.all")
                            : tab === "locked"
                              ? t("home.tabs.locked")
                              : tab === "in-progress"
                                ? t("home.tabs.inProgress")
                                : tab === "overdue"
                                  ? t("home.tabs.overdue")
                                  : t("home.tabs.completed")}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          )}

          {/* Course Grid */}
          <div className="flex flex-col items-start gap-3 sm:gap-[12px] w-full">
            {(() => {
              const filteredPresentations =
                presentations?.data?.filter((p) => {
                  // Filter by search query
                  const matchesSearch =
                    searchQuery === "" || p.title?.toLowerCase().includes(searchQuery.toLowerCase());

                  if (!matchesSearch) return false;

                  // Filter by status
                  if (filter === "all") return true;
                  if (filter === "locked") return p.lock_info?.status === "locked";
                  if (filter === "in-progress")
                    return (
                      p.lock_info?.status === "unlocked" &&
                      !p.isPresentationCompleted &&
                      p.due_info?.status !== "overdue"
                    );
                  if (filter === "overdue") return p.due_info?.status === "overdue" && !p.isPresentationCompleted;
                  if (filter === "completed") return p.isPresentationCompleted;
                  return true;
                }) || [];

              if (filteredPresentations.length === 0) {
                if (orgConfig?.disable_no_course_found) return null;

                return (
                  <div className="flex flex-col items-center justify-center w-full min-h-[50vh]">
                    <div className="flex flex-col items-center gap-4 text-center">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-bg-light-purple rounded-full flex items-center justify-center">
                        <HiBookOpen className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <h3 className="font-lato font-semibold text-lg sm:text-xl text-primary-text">
                          {t("home.noCoursesFound")}
                        </h3>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-[12px] w-full">
                  {filteredPresentations.map((presentation) => {
                    const isAssessmentModule =
                      isCiplaUser &&
                      presentation.title?.trim() === ASSESSMENT_MODULE_TITLE;
                    return (
                      <React.Fragment key={presentation.presentation_id}>
                        <PresentationCard
                          presentation={presentation}
                          currentTime={currentTime}
                          onClick={() => handlePresentationClick(presentation.presentation_id)}
                        />
                        {/* Assessment card — renders right after the matching card, only for cipla@pyzo.in */}
                        {isAssessmentModule && (
                          <div
                            className="relative flex flex-col items-start p-3 sm:p-[12px_12px_16px] gap-2 sm:gap-[10px] w-full min-w-[200px] sm:min-w-[280px] aspect-[331/223.5] bg-white rounded-[8px] transition-shadow duration-300 cursor-pointer hover:shadow-[0_4px_25px_rgba(0,0,0,0.1)]"
                            onClick={() =>
                              !isAssessmentLinkLoading &&
                              handleAssessmentCardClick()
                            }>
                            <div className="flex flex-col items-start gap-[12px] w-full flex-1">
                              {/* Thumbnail */}
                              <div className="w-full flex-1 bg-bg-light-purple rounded-[8px] overflow-hidden relative">
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
                                  <h3 className="font-lato font-semibold text-sm sm:text-[16px] leading-tight sm:leading-[19px] text-text-title flex-grow">
                                    {`${presentation?.title || ASSESSMENT_MODULE_TITLE} - Assessment`}
                                  </h3>
                                </div>
                                <div className="flex justify-between items-start gap-2 sm:gap-[8px] w-full">
                                  <span className="font-lato font-normal text-xs sm:text-[12px] leading-tight sm:leading-[14px] text-text-secondary">
                                    {presentation?.author || ""}
                                  </span>
                                  <div className="flex justify-center items-center px-1.5 py-[2.5px] h-5 rounded-[10px] bg-blue-500">
                                    <span className="font-lato font-medium text-[11px] leading-4 text-white">
                                      Assessment
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            {/* Simple Loading Overlay */}
                            {isAssessmentLinkLoading && (
                              <div className="absolute inset-0 bg-white/70 rounded-[8px] flex items-center justify-center z-20">
                                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                              </div>
                            )}
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <FeedbackSuccessModal isOpen={showSuccessModal} onClose={handleSuccessModalClose} />

       {/* Floating Chatbot */}
      {presentations?.organization?.agent?.enabled && (
        <FloatingChatbot agentId={presentations.organization.agent.id} />
      )}
    </>
  );
};

export default Home;
