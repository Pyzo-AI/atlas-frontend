"use client";

import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import Button from "@/components/common/Button";
import Modal from "@/components/common/Modal";
import { setCurrentVideoIndex } from "@/store/features/videoSlice";
import { showFeedbackModal } from "@/store/features/feedbackModalSlice";

export default function ResultModal({
  isOpen,
  onClose,
  score,
  presentationId,
  assessmentId,
  onRetry,
  onRestartTraining
}) {
  const router = useRouter();
  const dispatch = useDispatch();
  const passingScore = process.env.NEXT_PUBLIC_ASSESSMENT_PASSING_SCORE || 100;

  const isPerfectScore = score == passingScore;

  const handleRetry = () => {
    onRetry?.();
    onClose();
  };

  const handleRestartTraining = () => {
    if (!presentationId) return;
    router.push(`/lectures/${presentationId}`);
    dispatch(setCurrentVideoIndex(0));
    onRestartTraining?.();
    onClose();
  };

  const navigateToReview = () => {
    onClose();
    router.push(`/review/${presentationId}?showDisclaimer=true`);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      closeOnOverlayClick={false}
      closeOnEscape={false}
      size="xl"
      className="border border-[#E5E7EB] overflow-hidden mx-4 sm:mx-0"
    >
      <div className="p-4 sm:p-8">
        {/* Score Circle */}
        <div className="relative w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-6 sm:mb-8">
          <svg className="w-full h-full" viewBox="0 0 36 36">
            <path
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#E5E7EB"
              strokeWidth="3"
            />
            <path
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke={isPerfectScore ? "#059669" : "#744FFF"}
              strokeWidth="3"
              strokeDasharray={`${score}, 100`}
              strokeLinecap="round"
            />
            <text
              x="18"
              y="20.35"
              className="score-text"
              textAnchor="middle"
              fill={isPerfectScore ? "#059669" : "#744FFF"}
              style={{
                fontSize: "8px",
                fontWeight: "bold",
                fontFamily: "Lato",
              }}
            >
              {score}%
            </text>
          </svg>
        </div>

        {/* Result Content */}
        <div className="text-center space-y-4 sm:space-y-6">
          <h1
            className={`text-xl sm:text-[24px] font-lato font-bold ${isPerfectScore ? "text-green-600" : "text-[#744FFF]"
              }`}
          >
            {isPerfectScore ? "Congratulations! 🎉" : "Almost There!"}
          </h1>

          <div className="space-y-3 sm:space-y-2">
            <p className="text-sm sm:text-[16px] font-lato font-medium text-[#667085] leading-relaxed px-2 sm:px-0">
              {isPerfectScore
                ? "You've mastered the training with a perfect score! Your certificate awaits."
                : "Keep going! Review and try again to achieve mastery."}
            </p>

            {!isPerfectScore && (
              <div className="inline-block bg-amber-50 border border-amber-200 rounded-[8px] px-3 sm:px-4 py-2 mx-2 sm:mx-0">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-xs sm:text-[14px] font-lato font-semibold text-amber-800">
                    You need 100% to pass this assessment
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-3 sm:pt-4 px-2 sm:px-0">
            <Button
              onClick={
                isPerfectScore ? navigateToReview : handleRestartTraining
              }
              variant={"primary"}
              className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-[8px] font-lato font-medium text-sm sm:text-[14px] w-full sm:w-auto ${isPerfectScore
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-[#744FFF] hover:bg-[#6B46E5] text-white"
                }`}
            >
              {isPerfectScore ? "Continue to Review" : "Restart Training"}
            </Button>

            {!isPerfectScore && (
              <Button
                onClick={handleRetry}
                variant="secondary"
                className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-[8px] font-lato font-medium text-sm sm:text-[14px] bg-white text-[#667085] hover:bg-gray-50 border border-[#E5E7EB] w-full sm:w-auto"
              >
                Try Again
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}