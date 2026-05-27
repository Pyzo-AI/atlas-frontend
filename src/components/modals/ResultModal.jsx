"use client";

import { useLocalizedRouter } from "@/hooks/useLocalizedRouter";
import { useDispatch } from "react-redux";
import Modal from "@/components/common/Modal";
import { setCurrentVideoIndex } from "@/store/features/videoSlice";
import { showFeedbackModal } from "@/store/features/feedbackModalSlice";
import ProgressCircle from "@/components/ui/ProgressCircle";
import { useGenerateCertificateMutation } from "@/store/api/certificatesApi";
import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

export default function ResultModal({
  isOpen,
  onClose,
  score, // This should be the percentage from API response
  presentationId,
  totalQuestions, // This should be max_score from API
  correctAnswers, // This should be score from API
  onRetry,
  onRestartTraining,
  onShowFeedback,
  passingScore,
  isNoAssessmentModule = false,
}) {
  const router = useLocalizedRouter();
  const dispatch = useDispatch();
  const { t } = useTranslation();

  // Use the actual values from API response
  const actualTotalQuestions = totalQuestions || 0;
  const actualCorrectAnswers = correctAnswers || 0;
  const actualPercentage = score || 0;
  const isPerfectScore = isNoAssessmentModule || actualPercentage >= passingScore;
  const [generateCertificate, { isLoading: isGeneratingCertificate }] = useGenerateCertificateMutation();
  const [certificatePdfUrl, setCertificatePdfUrl] = useState(null);
  const generatingRef = React.useRef(false);

  useEffect(() => {
    if (!isOpen) {
      generatingRef.current = false;
      setCertificatePdfUrl(null);
      return;
    }

    const handleGenerateCertificate = async () => {
      if (isPerfectScore && presentationId && !certificatePdfUrl && !generatingRef.current) {
        generatingRef.current = true;
        try {
          const response = await generateCertificate(presentationId).unwrap();
          setCertificatePdfUrl(response.certificate_pdf_url);
        } catch (error) {
          console.log("Failed to generate certificate:", error);
          const errorMessage =
            error?.data?.details || error?.data?.error || "Unable to generate certificate. Try again.";
          // toast.error(errorMessage);
          generatingRef.current = false;
        }
      }
    };
    handleGenerateCertificate();
  }, [isOpen, presentationId, isPerfectScore, certificatePdfUrl]);

  // Debug logging
  console.log("ResultModal received props:", {
    originalProps: { score, totalQuestions, correctAnswers },
    processedValues: {
      actualPercentage,
      actualTotalQuestions,
      actualCorrectAnswers,
      isPerfectScore,
      isGeneratingCertificate,
      certificatePdfUrl,
    },
  });

  const handleDownloadCertificate = () => {
    if (certificatePdfUrl) {
      window.open(certificatePdfUrl, "_blank");
    }
  };

  const handleRetry = () => {
    onRetry?.();
  };

  const handleRestartTraining = () => {
    if (!presentationId) return;
    router.push(`/lectures/${presentationId}`);
    dispatch(setCurrentVideoIndex(0));
    onRestartTraining?.();
    onClose();
  };

  const showFeedback = () => {
    // Use local callback instead of Redux
    onShowFeedback?.();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      closeOnOverlayClick={false}
      closeOnEscape={false}
      size="custom"
      className="overflow-hidden mx-4 sm:mx-0 rounded-3xl w-[398px] bg-white">
      <div className="p-6 bg-white text-center">
        {/* Score Circle */}
        <div className="relative flex justify-center mx-auto mb-5">
          {isNoAssessmentModule ? (
            // No Assessment Module - Party Popper Icon
            <div className="w-20 h-20 bg-[#FFF9E5] rounded-full flex items-center justify-center text-4xl">
              🎉
            </div>
          ) : isPerfectScore ? (
            // Perfect Score - Simple Green Circle
            <div className="w-20 h-20 border-4 border-success rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-success">{Math.round(actualPercentage)}%</span>
            </div>
          ) : (
            // Partial Score - Progress Circle
            <div className="relative w-20 h-20">
              <ProgressCircle score={actualPercentage} />
              {/* Score text */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-accent">{Math.round(actualPercentage)}%</span>
              </div>
            </div>
          )}
        </div>

        {/* Title */}
        <h1 className="font-lato font-bold text-[20px] leading-[100%] tracking-[0em] text-primary-text mb-2">
          {isPerfectScore ? (isNoAssessmentModule ? t("resultModal.congratulations") : t("resultModal.congratulationsParty")) : t("resultModal.onRightTrack")}
        </h1>

        {/* Subtitle */}
        <p className="font-lato font-normal text-[14px] leading-[20px] tracking-[0em] text-center text-primary-text-muted mb-2">
          {isPerfectScore ? (
            isNoAssessmentModule ? (
              t("resultModal.completedTrainingNoAssessment")
            ) : (
              t("resultModal.completedTrainingWithAssessment")
            )
          ) : (
            <>
              {t("resultModal.scoreBreakdown_0")}
              <span className="font-lato font-bold text-[14px] leading-[20px] tracking-[0em] text-center text-accent">
                {actualCorrectAnswers}
              </span>
              {t("resultModal.scoreBreakdown_1")}
              <span className="font-lato font-bold text-[14px] leading-[20px] tracking-[0em] text-center text-accent">
                {actualTotalQuestions}
              </span>
              {t("resultModal.scoreBreakdown_2")}
            </>
          )}
        </p>

        {/* Warning message for non-perfect scores */}
        {!isPerfectScore && (
          <div className="bg-warning-bg  rounded-2xl px-1.5 py-2 mb-6">
            <p className="font-lato font-normal text-[14px] leading-[16px] tracking-[0em] text-center text-warning-text">
              {t("resultModal.masteryWithinReach", { passingScore })}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 px-4">
          {isPerfectScore ? (
            <div className="flex gap-[12px] w-full max-w-[326px] mx-auto h-[32px]">
              <button
                onClick={showFeedback}
                className="cursor-pointer flex justify-center items-center gap-[10px] px-[12px] py-[6px] h-full bg-accent-light text-accent font-lato font-semibold text-[14px] leading-[16px] rounded-[8px] transition-all duration-200 flex-1 whitespace-nowrap">
                {t("resultModal.shareFeedback")}
              </button>
              <button
                onClick={handleDownloadCertificate}
                disabled={isGeneratingCertificate || !certificatePdfUrl}
                className={`flex justify-center items-center gap-[10px] px-[12px] py-[6px] h-full bg-accent text-white font-lato font-semibold text-[14px] leading-[16px] rounded-[8px] transition-all duration-200 flex-1 whitespace-nowrap ${
                  isGeneratingCertificate || !certificatePdfUrl
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer hover:opacity-90"
                }`}>
                {isGeneratingCertificate ? t("resultModal.generating") : t("resultModal.downloadCertificate")}
              </button>
            </div>
          ) : (
            <div className="flex gap-[12px] w-full max-w-[326px] mx-auto h-[32px]">
              <button
                onClick={showFeedback}
                className="cursor-pointer flex justify-center items-center gap-[10px] px-[12px] py-[6px] h-full bg-accent-light text-accent font-lato font-semibold text-[14px] leading-[16px] rounded-[8px] transition-all duration-200 flex-1 whitespace-nowrap">
                {t("resultModal.giveFeedback")}
              </button>
              <button
                onClick={handleRestartTraining}
                className="cursor-pointer flex justify-center items-center gap-[10px] px-[12px] py-[6px] h-full bg-accent text-white font-lato font-semibold text-[14px] leading-[16px] rounded-[8px] transition-all duration-200 flex-1 whitespace-nowrap">
                {t("resultModal.restartTraining")}
              </button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
