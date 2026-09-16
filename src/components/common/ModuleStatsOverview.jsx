import React from "react";
import { HiAcademicCap, HiClipboardDocumentList } from "react-icons/hi2";
import { useTranslation } from "react-i18next";

const StatMetric = ({ value, label, compact }) =>
  compact ? (
    <div className="flex items-baseline gap-1">
      <span className="font-lato font-bold text-xs text-[#111827]">{value}</span>
      <span className="font-lato text-[10px] text-[#718096] whitespace-nowrap">{label}</span>
    </div>
  ) : (
    <div className="flex flex-1 flex-col gap-1 px-3 py-2 border border-[#E4E6E8] rounded-[6px] min-w-[70px]">
      <span className="font-lato font-bold text-[16px] leading-[19px] text-[#1D1F2C]">{value}</span>
      <span className="font-lato font-medium text-[11px] leading-[13px] text-[#585858] whitespace-nowrap">{label}</span>
    </div>
  );

const StatBlock = ({ iconBg, icon, iconSize, title, value, metrics, compact }) => (
  <div className="flex flex-col gap-3 w-full">
    <div className="flex items-center gap-4 w-full">
      <div
        className={`flex items-center justify-center shrink-0 rounded-xl ${iconBg} ${
          compact ? "w-9 h-9 rounded-lg" : "w-[52px] h-[52px]"
        }`}>
        {icon}
      </div>
      <div className="flex flex-col items-stretch gap-1 min-w-0">
        <span className={`font-lato font-bold uppercase text-[#595959] ${compact ? "text-[10px] normal-case" : "text-xs"}`}>
          {title}
        </span>
        <span className={`font-lato font-bold text-[#333333] leading-none ${compact ? "text-lg" : "text-[28px] leading-[34px]"}`}>
          {value}
        </span>
      </div>
    </div>
    <div className={`flex items-stretch w-full ${compact ? "flex-wrap gap-x-4 gap-y-2" : "gap-2"}`}>
      {metrics.map((m) => (
        <StatMetric key={m.label} value={m.value} label={m.label} compact={compact} />
      ))}
    </div>
  </div>
);

const ModuleStatsOverview = ({ summary, isLoading }) => {
  const { t } = useTranslation();

  const modules = summary?.modules;
  const assessments = summary?.assessments;
  const dash = isLoading ? "-" : null;

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

  const moduleBlock = (compact) => (
    <StatBlock
      iconBg="bg-[#E9EFFD]"
      icon={<HiAcademicCap className={compact ? "w-4 h-4 text-primary" : "w-6 h-6 text-primary"} />}
      title={t("home.stats.modulesAssigned")}
      value={dash ?? modules?.assigned ?? 0}
      metrics={moduleMetrics}
      compact={compact}
    />
  );

  const assessmentBlock = (compact) => (
    <StatBlock
      iconBg="bg-[#E6F7F0]"
      icon={<HiClipboardDocumentList className={compact ? "w-4 h-4 text-[#159600]" : "w-6 h-6 text-[#159600]"} />}
      title={t("home.stats.totalAssessments")}
      value={dash ?? assessments?.total ?? 0}
      metrics={assessmentMetrics}
      compact={compact}
    />
  );

  return (
    <>
      {/* Desktop / tablet: two separate cards side by side, wrapping on narrower widths */}
      <div className="hidden sm:flex flex-wrap items-stretch gap-5 w-full">
        <div className="flex-1 min-w-[280px] p-5 bg-white border border-[#EDEDED] rounded-[14px]">
          {moduleBlock(false)}
        </div>
        <div className="flex-1 min-w-[280px] p-5 bg-white border border-[#EDEDED] rounded-[14px]">
          {assessmentBlock(false)}
        </div>
      </div>

      {/* Mobile: both blocks inside one card, divided */}
      <div className="sm:hidden flex flex-col gap-3 w-full p-4 bg-white border border-[#EDEDED] rounded-xl divide-y divide-[#E4E6E8]">
        <div className="pb-3">{moduleBlock(true)}</div>
        <div className="pt-3">{assessmentBlock(true)}</div>
      </div>
    </>
  );
};

export default ModuleStatsOverview;
