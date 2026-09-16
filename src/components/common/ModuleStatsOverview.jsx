import React from "react";
import Image from "next/image";
import graduationCap from "@/assets/svg/graduation-cap.svg";
import clipboardList from "@/assets/svg/clipboard-list.svg";
import { useTranslation } from "react-i18next";

// ============= Desktop (node 8368:58460): circular icon, divider-separated metrics =============

const DesktopMetric = ({ value, label, isLast }) => (
  <div className={`flex flex-1 items-stretch ${isLast ? "" : "gap-4"}`}>
    <div className="flex flex-1 flex-col gap-1 py-1">
      <span className="font-lato font-bold text-base leading-tight text-[#1D1F2C]">{value}</span>
      <span className="font-lato font-medium text-[11px] leading-tight text-[#585858] whitespace-nowrap">{label}</span>
    </div>
    {!isLast && <div className="w-px bg-[#E4E6E8]" />}
  </div>
);

const DesktopStatCard = ({ iconBg, icon, title, value, metrics }) => (
  <div className="flex-1 min-w-[280px] flex flex-col gap-2 px-5 py-4 bg-white border border-[#EDEDED] rounded-[14px]">
    <div className="flex items-center gap-2 w-full">
      <div className={`flex items-center justify-center w-11 h-11 rounded-[7.33px] shrink-0 ${iconBg}`}>{icon}</div>
      <div className="flex flex-col gap-1 min-w-0">
        <span className="font-lato font-bold text-xs uppercase text-[#595959]">{title}</span>
        <span className="font-lato font-bold text-2xl text-[#333333]">{value}</span>
      </div>
    </div>
    <div className="flex items-stretch gap-4 w-full">
      {metrics.map((m, i) => (
        <DesktopMetric key={m.label} value={m.value} label={m.label} isLast={i === metrics.length - 1} />
      ))}
    </div>
  </div>
);

// ============= Mobile (node 8353:24956): one card, inline "Modules 23 assigned" title line =============

const MobileMetric = ({ value, label }) => (
  <div className="flex items-center gap-1">
    <span className="font-lato font-bold text-xs text-[#111827]">{value}</span>
    <span className="font-lato text-[10px] text-[#718096] whitespace-nowrap">{label}</span>
  </div>
);

const MobileStatRow = ({ iconBg, icon, titlePrefix, value, valueSuffix, metrics }) => (
  <div className="flex items-center gap-2 w-full">
    <div className={`flex items-center justify-center w-9 h-9 rounded-md shrink-0 ${iconBg}`}>{icon}</div>
    <div className="flex flex-col gap-1 flex-1 min-w-0">
      <div className="flex items-center gap-1">
        <span className="font-lato font-bold text-xs text-[#111827]">{titlePrefix}</span>
        <span className="font-lato font-extrabold text-base text-[#111827]">{value}</span>
        <span className="font-lato text-xs text-[#718096]">{valueSuffix}</span>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        {metrics.map((m) => (
          <MobileMetric key={m.label} value={m.value} label={m.label} />
        ))}
      </div>
    </div>
  </div>
);

const ModuleStatsOverview = ({ summary, isLoading }) => {
  const { t } = useTranslation();

  const modules = summary?.modules;
  const assessments = summary?.assessments;
  const dash = isLoading ? "-" : null;

  const moduleIcon = (size) => <Image src={graduationCap} alt="" width={size} height={size} />;
  const assessmentIcon = (size) => <Image src={clipboardList} alt="" width={size} height={size} />;

  const moduleMetrics = [
    { value: dash ?? modules?.completed ?? 0, label: t("home.stats.completed") },
    { value: dash ?? modules?.in_progress ?? 0, label: t("home.stats.inProgress") },
    { value: dash ?? modules?.yet_to_start ?? 0, label: t("home.stats.yetToStart") },
    { value: dash ?? modules?.learning_time_hours ?? 0, label: t("home.stats.learningTimeHrs") },
  ];
  const assessmentMetrics = [
    { value: dash ?? assessments?.completed ?? 0, label: t("home.stats.completed") },
    { value: dash ?? assessments?.yet_to_start ?? 0, label: t("home.stats.yetToStart") },
    { value: dash ?? `${assessments?.average_score ?? 0}%`, label: t("home.stats.averageScore") },
  ];

  const moduleMetricsCompact = [
    { value: dash ?? modules?.completed ?? 0, label: t("home.stats.compact.done") },
    { value: dash ?? modules?.in_progress ?? 0, label: t("home.stats.compact.inProgress") },
    { value: dash ?? modules?.yet_to_start ?? 0, label: t("home.stats.compact.toStart") },
    { value: dash ?? modules?.learning_time_hours ?? 0, label: t("home.stats.compact.learningTime") },
  ];
  const assessmentMetricsCompact = [
    { value: dash ?? assessments?.completed ?? 0, label: t("home.stats.compact.done") },
    { value: dash ?? assessments?.yet_to_start ?? 0, label: t("home.stats.compact.yetToStart") },
    { value: dash ?? `${assessments?.average_score ?? 0}%`, label: t("home.stats.compact.avgScore") },
  ];

  return (
    <>
      {/* Desktop / tablet: two separate cards side by side, wrapping on narrower widths */}
      <div className="hidden sm:flex flex-wrap items-stretch gap-5 w-full">
        <DesktopStatCard
          iconBg="bg-[#E9EFFD]"
          icon={moduleIcon(22)}
          title={t("home.stats.modulesAssigned")}
          value={dash ?? modules?.assigned ?? 0}
          metrics={moduleMetrics}
        />
        <DesktopStatCard
          iconBg="bg-[#E6F7F0]"
          icon={assessmentIcon(20)}
          title={t("home.stats.totalAssessments")}
          value={dash ?? assessments?.total ?? 0}
          metrics={assessmentMetrics}
        />
      </div>

      {/* Mobile: both rows inside one card, divided by a horizontal rule */}
      <div className="sm:hidden flex flex-col gap-3 w-full p-4 bg-white border border-[#EDEDED] rounded-xl divide-y divide-[#E4E6E8]">
        <div className="pb-3">
          <MobileStatRow
            iconBg="bg-[#E9EFFD]"
            icon={moduleIcon(18)}
            titlePrefix={t("home.stats.compact.modulesTitle")}
            value={dash ?? modules?.assigned ?? 0}
            valueSuffix={t("home.stats.compact.assignedSuffix")}
            metrics={moduleMetricsCompact}
          />
        </div>
        <div className="pt-3">
          <MobileStatRow
            iconBg="bg-[#E6F7F0]"
            icon={assessmentIcon(17)}
            titlePrefix={t("home.stats.compact.assessmentsTitle")}
            value={dash ?? assessments?.total ?? 0}
            valueSuffix={t("home.stats.compact.totalSuffix")}
            metrics={assessmentMetricsCompact}
          />
        </div>
      </div>
    </>
  );
};

export default ModuleStatsOverview;
