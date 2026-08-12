import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useGetAssessmentQuery, useSubmitAssessmentMutation, questionsApi } from "@/store/api/questionsApi";
import {
  setSelectedAssessmentId,
  setCurrentVideoIndex,
  setCurrentSlide,
  setCurrentVideoTime,
  setAutoPlayEnabled,
} from "@/store/features/videoSlice";
import { usePostHog } from "@/hooks/usePostHog";
import { getUserDetailsFromToken } from "@/store/utils/token";
import { toast } from "react-toastify";
import { useParams } from "next/navigation";
import ResultModal from "@/components/modals/ResultModal";
import FeedbackModal from "@/components/modals/FeedbackModal";
import { setAssessmentCompleted } from "@/utils/assessmentProgress";
import RadioButton from "@/components/ui/RadioButton";
import TextArea from "@/components/ui/TextArea";
import { HiExclamationCircle } from "react-icons/hi2";
import { useTranslation } from "react-i18next";

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

  // Debug logging to verify detection
  console.log("Assessment Detection Debug:", {
    selectedAssessmentId,
    assessmentDetails,
    isFinalAssessment,
    assessmentDetailsIds: assessmentDetails.map((a) => a.id),
  });

  // Fetch assessment data
  const {
    data: assessmentData,
    isLoading,
    isError,
    refetch,
  } = useGetAssessmentQuery(selectedAssessmentId, {
    skip: !selectedAssessmentId,
    refetchOnMountOrArgChange: true,
  });

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

      // Mark assessment as completed in localStorage
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
        toast.error(t("lectures.failedToSubmitAssessment"));
      }
    };

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
                            }`}
                            onClick={handleOptionToggle}>
                            <input
                              type={isMultiCorrect ? "checkbox" : "radio"}
                              name={`question-${currentQuestion.question_id}`}
                              value={option}
                              checked={isChecked}
                              onChange={handleOptionToggle}
                              className={`!mt-0 mr-3 text-accent focus:ring-accent ${isMultiCorrect ? "rounded w-4 h-4" : "rounded-full w-4 h-4"}`}
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
          border: 1.28571px solid var(--color-accent);
          border-radius: 18px;
          background: var(--color-light);
          position: relative;
          cursor: pointer;
          flex: none;
          flex-grow: 0;
        }

        .custom-radio:checked {
          border: 1.28571px solid var(--color-accent);
          background: var(--color-light);
        }

        .custom-radio:checked::before {
          content: "";
          position: absolute;
          width: 12px;
          height: 12px;
          left: 2.5px;
          top: 2.5px;
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
