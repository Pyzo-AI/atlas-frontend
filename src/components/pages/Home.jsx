"use client";
import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useLocalizedRouter } from "@/hooks/useLocalizedRouter";
import Image from "next/image";
import { useGetPresentationsQuery, useGetDashboardSummaryQuery } from "../../store/api/questionsApi";
import { getUserDetailsFromToken } from "@/store/utils/token";
import { usePostHog } from "@/hooks/usePostHog";
import FeedbackSuccessModal from "../modals/FeedbackSuccessModal";
import { useDispatch, useSelector } from "react-redux";
import { setAutoPlayEnabled, setSelectedAssessmentId, setShowChat, setIsQuestionMode } from "@/store/features/videoSlice";
import { HiBookOpen } from "react-icons/hi2";
import FloatingChatbot from "../common/FloatingChatbot";
import ModuleStatsOverview from "../common/ModuleStatsOverview";
import Pagination from "../common/Pagination";
import QuickFilter from "../common/QuickFilter";
import SearchBar from "../common/SearchBar";
import PyzoLoader from "../common/PyzoLoader";
import { useTranslation } from "react-i18next";

const STATUS_OPTIONS = ["all", "in_progress", "yet_to_start", "locked", "overdue", "completed"];
const PAGE_SIZE = 8;

const BADGE_STYLES = {
  completed: { bg: "bg-[#DCFCE7]", text: "text-[#159600]" },
  in_progress: { bg: "bg-[#DBEAFE]", text: "text-[#1447E6]" },
  yet_to_start: { bg: "bg-border-light", text: "text-text-title" },
  locked: { bg: "bg-border-light", text: "text-text-title" },
  overdue: { bg: "bg-[#F0463819]", text: "text-[#F04638]" },
};

const useBadge = () => {
  const { t } = useTranslation();
  return (presentation) => {
    const style = BADGE_STYLES[presentation.status] || BADGE_STYLES.yet_to_start;
    switch (presentation.status) {
      case "completed": {
        const completedDate = presentation.presentationCompletedDate
          ? new Date(presentation.presentationCompletedDate).toLocaleDateString("en-GB")
          : t("courseCard.unknownDate");
        return { ...style, label: t("courseCard.completedDate", { date: completedDate }) };
      }
      case "locked":
        return { ...style, label: presentation.lock_info?.status_msg || t("courseCard.locked") };
      case "overdue":
        return { ...style, label: presentation.due_info?.status_msg || t("courseCard.overdue") };
      case "yet_to_start":
        return {
          ...style,
          label:
            presentation.due_info?.status === "due"
              ? t("courseCard.todoDueIn", { count: presentation.due_info?.status_msg?.match(/\d+/)?.[0] || "" })
              : t("courseCard.yetToStart"),
        };
      case "in_progress":
      default:
        return {
          ...style,
          label: `${t("courseCard.inProgress")}${
            presentation.completion_percentage ? ` - ${presentation.completion_percentage}%` : ""
          }`,
        };
    }
  };
};

const formatDuration = (seconds, t) => {
  const totalSeconds = Math.max(0, Math.round(seconds || 0));
  if (totalSeconds < 60) return `${totalSeconds}${t("courseCard.s")}`;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) {
    return minutes > 0 ? `${hours}${t("courseCard.hr")} ${minutes}${t("courseCard.m")}` : `${hours}${t("courseCard.hr")}`;
  }
  return `${minutes}${t("courseCard.m")}`;
};

const formatDueDate = (dueTime) => (dueTime ? new Date(dueTime).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "-");

// Desktop grid card: flag badge overlaid on thumbnail, due date/duration row below
const DesktopModuleCard = ({ presentation, onClick, getBadge }) => {
  const { t } = useTranslation();
  const badge = getBadge(presentation);
  const isLocked = presentation.status === "locked";

  return (
    <div
      className={`hidden sm:flex flex-col items-stretch p-[10px_10px_12px] gap-2.5 w-full bg-white border border-border-card rounded-lg transition-shadow duration-300 ${
        isLocked ? "cursor-not-allowed" : "cursor-pointer hover:shadow-[0_4px_25px_rgba(0,0,0,0.1)]"
      }`}
      onClick={isLocked ? undefined : onClick}>
      <div className="relative w-full aspect-[271/132] bg-[#F5F6FC] rounded-md overflow-hidden">
        {presentation?.image && presentation.image.trim() !== "" && (
          <Image src={presentation.image} alt={presentation?.title} fill className="object-cover" />
        )}
        {badge.label && (
          <div className={`absolute left-0 top-1.5 flex items-center px-[5px] py-[6px] rounded-r-lg ${badge.bg}`}>
            <span className={`font-lato font-medium text-[12px] leading-none whitespace-nowrap ${badge.text}`}>
              {badge.label}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col items-stretch gap-2.5 w-full">
        <div className="flex flex-col items-stretch gap-1.5 w-full">
          <h3 className="font-lato font-semibold text-sm leading-tight text-text-title truncate">
            {presentation?.title || "Unknown Title"}
          </h3>
          <span className="font-lato font-normal text-xs leading-tight text-text-secondary truncate">
            {presentation?.author || "Unknown Author"}
          </span>
        </div>

        <div className="flex justify-between items-center gap-2 w-full">
          <div className="flex items-center gap-0.5">
            <span className="font-lato text-xs text-text-secondary">{t("courseCard.dueDateLabel")}</span>
            <span className="font-lato font-semibold text-xs text-text-title">
              {formatDueDate(presentation?.due_info?.due_time)}
            </span>
          </div>
          <div className="flex items-center gap-0.5">
            <span className="font-lato text-xs text-text-secondary">{t("courseCard.durationLabel")}</span>
            <span className="font-lato font-semibold text-xs text-text-title">
              {formatDuration(presentation.presentation_duration, t)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Mobile list card: small thumbnail, pill badge above title, due date/duration row below
const MobileModuleCard = ({ presentation, onClick, getBadge }) => {
  const { t } = useTranslation();
  const badge = getBadge(presentation);
  const isLocked = presentation.status === "locked";

  return (
    <div
      className={`sm:hidden flex items-stretch gap-2 w-full p-2 bg-white border border-border-card rounded-xl ${
        isLocked ? "cursor-not-allowed" : "cursor-pointer"
      }`}
      onClick={isLocked ? undefined : onClick}>
      <div className="relative w-20 h-20 shrink-0 bg-bg-light-purple rounded-lg overflow-hidden">
        {presentation?.image && presentation.image.trim() !== "" && (
          <Image src={presentation.image} alt={presentation?.title} fill className="object-cover" />
        )}
      </div>
      <div className="flex flex-col justify-center gap-2 min-w-0 flex-1">
        {badge.label && (
          <div className={`self-start flex items-center px-1.5 py-1 rounded-[10px] ${badge.bg}`}>
            <span className={`font-lato font-medium text-[11px] leading-none whitespace-nowrap ${badge.text}`}>
              {badge.label}
            </span>
          </div>
        )}
        <div className="flex flex-col gap-0.5 min-w-0">
          <h3 className="font-lato font-semibold text-sm text-text-title truncate">{presentation?.title || "Unknown Title"}</h3>
          <span className="font-lato text-xs text-text-secondary truncate">{presentation?.author || "Unknown Author"}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-0.5">
            <span className="font-lato text-[10px] text-text-secondary">{t("courseCard.dueDateLabel")}</span>
            <span className="font-lato font-semibold text-[11px] text-text-title">
              {formatDueDate(presentation?.due_info?.due_time)}
            </span>
          </div>
          <div className="flex items-center gap-0.5">
            <span className="font-lato text-[10px] text-text-secondary">{t("courseCard.durationLabel")}</span>
            <span className="font-lato font-semibold text-[11px] text-text-title">
              {formatDuration(presentation.presentation_duration, t)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};


const Home = () => {
  const router = useLocalizedRouter();
  const searchParams = useSearchParams();
  const [filter, setFilter] = useState("all");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [page, setPage] = useState(1);
  const { capture } = usePostHog();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const orgConfig = useSelector((state) => state.organization?.config);
  const userDetails = getUserDetailsFromToken();
  const getBadge = useBadge();

  const handleSearchChange = (term) => {
    setSearchQuery(term);
    setPage(1);
  };

  useEffect(() => {
    setPage(1);
  }, [filter, sortOrder]);

  // Check for feedback success parameter
  useEffect(() => {
    const feedbackParam = searchParams.get("feedback");
    if (feedbackParam === "success") {
      setShowSuccessModal(true);
    }
  }, [searchParams]);

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    router.replace("/");
  };

  useEffect(() => {
    dispatch(setAutoPlayEnabled(false));
    dispatch(setSelectedAssessmentId(null));
  }, []);

  const {
    data: presentations = {},
    isFetching: loading,
    error,
  } = useGetPresentationsQuery(
    { search: searchQuery, status: filter, sortOrder, page, pageSize: PAGE_SIZE },
    { refetchOnMountOrArgChange: true }
  );

  const { data: dashboardSummary, isFetching: statsLoading } = useGetDashboardSummaryQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  // Only the very first load (no data on screen yet at all) gets the
  // full-screen loader; any later refetch (search/filter/sort/page change)
  // only replaces the module list area, keeping stats/header/filters visible.
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [minLoaderTimeElapsed, setMinLoaderTimeElapsed] = useState(false);

  // Keep the full-screen loader up for at least 3s, even if data arrives sooner.
  useEffect(() => {
    const timer = setTimeout(() => setMinLoaderTimeElapsed(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hasLoadedOnce && !loading && !statsLoading && minLoaderTimeElapsed) {
      setHasLoadedOnce(true);
    }
  }, [loading, statsLoading, minLoaderTimeElapsed, hasLoadedOnce]);

  // Once the page has loaded once, any later refetch (filter/search/sort/page
  // change) keeps the in-area loader up for at least 2s too, even if the
  // response comes back faster.
  const [showAreaLoader, setShowAreaLoader] = useState(false);
  const areaLoaderStartRef = useRef(null);

  useEffect(() => {
    if (loading) {
      if (!showAreaLoader) {
        areaLoaderStartRef.current = Date.now();
        setShowAreaLoader(true);
      }
      return;
    }
    if (showAreaLoader) {
      const elapsed = Date.now() - (areaLoaderStartRef.current || 0);
      const remaining = Math.max(0, 2000 - elapsed);
      const timer = setTimeout(() => setShowAreaLoader(false), remaining);
      return () => clearTimeout(timer);
    }
  }, [loading, showAreaLoader]);

  const handlePresentationClick = (presentationId) => {
    capture("module_start", {
      user_id: userDetails?.sub,
      module_id: presentationId,
      timestamp: new Date().toISOString(),
    });
    dispatch(setShowChat(false));
    dispatch(setIsQuestionMode(false));
    router.push(`/lectures/${presentationId}`);
  };

  const statusLabel = (status) =>
    ({
      all: t("home.tabs.all"),
      locked: t("home.tabs.locked"),
      in_progress: t("home.tabs.inProgress"),
      yet_to_start: t("home.tabs.yetToStart"),
      overdue: t("home.tabs.overdue"),
      completed: t("home.tabs.completed"),
    })[status];

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

  const items = presentations?.data || [];
  const pagination = presentations?.pagination;

  if (!hasLoadedOnce) {
    return <PyzoLoader fullScreen />;
  }

  return (
    <>
      <div className="w-full min-h-screen bg-page-background">
        <div className="flex flex-col items-stretch gap-5 w-full px-4 sm:px-5 py-5 max-w-[1240px] mx-auto">
          {/* Page header */}
          <div className="flex flex-col gap-1 w-full">
            <h1 className="font-lato font-bold text-base text-text-title">{t("home.availableCourses")}</h1>
            <p className="font-lato text-xs text-text-muted">{t("home.browseDescription")}</p>
          </div>

          {/* Learning Overview */}
          <div className="flex flex-col items-stretch gap-2.5 w-full">
            <h3 className="font-lato font-semibold text-sm text-text-title">{t("home.learningOverview")}</h3>
            <ModuleStatsOverview summary={dashboardSummary} isLoading={statsLoading} />
          </div>

          {/* Search + filters */}
          {!orgConfig?.disable_course_header_row && (
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 w-full">
              {!orgConfig?.disable_course_search && (
                <SearchBar
                  initialValue={searchQuery}
                  onSearchChange={handleSearchChange}
                  placeholder={t("home.searchCourses")}
                  width="100%"
                  className="sm:!w-80"
                />
              )}

              {!orgConfig?.disable_course_filters && (
                <div className="flex items-center gap-3 shrink-0">
                  <QuickFilter
                    value={filter}
                    onChange={setFilter}
                    options={STATUS_OPTIONS.map((s) => ({ id: s, label: statusLabel(s) }))}
                    placeholder={`${t("home.stats.status")}:`}
                  />
                  <QuickFilter
                    value={sortOrder}
                    onChange={setSortOrder}
                    options={[
                      { id: "asc", label: `${t("home.sortByDueDate")} (${t("home.sortEarliest")})` },
                      { id: "desc", label: `${t("home.sortByDueDate")} (${t("home.sortLatest")})` },
                    ]}
                    placeholder={`${t("home.sortBy")}:`}
                  />
                </div>
              )}
            </div>
          )}

          {/* Module list */}
          <div className="flex flex-col items-center gap-4 w-full">
            {showAreaLoader ? (
              // Matches ~2 rows of cards (mobile list rows vs. desktop grid
              // cards have very different heights) so switching page/filter
              // doesn't shift the page height around the loader.
              <PyzoLoader fullScreen={false} heightClassName="min-h-[208px] sm:min-h-[490px]" />
            ) : items.length === 0 ? (
              orgConfig?.disable_no_course_found ? null : (
                <div className="flex flex-col items-center justify-center w-full min-h-[40vh]">
                  <div className="flex flex-col items-center gap-4 text-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-bg-light-purple rounded-full flex items-center justify-center">
                      <HiBookOpen className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                    </div>
                    <h3 className="font-lato font-semibold text-lg sm:text-xl text-primary-text">{t("home.noCoursesFound")}</h3>
                  </div>
                </div>
              )
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
                {items.map((presentation) => (
                  <React.Fragment key={presentation.presentation_id}>
                    <DesktopModuleCard
                      presentation={presentation}
                      getBadge={getBadge}
                      onClick={() => handlePresentationClick(presentation.presentation_id)}
                    />
                    <MobileModuleCard
                      presentation={presentation}
                      getBadge={getBadge}
                      onClick={() => handlePresentationClick(presentation.presentation_id)}
                    />
                  </React.Fragment>
                ))}
              </div>
            )}

            {/* Stays put (uses the last known page info) while a filter/sort/page
                change is loading — only the cards area above swaps for the loader. */}
            {pagination && <Pagination page={pagination.page} totalPages={pagination.total_pages} onPageChange={setPage} />}
          </div>
        </div>
      </div>

      <FeedbackSuccessModal isOpen={showSuccessModal} onClose={handleSuccessModalClose} />

      {presentations?.organization?.agent?.enabled && (
        <FloatingChatbot agentId={presentations.organization.agent.id} />
      )}
    </>
  );
};

export default Home;
