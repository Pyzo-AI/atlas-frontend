"use client";

import Button from "@/components/common/Button";
import { setCurrentVideoIndex } from "@/store/features/videoSlice";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { useDispatch } from "react-redux";

// Separate component for the result content
function ResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [score, setScore] = useState(null);
  const dispatch = useDispatch();

  useEffect(() => {
    const scoreParam = searchParams.get("score");
    if (scoreParam) {
      setScore(Math.round(Number(scoreParam)));
    }
  }, [searchParams]);

  const isPerfectScore = score === 100;

  const handleRetry = () => {
    const presentationId = searchParams.get("id") || process.env.NEXT_PUBLIC_PRESENTATION_ID || '1';
    router.push(`/assessment/${presentationId}`);
  };

  const handleRestartTraining = () => {
    router.push(`/`);
    dispatch(setCurrentVideoIndex(0));
  }

  if (score === null) return null;

  return (
    <div className="min-h-[calc(100vh-70px)] flex items-center justify-center bg-[#F9F9F9] p-4">
      <div className="max-w-xl w-full bg-white rounded-xl border border-[#E5E7EB] overflow-hidden mt-[-120px]">
        <div className="p-8">
          {/* Score Circle */}
          <div className="relative w-32 h-32 mx-auto mb-8">
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
                style={{ fontSize: "8px", fontWeight: "bold", fontFamily: "Lato" }}
              >
                {score}%
              </text>
            </svg>

            {/* Status Icon */}
            <div
              className={`absolute bottom-0 right-0 p-2 rounded-full ${
                isPerfectScore ? "bg-green-100" : "bg-[#F3EDFF]"
              }`}
            >
              {isPerfectScore ? (
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6 text-[#744FFF]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              )}
            </div>
          </div>

          {/* Result Content */}
          <div className="text-center space-y-6">
            <h1
              className={`text-[24px] font-lato font-bold ${
                isPerfectScore ? "text-green-600" : "text-[#744FFF]"
              }`}
            >
              {isPerfectScore ? "Congratulations! 🎉" : "Almost There!"}
            </h1>

            <div className="space-y-2">
              <p className="text-[16px] font-lato font-medium text-[#667085]">
                {isPerfectScore
                  ? "You've mastered the training with a perfect score! Your certificate awaits."
                  : "Keep going! Review and try again to achieve mastery."}
              </p>

              {!isPerfectScore && (
                <div className="inline-block bg-amber-50 border border-amber-200 rounded-[8px] px-4 py-2">
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-amber-500"
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
                    <p className="text-[14px] font-lato font-semibold text-amber-800">
                      You need 100% to pass this assessment
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4">
              <Button
                onClick={handleRestartTraining}
                variant={"primary"}
                className={`px-6 py-3 rounded-[8px] font-lato font-medium text-[14px] ${
                  isPerfectScore
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-[#744FFF] hover:bg-[#6B46E5] text-white"
                }`}
              >
                {isPerfectScore ? "Ok" : "Restart Training"}
              </Button>

              {!isPerfectScore && (
                <Button
                  onClick={handleRetry}
                  variant="secondary"
                  className="px-6 py-3 rounded-[8px] font-lato font-medium text-[14px] bg-white text-[#667085] hover:bg-gray-50 border border-[#E5E7EB]"
                >
                  Try Again
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Loading component
function ResultLoading() {
  return (
    <div className="min-h-[calc(100vh-70px)] flex items-center justify-center bg-[#F9F9F9] p-4">
      <div className="max-w-xl w-full bg-white rounded-xl border border-[#E5E7EB] overflow-hidden mt-[-120px]">
        <div className="p-8">
          {/* Score Circle Skeleton */}
          <div className="relative w-32 h-32 mx-auto mb-8">
            <div className="absolute inset-0 rounded-full bg-gray-200 animate-pulse"></div>
            <div className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
          </div>

          {/* Result Content Skeleton */}
          <div className="text-center space-y-6">
            {/* Title Skeleton */}
            <div className="h-8 w-48 bg-gray-200 rounded-lg mx-auto animate-pulse"></div>

            {/* Description Skeleton */}
            <div className="space-y-2">
              <div className="h-4 w-3/4 bg-gray-200 rounded mx-auto animate-pulse"></div>
              <div className="h-4 w-2/3 bg-gray-200 rounded mx-auto animate-pulse"></div>
            </div>

            {/* Info Box Skeleton */}
            <div className="inline-block bg-gray-100 rounded-[8px] px-4 py-2">
              <div className="h-5 w-48 bg-gray-200 rounded animate-pulse"></div>
            </div>

            {/* Button Skeleton */}
            <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4">
              <div className="h-10 w-32 bg-gray-200 rounded-[8px] animate-pulse"></div>
              <div className="h-10 w-32 bg-gray-200 rounded-[8px] animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Result page component
export default function Result() {
  return (
    <Suspense fallback={<ResultLoading />}>
      <ResultContent />
    </Suspense>
  );
}
