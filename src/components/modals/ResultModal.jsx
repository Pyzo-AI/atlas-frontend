"use client";

import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import Modal from "@/components/common/Modal";
import { setCurrentVideoIndex } from "@/store/features/videoSlice";
import { showFeedbackModal } from "@/store/features/feedbackModalSlice";
import ProgressCircle from "@/components/ui/ProgressCircle";

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
}) {
  const router = useRouter();
  const dispatch = useDispatch();


  // Use the actual values from API response
  const actualTotalQuestions = totalQuestions || 0;
  const actualCorrectAnswers = correctAnswers || 0;
  const actualPercentage = score || 0;

  const isPerfectScore = actualPercentage >= passingScore;

  // Debug logging
  console.log("ResultModal received props:", {
    originalProps: { score, totalQuestions, correctAnswers },
    processedValues: {
      actualPercentage,
      actualTotalQuestions,
      actualCorrectAnswers,
      isPerfectScore,
    },
  });

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
          {isPerfectScore ? (
            // Perfect Score - Simple Green Circle
            <div className="w-20 h-20 border-4 border-[#00A63E] rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-[#00A63E]">{Math.round(actualPercentage)}%</span>
            </div>
          ) : (
            // Partial Score - Progress Circle
            <div className="relative w-20 h-20">
              <ProgressCircle score={actualPercentage} />
              {/* Score text */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-[#744FFF]">{Math.round(actualPercentage)}%</span>
              </div>
            </div>
          )}
        </div>

        {/* Title */}
        <h1 className="font-lato font-bold text-[20px] leading-[100%] tracking-[0em] text-primary-text mb-2">
          {isPerfectScore ? "Congratulations! 🎉" : "You're on the right track!"}
        </h1>

        {/* Subtitle */}
        <p className="font-lato font-medium text-[14px] leading-[100%] tracking-[0em] text-center text-primary-text-muted mb-2">
          {isPerfectScore ? (
            "You've mastered the training with a perfect score!"
          ) : (
            <>
              You correctly answered{" "}
              <span className="font-lato font-bold text-[14px] leading-[100%] tracking-[0em] text-center text-[#744FFF]">
                {actualCorrectAnswers}
              </span>{" "}
              out of{" "}
              <span className="font-lato font-bold text-[14px] leading-[100%] tracking-[0em] text-center text-[#744FFF]">
                {actualTotalQuestions}
              </span>{" "}
              questions across all assessments.
            </>
          )}
        </p>

        {/* Warning message for non-perfect scores */}
        {!isPerfectScore && (
          <div className="bg-[#FFFBEA]  rounded-2xl px-1.5 py-2 mb-6">
            <p className="font-lato font-normal text-[14px] leading-[16px] tracking-[0em] text-center text-[#B69C09]">
             Mastery is within reach. A perfect score of {passingScore}% is needed to complete the module.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {isPerfectScore ? (
            <button
              onClick={showFeedback}
              className="cursor-pointer w-full bg-[#744FFF] hover:bg-[#6B46E5] text-white py-2 rounded-4xl font-semibold text-lg transition-all duration-200 shadow-lg mt-5">
              Continue
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={showFeedback}
                className="cursor-pointer flex justify-center items-center gap-1 px-4 py-1.5 h-10 bg-[rgba(116,79,255,0.12)] hover:bg-[rgba(116,79,255,0.2)] text-[#744FFF] font-semibold text-base rounded-[73.75px] transition-all duration-200 flex-1">
                Give Feedback
              </button>
              <button
                onClick={handleRestartTraining}
                className="cursor-pointer flex justify-center items-center gap-1 px-4 py-1.5 h-10 bg-[#744FFF] hover:bg-[#6B46E5] text-white font-semibold text-base rounded-[73.75px] transition-all duration-200 flex-1">
                Restart Training
              </button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
