"use client";

import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import Modal from "@/components/common/Modal";
import { setCurrentVideoIndex } from "@/store/features/videoSlice";
import { showFeedbackModal } from "@/store/features/feedbackModalSlice";

export default function ResultModal({
  isOpen,
  onClose,
  score, // This should be the percentage from API response
  presentationId,
  totalQuestions, // This should be max_score from API
  correctAnswers, // This should be score from API
  onRetry,
  onRestartTraining,
}) {
  const router = useRouter();
  const dispatch = useDispatch();
  const passingScore = process.env.NEXT_PUBLIC_ASSESSMENT_PASSING_SCORE || 100;

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
    }
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
    // Close result modal and show feedback modal
    onClose();
    dispatch(showFeedbackModal({ presentationId }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      closeOnOverlayClick={false}
      closeOnEscape={false}
      size="md"
      className="overflow-hidden mx-4 sm:mx-0 rounded-3xl">
      <div className="p-8 bg-white text-center">
        {/* Score Circle */}
        <div className="relative w-32 h-32 mx-auto">
          {isPerfectScore ? (
            // Perfect Score - Simple Green Circle
            <div className="w-24 h-24 border-4 border-[#00A63E] rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-[#00A63E]">{Math.round(actualPercentage)}%</span>
            </div>
          ) : (
            // Partial Score - Progress Circle
            <div className="relative w-32 h-32">
              <svg className="w-full h-full" viewBox="0 0 36 36">
                {/* Background circle */}
                <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#E5E7EB" strokeWidth="2" />
                {/* Progress circle - starts from top */}
                <circle
                  cx="18"
                  cy="18"
                  r="15.9155"
                  fill="none"
                  stroke="#744FFF"
                  strokeWidth="2"
                  strokeDasharray={`${(actualPercentage / 100) * 100}, 100`}
                  strokeLinecap="round"
                  transform="rotate(-90 18 18)"
                />
              </svg>
              {/* Score text */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-[#744FFF]">{Math.round(actualPercentage)}%</span>
              </div>
            </div>
          )}
        </div>

        {/* Title */}
        <h1 className="text-xl font-bold text-[#1A1C29] mb-1">
          {isPerfectScore ? "Congratulations! 🎉" : "You're on the right track!"}
        </h1>

        {/* Subtitle */}
        <p className="text-[#555] mb-1">
          {isPerfectScore
            ? "You've mastered the training with a perfect score!"
            : `You correctly answered ${actualCorrectAnswers} out of ${actualTotalQuestions} questions`}
        </p>

        {/* Warning message for non-perfect scores */}
        {!isPerfectScore && (
          <div className="bg-yellow-50  rounded-2xl px-3 py-1 mb-2">
            <p className="text-[#B69C09] text-sm">
              Mastery is within reach. A perfect score of 100% is needed to continue.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {isPerfectScore ? (
            <button
              onClick={showFeedback}
              className="w-full bg-[#744FFF] hover:bg-[#6B46E5] text-white py-2 rounded-4xl font-semibold text-lg transition-all duration-200 shadow-lg mt-5">
              Continue
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={handleRestartTraining}
                className="w-full bg-purple-100 hover:bg-purple-200 text-[#744FFF] py-2 rounded-4xl font-semibold text-lg transition-all duration-200">
                Restart Training
              </button>
              <button
                onClick={handleRetry}
                className="w-full bg-[#744FFF] hover:bg-[#6B46E5] text-white py-2 rounded-4xl font-semibold text-lg transition-all duration-200 shadow-lg">
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
