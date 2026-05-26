"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useLocalizedRouter } from "@/hooks/useLocalizedRouter";
import { useSelector } from "react-redux";
import { RootState } from "@/store";

import { useGetPresentationStatsQuery, useGetAssessmentStatsQuery } from "@/store/api/analyticsApi";
import Tabs from "@/components/common/Tabs";
import ErrorState from "@/components/common/ErrorState";
import Learning from "@/components/pages/Learning";
import Assessments from "@/components/pages/Assessments";

export default function Analytics() {
  const router = useLocalizedRouter();
  const searchParams = useSearchParams();

  const initializeActiveTabFromURL = () => {
    return searchParams.get("tab") || "learning";
  };

  const initializeFiltersFromURL = () => {
    const filters = {};
    searchParams.forEach((value, key) => {
      if (key.startsWith("filter_")) {
        const paramName = key.replace("filter_", "");
        filters[paramName] = value.split(",");
      }
    });
    return filters;
  };

  const [activeTab, setActiveTab] = useState(initializeActiveTabFromURL());
  const [appliedFilters, setAppliedFilters] = useState(initializeFiltersFromURL());

  const tabs = [
    { id: "learning", label: "Learning" },
    { id: "assessments", label: "Assessments" },
  ];

  const handleTabChange = (tabId) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tabId);
    router.push(`?${params.toString()}`);
    setActiveTab(tabId);
  };

  const buildUrlWithFilters = (basePath, additionalFilters) => {
    const params = new URLSearchParams();

    // Add current filters
    Object.entries(appliedFilters).forEach(([key, values]) => {
      if (values.length > 0) {
        params.set(`filter_${key}`, values.join(","));
      }
    });

    // Add any additional filters
    if (additionalFilters) {
      Object.entries(additionalFilters).forEach(([key, value]) => {
        params.set(key, value);
      });
    }

    return `${basePath}${params.toString() ? `?${params.toString()}` : ""}`;
  };

  // API params for presentation stats
  const presentationStatsParams = useMemo(() => {
    const params = {};
    const groupFilters = {};
    Object.entries(appliedFilters).forEach(([key, value]) => {
      if (value?.length) {
        groupFilters[key] = value;
      }
    });
    if (Object.keys(groupFilters).length > 0) {
      params.groupIds = groupFilters;
    }
    return params;
  }, [appliedFilters]);

  const {
    data: presentationStatsData,
    isLoading: isLoadingStats,
    error: statsError,
    refetch: refetchStats,
  } = useGetPresentationStatsQuery(presentationStatsParams, {
    skip: activeTab !== "learning",
    refetchOnMountOrArgChange: true,
  });

  const {
    data: assessmentStatsData,
    isLoading: isLoadingAssessmentStats,
    error: assessmentStatsError,
    refetch: refetchAssessmentStats,
  } = useGetAssessmentStatsQuery(presentationStatsParams, {
    skip: activeTab !== "assessments",
    refetchOnMountOrArgChange: true,
  });

  const learningData = useMemo(() => {
    if (!presentationStatsData?.summary_metrics) {
      return [{ title: "Total Presentations", value: "0" }];
    }

    return presentationStatsData.summary_metrics.map((metric, index) => ({
      title: metric.title,
      value: metric.value,
      onClick: index === 0 ? () => router.push(buildUrlWithFilters("/modules")) : undefined,
    }));
  }, [presentationStatsData, router, buildUrlWithFilters]);

  const assessmentsData = useMemo(() => {
    if (!assessmentStatsData?.summary_metrics) {
      return [{ title: "Total Assessments", value: "0" }];
    }

    return assessmentStatsData.summary_metrics.map((metric, index) => ({
      title: metric.title,
      value: metric.value,
      onClick: index === 0 ? () => router.push(buildUrlWithFilters("/assessments")) : undefined,
    }));
  }, [assessmentStatsData, router, buildUrlWithFilters]);

  const handleFilterChange = (filters) => {
    const params = new URLSearchParams(searchParams.toString());
    Array.from(params.keys()).forEach((key) => {
      if (key.startsWith("filter_")) {
        params.delete(key);
      }
    });
    Object.entries(filters).forEach(([key, values]) => {
      if (values.length > 0) {
        params.set(`filter_${key}`, values.join(","));
      }
    });
    router.push(`?${params.toString()}`);
    setAppliedFilters(filters);
  };

  return (
    <div className="p-4 lg:p-5 bg-gray-50 h-[calc(100vh-50px)]">
      <div className="sm:bg-white w-full rounded-lg sm:px-4 py-4 sm:py-5">
        <div className="flex justify-between items-start">
          <div className="space-y-1 mb-4">
            <h2 className="font-lato font-bold text-[16px] md:text-[20px] leading-[100%] tracking-[0.01em] text-text-heading">
              Analytics
            </h2>
            <p className="font-lato font-normal text-[12px] leading-[15px] md:leading-[100%] tracking-[0em] text-text-body">
              Track user progress and achievements
            </p>
          </div>
          {/* <div>
            <Filter
              sections={
                isMetadataLoaded
                  ? activeTab === "learning"
                    ? metadata.analyticsLearningPage
                    : metadata.analyticsAssessmentsPage
                  : []
              }
              onFilterChange={handleFilterChange}
              appliedFilters={appliedFilters}
            />
          </div> */}
        </div>
        {/* <AppliedFilters
          appliedFilters={appliedFilters}
          filterSections={
            isMetadataLoaded
              ? activeTab === "learning"
                ? metadata.analyticsLearningPage
                : metadata.analyticsAssessmentsPage
              : []
          }
          onFilterChange={handleFilterChange}
          showDeleteButton={false}
        /> */}
        <div className="mb-4">
          <Tabs tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} />
        </div>
        {activeTab === "learning" &&
          (statsError ? (
            <ErrorState message="Failed to load learning analytics. Please try again." onRetry={refetchStats} />
          ) : (
            <Learning isLoading={isLoadingStats} analyticsData={learningData} />
          ))}
        {activeTab === "assessments" &&
          (assessmentStatsError ? (
            <ErrorState
              message="Failed to load assessment analytics. Please try again."
              onRetry={refetchAssessmentStats}
            />
          ) : (
            <Assessments isLoading={isLoadingAssessmentStats} analyticsData={assessmentsData} />
          ))}
      </div>
    </div>
  );
}
