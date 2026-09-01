import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  useGetAssessmentQuery,
  useLazyGetAssessmentQuery,
  useSubmitAssessmentMutation,
  questionsApi,
} from "@/store/api/questionsApi";
import RolePlayConfirmationModal from "@/components/modals/RolePlayConfirmationModal";
import {
  setSelectedAssessmentId,
  setCurrentVideoIndex,
  setCurrentSlide,
  setCurrentVideoTime,
  setAutoPlayEnabled,
  markAssessmentCompleted,
} from "@/store/features/videoSlice";
import { usePostHog } from "@/hooks/usePostHog";
import { getUserDetailsFromToken } from "@/store/utils/token";
import { toast } from "react-toastify";
import { getApiErrorMessage } from "@/utils/errorHandler";
import { useParams } from "next/navigation";
import ResultModal from "@/components/modals/ResultModal";
import FeedbackModal from "@/components/modals/FeedbackModal";
import { setAssessmentCompleted } from "@/utils/assessmentProgress";
import RadioButton from "@/components/ui/RadioButton";
import TextArea from "@/components/ui/TextArea";
import { HiExclamationCircle } from "react-icons/hi2";
import { useTranslation } from "react-i18next";

// Role Play Confirmation Modal
const RolePlayConfirmModal = ({ isOpen, onClose, onConfirm, isStarting }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal Card */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 flex flex-col gap-4 animate-modal-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
        </div>

        {/* Heading */}
        <div className="text-center">
          <h3 className="text-base font-bold text-gray-900 mb-1">Ready to take the challenge? 🎯</h3>
          <p className="text-[13px] text-gray-500 leading-snug">
            Take a deep breath — you&apos;ve got this! Just make sure you&apos;re in a quiet spot with a working microphone before you begin.
          </p>
        </div>

        {/* Warning Box */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <p className="text-[12px] text-amber-800 leading-snug">
            <span className="font-semibold">Heads up:</span> Once you click &ldquo;Take Assessment&rdquo; below, this assessment will be <span className="font-semibold">locked for 30 minutes</span> while your session is in progress.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            disabled={isStarting}
            className="flex-1 py-2 px-4 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Not yet
          </button>
          <button
            onClick={onConfirm}
            disabled={isStarting}
            className="flex-1 py-2 px-4 rounded-xl bg-[#2762EA] hover:bg-[#1E4FD9] text-white text-sm font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
          >
            {isStarting ? (
              <>
                <svg className="animate-spin w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Starting...
              </>
            ) : (
              "Take Assessment"
            )}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes modal-in {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to   { opacity: 1; transform: scale(1)   translateY(0); }
        }
        .animate-modal-in { animation: modal-in 0.18s ease-out both; }
      `}</style>
    </div>
  );
};

// Role Play Assessment View – handles confirmation modal, start API, and in-progress lock
const RolePlayAssessmentView = ({ assessmentData, selectedAssessmentId }) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isInProgress, setIsInProgress] = useState(
    // Pre-populate from the already-fetched assessment data if it has in_progress
    () => assessmentData?.in_progress === true
  );

  // Lazy query so we can trigger it on demand (same endpoint already used by getAssessment)
  const [triggerStart] = questionsApi.endpoints.getAssessment.useLazyQuery();

  // Keep isInProgress in sync if the parent refetches and passes new data
  useEffect(() => {
    if (assessmentData?.in_progress === true) {
      setIsInProgress(true);
    }
  }, [assessmentData?.in_progress]);

  const handleConfirm = async () => {
    setIsStarting(true);
    try {
      const result = await triggerStart(selectedAssessmentId, true /* preferCacheValue=false */).unwrap();
      if (result?.in_progress === true) {
        setIsInProgress(true);
      }
      // Open interview link in new tab (same as before)
      if (assessmentData?.interview_link) {
        window.open(assessmentData.interview_link, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      console.error("Failed to start role play assessment:", err);
      toast.error("Failed to start the assessment. Please try again.");
    } finally {
      setIsStarting(false);
      setShowConfirmModal(false);
    }
  };

  // ── In-Progress locked state ────────────────────────────────────────────────
  if (isInProgress) {
    return (
      <div className="w-full h-full bg-white rounded-xl flex flex-col overflow-hidden">
        <div className="flex-1 flex flex-col justify-center items-center p-4 sm:p-6">
          <div className="w-full max-w-sm flex flex-col items-center text-center gap-4">
            {/* Lock icon */}
            <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-[#2762EA]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>

            <div>
              <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-1">Assessment In Progress</h3>
              <p className="text-[12px] sm:text-[13px] text-gray-500 leading-snug">
                Your role play session has started! This assessment is locked for <span className="font-semibold text-gray-700">30 minutes</span> while your session is in progress.
              </p>
            </div>

            {/* Info card */}
            <div className="w-full bg-blue-50 border border-blue-200 rounded-xl p-3 text-left">
              <div className="flex items-start gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-[#2762EA] shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p className="text-[11px] sm:text-[12px] text-blue-800 leading-snug">
                  Your evaluation results will be processed and updated within <span className="font-semibold">1 hour</span> after you complete the session.
                </p>
              </div>
            </div>

            {/* Re-open link button */}
            {assessmentData?.interview_link && (
              <a
                href={assessmentData.interview_link}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-5 bg-[#2762EA] hover:bg-[#1E4FD9] text-white font-semibold rounded-lg text-xs sm:text-sm transition-all duration-150 shadow-sm flex items-center gap-1.5"
              >
                <span>Continue Assessment</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" x2="21" y2="3" />
                </svg>
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Default card (ready to start) ──────────────────────────────────────────
  return (
    <>
      <div className="w-full h-full bg-white rounded-xl flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto flex flex-col justify-center items-center p-3 sm:p-5 md:p-6">
          <div className="w-full max-w-sm sm:max-w-md flex flex-col items-center text-center">
            {/* Clean Icon Badge */}
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-[#2762EA] flex items-center justify-center mb-1.5 sm:mb-2.5 shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4 sm:w-5 sm:h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </svg>
            </div>

            {/* Title & Description */}
            <h2 className="font-lato font-bold text-sm sm:text-base md:text-lg text-[#111827] mb-0.5 sm:mb-1">
              {assessmentData.title || "Role Play Assessment"}
            </h2>
            <p className="font-lato text-[11px] sm:text-xs text-[#667085] leading-snug">
              Click &quot;Take Assessment&quot; when you&apos;re ready to begin your role play session.
            </p>

            {/* Compact Information Card */}
            <div className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-2 sm:p-2.5 my-2 sm:my-3 text-left flex flex-col gap-1.5 sm:gap-2">
              {/* Mic & Audio note */}
              <div className="flex items-start gap-2">
                <div className="w-4 h-4 rounded-full bg-[#EFF6FF] text-[#2762EA] flex items-center justify-center shrink-0 mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-lato font-semibold text-[11px] sm:text-xs text-[#111827] leading-tight">Microphone & Audio Required</h4>
                  <p className="font-lato text-[10px] sm:text-[11px] text-[#667085] leading-tight mt-0.5">Please ensure you are in a quiet environment with a working microphone.</p>
                </div>
              </div>

              <div className="w-full h-[1px] bg-[#E5E7EB]" />

              {/* 1-Hour Evaluation Notice */}
              <div className="flex items-start gap-2">
                <div className="w-4 h-4 rounded-full bg-[#EFF6FF] text-[#2762EA] flex items-center justify-center shrink-0 mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-lato font-semibold text-[11px] sm:text-xs text-[#111827] leading-tight">Results & Evaluation Update</h4>
                  <p className="font-lato text-[10px] sm:text-[11px] text-[#667085] leading-tight mt-0.5">Once completed, your evaluation results will be processed and updated within 1 hour.</p>
                </div>
              </div>
            </div>

            {/* Action Button – opens confirmation modal */}
            <button
              onClick={() => setShowConfirmModal(true)}
              className="py-1.5 sm:py-2 px-5 sm:px-6 bg-[#2762EA] hover:bg-[#1E4FD9] text-white font-semibold rounded-lg text-xs sm:text-sm transition-all duration-150 shadow-sm flex items-center justify-center gap-1.5 shrink-0"
            >
              <span>Take Assessment</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" x2="21" y2="3" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <RolePlayConfirmModal
        isOpen={showConfirmModal}
        onClose={() => !isStarting && setShowConfirmModal(false)}
        onConfirm={handleConfirm}
        isStarting={isStarting}
      />
    </>
  );
};

const InModuleAssessment = ({ videos = [], assessmentDetails = [], passingScore }) => {
  const dispatch = useDispatch();
  const { selectedAssessmentId, currentVideoIndex } = useSelector((state) => state.video);
  const presentationId = useParams().id;
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [assessmentStartTime, setAssessmentStartTime] = useState(null);
  const [showResultModalLocal, setShowResultModalLocal] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const { capture } = usePostHog();
  const { t } = useTranslation();

  // Check if this is a final assessment (from assessment_details)
  const isFinalAssessment = assessmentDetails.some((assessment) => assessment.id === selectedAssessmentId);

  // Find metadata for the currently selected assessment (from either presentation or slide level)
  const allAssessments = [
    ...assessmentDetails,
    ...videos.flatMap((v) => v.slide_assessments || []),
  ];
  const currentAssessmentMeta = allAssessments.find((a) => a.id === selectedAssessmentId);
  const formattedType = (currentAssessmentMeta?.type || "").toUpperCase().replace(/[\s_]+/g, "");
  const isRolePlay =
    formattedType === "ROLEPLAY" ||
    currentAssessmentMeta?.assessment_type === "ROLE_PLAY";

  // Track in_progress state locally so it locks immediately upon receiving in_progress=true
  const [rolePlayInProgress, setRolePlayInProgress] = useState(
    Boolean(currentAssessmentMeta?.in_progress)
  );
  const [rolePlayInterviewLink, setRolePlayInterviewLink] = useState(null);
  const [showRolePlayModal, setShowRolePlayModal] = useState(false);
  const [isStartingRolePlay, setIsStartingRolePlay] = useState(false);

  useEffect(() => {
    if (currentAssessmentMeta?.in_progress !== undefined) {
      setRolePlayInProgress(Boolean(currentAssessmentMeta?.in_progress));
    }
  }, [currentAssessmentMeta?.in_progress]);

  useEffect(() => {
    setRolePlayInterviewLink(null);
    setShowRolePlayModal(false);
  }, [selectedAssessmentId]);

  // When user returns to this tab after doing (or abandoning) the interview,
  // invalidate the slides cache so the latest in_progress value is fetched.
  useEffect(() => {
    if (!isRolePlay) return;
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        dispatch(questionsApi.util.invalidateTags(["Question"]));
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [isRolePlay, dispatch]);

  // For Role Play assessments not started yet, do not trigger /start on mount
  const shouldSkipAutoStart = isRolePlay && !currentAssessmentMeta?.in_progress && !rolePlayInProgress;

  // Fetch assessment data
  const {
    data: assessmentData,
    isLoading,
    isError,
    refetch,
  } = useGetAssessmentQuery(selectedAssessmentId, {
    skip: !selectedAssessmentId || shouldSkipAutoStart,
    refetchOnMountOrArgChange: true,
  });

  const [triggerGetAssessment] = useLazyGetAssessmentQuery();

  const handleConfirmRolePlay = async () => {
    setIsStartingRolePlay(true);
    try {
      const res = await triggerGetAssessment(selectedAssessmentId, false).unwrap();
      setShowRolePlayModal(false);
      if (res?.interview_link) {
        setRolePlayInterviewLink(res.interview_link);
        window.open(res.interview_link, "_blank", "noopener,noreferrer");
      }
      if (res?.in_progress) {
        setRolePlayInProgress(true);
      }
      const userDetails = getUserDetailsFromToken();
      capture("assessment_start", {
        user_id: userDetails?.sub,
        assessment_id: selectedAssessmentId,
      });
      // Invalidate cache so presentation and playlist refresh their in_progress states
      dispatch(questionsApi.util.invalidateTags(["Question"]));
    } catch (err) {
      console.error("Failed to start role play assessment:", err);
      toast.error(getApiErrorMessage(err, "Failed to start assessment"));
    } finally {
      setIsStartingRolePlay(false);
    }
  };

  const [submitAssessment, { isLoading: isSubmitting }] = useSubmitAssessmentMutation();
  const [getAssessmentSummary] = questionsApi.endpoints.getAssessmentSummary.useLazyQuery();

  const submissionId = assessmentData?.submission_id || null;

  // Track assessment start when data is loaded
  useEffect(() => {
    if (assessmentData && !assessmentStartTime) {
      const startTime = new Date().toISOString();
      setAssessmentStartTime(startTime);

      const userDetails = getUserDetailsFromToken();
      capture("assessment_start", {
        user_id: userDetails?.sub,
        assessment_id: selectedAssessmentId,
      });
    }
  }, [assessmentData, assessmentStartTime, selectedAssessmentId, capture]);

  // Reset state when assessment changes
  useEffect(() => {
    if (selectedAssessmentId) {
      setCurrentQuestionIndex(0);
      setAnswers({});
      setAssessmentStartTime(null);
    }
  }, [selectedAssessmentId]);

  if (!selectedAssessmentId) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full bg-white rounded-xl flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400">
          <div className="flex flex-col justify-center items-center p-3 sm:p-4 md:p-6 min-h-full">
            <div className="w-full max-w-2xl">
              <div className="animate-pulse">
                {/* Loading header */}
                <div className="text-center mb-4">
                  <div className="h-6 bg-gray-200 rounded-lg w-2/3 mx-auto mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-32 mx-auto"></div>
                </div>

                {/* Loading question */}
                <div className="mb-4">
                  <div className="h-5 bg-gray-200 rounded-lg mb-2"></div>
                  <div className="h-5 bg-gray-200 rounded-lg w-3/4 mb-4"></div>
                </div>

                {/* Loading options */}
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="p-2 border border-gray-200 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-4 h-4 rounded-full border-2 border-gray-300 mr-3"></div>
                        <div className="h-4 bg-gray-200 rounded-lg w-full"></div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Loading buttons */}
                <div className="flex justify-between mt-8">
                  <div className="h-8 w-20 bg-gray-200 rounded-lg"></div>
                  <div className="h-8 w-20 bg-gray-200 rounded-lg"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Role Play Assessment View (handles both locked and not-started states)
  if (isRolePlay || assessmentData?.assessment_type === "ROLE_PLAY") {
    const isLocked =
      rolePlayInProgress ||
      Boolean(currentAssessmentMeta?.in_progress) ||
      Boolean(assessmentData?.in_progress);
    const activeLink = rolePlayInterviewLink || assessmentData?.interview_link;

    if (isLocked) {
      return (
        <div className="w-full h-full bg-white rounded-xl flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto flex flex-col justify-center items-center p-3 sm:p-5 md:p-6">
            <div className="w-full max-w-sm sm:max-w-md flex flex-col items-center text-center">
              {/* Clean Lock Icon Badge */}
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-[#2762EA] flex items-center justify-center mb-1.5 sm:mb-2.5 shrink-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4 sm:w-5 sm:h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>

              {/* Title & Description */}
              <h2 className="font-lato font-bold text-sm sm:text-base md:text-lg text-[#111827] mb-0.5 sm:mb-1">
                {currentAssessmentMeta?.title || assessmentData?.title || "Role Play Assessment"}
              </h2>
              <p className="font-lato text-[11px] sm:text-xs text-[#667085] leading-snug">
                Assessment In Progress
              </p>

              {/* Compact Information Card */}
              <div className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-2 sm:p-2.5 my-2 sm:my-3 text-left flex flex-col gap-1.5 sm:gap-2">
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded-full bg-[#EFF6FF] text-[#2762EA] flex items-center justify-center shrink-0 mt-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-lato font-semibold text-[11px] sm:text-xs text-[#111827] leading-tight">30-Minute Lock Period</h4>
                    <p className="font-lato text-[10px] sm:text-[11px] text-[#667085] leading-tight mt-0.5">This assessment is locked for 30 minutes while in progress.</p>
                  </div>
                </div>
              </div>

              {/* {activeLink && (
                <a
                  href={activeLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-1.5 sm:py-2 px-5 sm:px-6 bg-[#2762EA] hover:bg-[#1E4FD9] text-white font-semibold rounded-lg text-xs sm:text-sm transition-all duration-150 shadow-sm flex items-center justify-center gap-1.5 shrink-0"
                >
                  <span>Open Assessment</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" x2="21" y2="3" />
                  </svg>
                </a>
              )} */}
            </div>
          </div>
        </div>
      );
    }

    // Role Play - Not started yet
    return (
      <div className="w-full h-full bg-white rounded-xl flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto flex flex-col justify-center items-center p-3 sm:p-5 md:p-6">
          <div className="w-full max-w-sm sm:max-w-md flex flex-col items-center text-center">
            {/* Clean Icon Badge */}
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-[#2762EA] flex items-center justify-center mb-1.5 sm:mb-2.5 shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4 sm:w-5 sm:h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </svg>
            </div>

            {/* Title & Description */}
            <h2 className="font-lato font-bold text-sm sm:text-base md:text-lg text-[#111827] mb-0.5 sm:mb-1">
              {currentAssessmentMeta?.title || assessmentData?.title || "Role Play Assessment"}
            </h2>
            <p className="font-lato text-[11px] sm:text-xs text-[#667085] leading-snug">
              Click &quot;Take Assessment&quot; to begin your assessment in a new window.
            </p>

            {/* Compact Information Card */}
            <div className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-2 sm:p-2.5 my-2 sm:my-3 text-left flex flex-col gap-1.5 sm:gap-2">
              {/* Mic & Audio note */}
              <div className="flex items-start gap-2">
                <div className="w-4 h-4 rounded-full bg-[#EFF6FF] text-[#2762EA] flex items-center justify-center shrink-0 mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-lato font-semibold text-[11px] sm:text-xs text-[#111827] leading-tight">Microphone & Audio Required</h4>
                  <p className="font-lato text-[10px] sm:text-[11px] text-[#667085] leading-tight mt-0.5">Please ensure you are in a quiet environment with a working microphone.</p>
                </div>
              </div>

              <div className="w-full h-[1px] bg-[#E5E7EB]" />

              {/* Results & Evaluation Update */}
              <div className="flex items-start gap-2">
                <div className="w-4 h-4 rounded-full bg-[#EFF6FF] text-[#2762EA] flex items-center justify-center shrink-0 mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-lato font-semibold text-[11px] sm:text-xs text-[#111827] leading-tight">Results & Evaluation Update</h4>
                  <p className="font-lato text-[10px] sm:text-[11px] text-[#667085] leading-tight mt-0.5">Once completed, your evaluation results will be processed and updated within 1 hour.</p>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              type="button"
              onClick={() => setShowRolePlayModal(true)}
              className="py-1.5 sm:py-2 px-5 sm:px-6 bg-[#2762EA] hover:bg-[#1E4FD9] text-white font-semibold rounded-lg text-xs sm:text-sm transition-all duration-150 shadow-sm flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
            >
              <span>Take Assessment</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" x2="21" y2="3" />
              </svg>
            </button>
          </div>
        </div>

        {/* Confirmation Modal */}
        <RolePlayConfirmationModal
          isOpen={showRolePlayModal}
          onClose={() => setShowRolePlayModal(false)}
          onConfirm={handleConfirmRolePlay}
          isLoading={isStartingRolePlay}
        />
      </div>
    );
  }

  // Error state
  if (isError || !assessmentData) {
    return (
      <div className="w-full bg-white rounded-xl flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400">
          <div className="flex flex-col justify-center items-center p-3 sm:p-4 md:p-6 min-h-full">
            <div className="w-full max-w-2xl text-center">
              <div className="text-red-500 mb-4">
                <HiExclamationCircle className="w-12 h-12 mx-auto mb-2" />
                <p className="text-sm font-medium">{t("lectures.failedLoadAssessment")}</p>
                <p className="text-xs text-gray-600 mt-1">{t("lectures.pleaseTryAgain")}</p>
              </div>
              <button
                onClick={() => refetch()}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-hover transition-colors">
                {t("lectures.retry")}
              </button>
              <button
                onClick={() => dispatch(setSelectedAssessmentId(null))}
                className="px-4 py-2 bg-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-300 transition-colors ml-2">
                {t("lectures.close")}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = assessmentData?.questions?.[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === assessmentData?.questions?.length - 1;

  const handleAnswer = (questionId, answer) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < assessmentData?.questions?.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!submissionId) {
      toast.error(t("lectures.noSubmissionId"));
      return;
    }

    const userDetails = getUserDetailsFromToken();
    const completionTime = new Date().toISOString();

    // Calculate time taken in seconds
    const timeTaken = assessmentStartTime
      ? Math.round((new Date(completionTime) - new Date(assessmentStartTime)) / 1000)
      : 0;

    try {
      // Format answers for assessment API
      const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
        question_id: parseInt(questionId),
        answer_text: answer,
      }));

      const assessmentResponse = await submitAssessment({
        submissionId,
        answers: formattedAnswers,
      }).unwrap();

      // Track assessment submission event
      capture("assessment_submit", {
        user_id: userDetails?.sub,
        assessment_id: selectedAssessmentId,
        score: assessmentResponse.percentage,
        pass_fail: assessmentResponse.passed ? "pass" : "fail",
        time_taken: timeTaken,
      });

      // Mark assessment as completed in Redux and localStorage
      dispatch(markAssessmentCompleted(selectedAssessmentId));
      setAssessmentCompleted(presentationId, selectedAssessmentId);

      // Prepare data for result modal
      const resultData = {
        score: assessmentResponse.percentage,
        assessmentId: selectedAssessmentId,
        totalQuestions: assessmentResponse.max_score,
        correctAnswers: assessmentResponse.score,
      };

      console.log("Assessment results:", resultData);

      // Show result modal only for final assessments
      if (isFinalAssessment) {
        console.log("Showing ResultModal for final assessment:", selectedAssessmentId);

        // Fetch assessment summary for final assessments
        try {
          const summaryData = await getAssessmentSummary(presentationId).unwrap();
          // Use summary data for result modal
          const modalData = {
            score: summaryData.summary.latest_percentage,
            presentationId: presentationId,
            assessmentId: selectedAssessmentId,
            totalQuestions: summaryData.summary.total_questions,
            correctAnswers: summaryData.summary.latest_correct_questions,
          };
          setResultData(modalData);
          setShowResultModalLocal(true);
        } catch (summaryError) {
          console.log("Failed to fetch assessment summary:", summaryError);
          // Don't show result modal if summary API fails
        }
      } else {
        console.log("Skipping ResultModal for middle assessment:", selectedAssessmentId);
        dispatch(setSelectedAssessmentId(null));
        dispatch(setAutoPlayEnabled(true));
      }

      // Clear selected assessment

      // Auto-progress to next video (similar to VideoPanel logic)
      if (!isFinalAssessment && videos && videos.length > 0) {
        const nextVideoIndex = currentVideoIndex + 1;

        if (nextVideoIndex < videos.length) {
          const nextVideo = videos[nextVideoIndex];
          console.log("Assessment completed, moving to next video:", nextVideo);

          // Set start time for next video based on its duration_viewed
          let startTime = 0;
          if (nextVideo && typeof nextVideo.duration_viewed === "number") {
            startTime = nextVideo.duration_viewed;
          }
          if (
            nextVideo &&
            typeof nextVideo.duration === "number" &&
            typeof nextVideo.duration_viewed === "number" &&
            Math.abs(nextVideo.duration - nextVideo.duration_viewed) <= 1e-6
          ) {
            startTime = 0;
          }

          // Update video index and related state
          dispatch(setCurrentVideoIndex(nextVideoIndex));
          dispatch(setCurrentSlide(nextVideo?.slide));
          dispatch(setCurrentVideoTime(startTime || 0));

          // Track slide view for auto-advanced video
          if (nextVideo?.slide) {
            const userDetails = getUserDetailsFromToken();
            const currentTime = new Date().toISOString();

            capture("slide_view", {
              user_id: userDetails?.sub,
              module_id: presentationId,
              slide_id: nextVideo.slide,
              slide_title: nextVideo.title,
              timestamp: currentTime,
            });
          }

            toast.success(t("lectures.assessmentCompletedNextVideo"));
          } else {
            // If this was the last video, just show success message
            toast.success(t("lectures.assessmentSubmittedTrainingCompleted"));
          }
        } else {
          toast.success(t("lectures.assessmentSubmittedSuccessfully"));
        }
      } catch (error) {
        console.log("Assessment submission failed:", error);
        toast.error(getApiErrorMessage(error, t("lectures.failedToSubmitAssessment")));
      }
    };

  // Role Play AI Assessment View
  if (assessmentData?.assessment_type === "ROLE_PLAY" || assessmentData?.interview_link) {
    return <RolePlayAssessmentView assessmentData={assessmentData} selectedAssessmentId={selectedAssessmentId} />;
  }

  return (
    <div className="w-full h-full bg-white rounded-xl flex flex-col overflow-hidden">
      {/* Scrollable Assessment Container */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400">
        <div className="flex flex-col justify-center items-center p-3 sm:p-4 md:p-6 min-h-full">
          {/* Header */}
          <div className="w-full max-w-2xl text-center mb-4">
            <h1 className="text-base sm:text-base md:text-lg font-bold text-gray-800 mb-2">
              {assessmentData.title || t("lectures.assessment")}
            </h1>
            <p className="text-xs text-left text-gray-600">
              {t("lectures.questionCount", { current: currentQuestionIndex + 1, total: assessmentData?.questions?.length })}
            </p>
          </div>

          {/* Question Section */}
          <div className="w-full max-w-2xl flex-1 flex flex-col">
            <div className="flex-1 mb-4">
              <h2 className="text-xs sm:text-sm md:text-sm font-semibold text-gray-800 mb-3 leading-relaxed">
                {currentQuestion?.question_text}
              </h2>

              {/* Render based on question type */}
              {(() => {
                const qType = (currentQuestion?.question_type || "").toUpperCase();
                const isMultiCorrect = qType === "MULTI_CORRECT" || qType === "MULTI_SELECT" || qType === "MULTIPLE_CHOICE_MULTI";
                const isSubjective = qType === "SUBJECTIVE";
                const isOneWord = qType === "ONE_WORD" || qType === "FILL_IN_BLANK";

                if (isSubjective) {
                  return (
                    <TextArea
                      value={answers[currentQuestion.question_id] || ""}
                      onChange={(e) => handleAnswer(currentQuestion.question_id, e.target.value)}
                      placeholder={t("lectures.typeAnswerHere")}
                    />
                  );
                }

                if (isOneWord || (!currentQuestion?.options || (typeof currentQuestion.options === "object" && Object.keys(currentQuestion.options).length === 0))) {
                  return (
                    <input
                      type="text"
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-accent text-sm text-gray-800"
                      value={answers[currentQuestion.question_id] || ""}
                      onChange={(e) => handleAnswer(currentQuestion.question_id, e.target.value)}
                      placeholder={t("lectures.typeAnswerHere") || "Type your answer here..."}
                    />
                  );
                }

                let optionsObj = {};
                try {
                  optionsObj = typeof currentQuestion?.options === "string"
                    ? JSON.parse(currentQuestion.options.replace(/'/g, '"'))
                    : currentQuestion?.options || {};
                } catch {
                  optionsObj = {};
                }

                return (
                  <div className="space-y-1 sm:space-y-2">
                    {Object.entries(optionsObj).map(([option, text]) => {
                      const currentAns = answers[currentQuestion.question_id] || "";
                      let isChecked = false;
                      if (isMultiCorrect) {
                        const selectedArr = Array.isArray(currentAns) ? currentAns : (currentAns ? currentAns.split(",").map(s => s.trim()) : []);
                        isChecked = selectedArr.includes(option);
                      } else {
                        isChecked = currentAns === option;
                      }

                      const handleOptionToggle = (e) => {
                        e?.stopPropagation();
                        if (isMultiCorrect) {
                          const selectedArr = Array.isArray(currentAns) ? [...currentAns] : (currentAns ? currentAns.split(",").map(s => s.trim()) : []);
                          const newArr = selectedArr.includes(option)
                            ? selectedArr.filter((item) => item !== option)
                            : [...selectedArr, option];
                          handleAnswer(currentQuestion.question_id, newArr.join(","));
                        } else {
                          handleAnswer(currentQuestion.question_id, option);
                        }
                      };

                      return (
                        <div key={option} className="group">
                          <label
                            className={`flex items-center cursor-pointer p-1.5 sm:p-2.5 rounded-lg border transition-all duration-200 ${
                              isChecked
                                ? "border-accent bg-accent-light"
                                : "border-gray-200 hover:border-accent hover:bg-accent-light"
                            }`}>
                            <input
                              type={isMultiCorrect ? "checkbox" : "radio"}
                              name={`question-${currentQuestion.question_id}`}
                              value={option}
                              checked={isChecked}
                              onChange={handleOptionToggle}
                              className={isMultiCorrect ? "rounded w-4 h-4 text-accent focus:ring-accent !mt-0 mr-3" : "custom-radio !mt-0 mr-3"}
                            />
                            <span className="text-xs sm:text-sm md:text-sm text-gray-700 leading-relaxed flex-1">
                              {option}. {text}
                            </span>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center mt-5">
              <button
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                className={`px-[18px] py-2 rounded-lg font-semibold text-sm leading-4 text-center transition-colors duration-200 ${
                  currentQuestionIndex === 0
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-accent-light text-accent hover:bg-accent-light-hover cursor-pointer"
                }`}>
                {t("lectures.previous")}
              </button>

              {isLastQuestion ? (
                <button
                  onClick={handleSubmit}
                  disabled={!answers[currentQuestion?.question_id]?.trim() || isSubmitting}
                  className={`px-6 sm:px-8 py-1.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm transition-colors duration-200 ${
                    !answers[currentQuestion?.question_id] || isSubmitting
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-accent text-light hover:bg-accent-hover cursor-pointer"
                  }`}>
                  {isSubmitting ? t("lectures.submitting") : t("lectures.submit")}
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  disabled={!answers[currentQuestion?.question_id]?.trim()}
                  className={`px-6 sm:px-8 py-1.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm transition-colors duration-200 ${
                    !answers[currentQuestion?.question_id]
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-accent text-light hover:bg-accent-hover cursor-pointer"
                  }`}>
                  {t("lectures.next")}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Custom Scrollbar and Radio Button Styles */}
      <style jsx>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }

        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb {
          background-color: rgba(156, 163, 175, 0.5);
          border-radius: 2px;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background-color: rgba(156, 163, 175, 0.8);
        }

        /* For Firefox */
        .scrollbar-thin {
          scrollbar-width: thin;
          scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
        }

        /* Hide scrollbar completely on mobile */
        @media (max-width: 768px) {
          .scrollbar-thin::-webkit-scrollbar {
            display: none;
          }

          .scrollbar-thin {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        }

        /* Custom Radio Button Styles - Exact Figma Specifications */
        .custom-radio {
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
          width: 18px;
          height: 18px;
          min-width: 18px;
          min-height: 18px;
          border: 1.5px solid var(--color-accent);
          border-radius: 50%;
          background: var(--color-light);
          position: relative;
          cursor: pointer;
          flex: none;
          flex-shrink: 0;
          flex-grow: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .custom-radio:checked {
          border: 1.5px solid var(--color-accent);
          background: var(--color-light);
        }

        .custom-radio:checked::before {
          content: "";
          position: absolute;
          width: 10px;
          height: 10px;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: var(--color-accent);
          border-radius: 50%;
        }

        .custom-radio:focus {
          outline: none;
          box-shadow: 0 0 0 2px var(--color-accent-light-hover);
        }

        .custom-radio:hover {
          border-color: var(--color-accent);
        }

        /* Unchecked state - lighter border */
        .custom-radio:not(:checked) {
          border-color: var(--color-border-input);
        }

        .custom-radio:not(:checked):hover {
          border-color: var(--color-accent);
        }
      `}</style>

      {/* Result Modal - Only for final assessments */}
      {isFinalAssessment && showResultModalLocal && resultData && (
        <ResultModal
          isOpen={showResultModalLocal}
          onClose={() => {
            console.log("Closing ResultModal");
            setShowResultModalLocal(false);
            setResultData(null);
          }}
          score={resultData?.score}
          passingScore={passingScore}
          presentationId={resultData?.presentationId}
          assessmentId={resultData?.assessmentId}
          totalQuestions={resultData?.totalQuestions}
          correctAnswers={resultData?.correctAnswers}
          onRetry={() => {
            // Handle retry logic
            console.log("Retrying assessment");
            setShowResultModalLocal(false);
            setResultData(null);
            setCurrentQuestionIndex(0);
            setAnswers({});
            setAssessmentStartTime(null);
            toast.info(t("lectures.assessmentReset"));
          }}
          onRestartTraining={() => {
            // Handle restart training logic
            console.log("Restarting training");
            setShowResultModalLocal(false);
            setResultData(null);
            dispatch(setSelectedAssessmentId(null));
            dispatch(setCurrentVideoIndex(0));
            toast.info(t("lectures.restartingTraining"));
          }}
          onShowFeedback={() => {
            setShowResultModalLocal(false);
            setShowFeedbackModal(true);
          }}
        />
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <FeedbackModal
          isOpen={showFeedbackModal}
          onClose={() => setShowFeedbackModal(false)}
          presentationId={presentationId}
        />
      )}
    </div>
  );
};

export default InModuleAssessment;
