"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useGetQuizQuery, useSubmitCompletionStatusMutation, useGetAssessmentQuery, useSubmitAssessmentMutation } from "@/store/api/questionsApi";
import { showResultModal } from "@/store/features/resultModalSlice";
import Button from "@/components/common/Button";
import BreadCrumb from "@/components/common/BreadCrumb";
import { usePostHog } from "@/hooks/usePostHog";
import { getUserDetailsFromToken } from "@/store/utils/token";
import { toast } from "react-toastify";

export default function AssessmentPage() {
  const dispatch = useDispatch();
  const params = useParams();
  const presentationId = params.id;
  const searchParams = useSearchParams();
  const assessmentId = searchParams.get('assessment-id');
  const retryParam = searchParams.get('retry');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [assessmentStartTime, setAssessmentStartTime] = useState(null);
  const { capture } = usePostHog();

  // Reset state when retry parameter changes (fresh assessment)
  useEffect(() => {
    if (retryParam) {
      setCurrentQuestionIndex(0);
      setAnswers({});
      setAssessmentStartTime(null);
    }
  }, [retryParam]);
  const [submitCompletionStatus, { isLoading: isSubmitting }] = useSubmitCompletionStatusMutation();
  const [submitAssessment, { isLoading: isAssessmentSubmitting }] = useSubmitAssessmentMutation();



  // Fetch quiz data conditionally based on assessment-id parameter
  const {
    data: quizData,
    isLoading,
    isError,
    refetch: refetchQuiz
  } = useGetQuizQuery(presentationId, {
    skip: !!assessmentId
  });

  const {
    data: assessmentData,
    isLoading: isAssessmentLoading,
    isError: isAssessmentError,
    refetch: refetchAssessment
  } = useGetAssessmentQuery(assessmentId, {
    skip: !assessmentId,
    refetchOnMountOrArgChange: true
  });

  // Refetch data when retry parameter changes
  useEffect(() => {
    if (retryParam) {
      if (assessmentId) {
        refetchAssessment();
      } else {
        refetchQuiz();
      }
    }
  }, [retryParam, assessmentId, refetchAssessment, refetchQuiz]);

  const submissionId = assessmentData?.submission_id || null;

  // Use assessment data when available, otherwise use quiz data
  const currentData = assessmentData || quizData;
  const currentLoading = assessmentId ? isAssessmentLoading : isLoading;
  const currentError = assessmentId ? isAssessmentError : isError;

  // Track assessment start when data is loaded
  useEffect(() => {
    if (currentData && !assessmentStartTime) {
      const startTime = new Date().toISOString();
      setAssessmentStartTime(startTime);

      const userDetails = getUserDetailsFromToken();
      capture("assessment_start", {
        user_id: userDetails?.sub,
        module_id: presentationId,
        assessment_id: currentData.quiz_id || assessmentId || presentationId,
      });
    }
  }, [currentData, assessmentStartTime, presentationId, assessmentId, capture]);

  // Show loading state while fetching data
  if (currentLoading) {
    return (
      <div className="min-h-screen bg-[#F9F9F9] pt-3 sm:pt-5 pb-4 sm:pb-8 px-4 sm:px-10">
        <BreadCrumb title="Assessment" />
        <div className="max-w-4xl mx-auto bg-white rounded-lg sm:rounded-xl border border-[#E5E7EB] overflow-hidden">
          <div className="p-4 sm:p-8">
            <div className="animate-pulse">
              {/* Loading header */}
              <div className="mb-6 sm:mb-8">
                <div className="h-6 sm:h-8 bg-gray-200 rounded-lg w-2/3 mx-auto"></div>
              </div>

              <div className="mb-4 sm:mb-6">
                {/* Loading question count */}
                <div className="flex justify-between items-center mb-4">
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                </div>

                {/* Loading question text */}
                <div className="mb-4">
                  <div className="h-5 sm:h-[22px] bg-gray-200 rounded-lg mb-2"></div>
                  <div className="h-5 sm:h-[22px] bg-gray-200 rounded-lg w-3/4"></div>
                </div>

                {/* Loading options */}
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="p-3 sm:p-4 border border-[#E5E7EB] rounded-[8px]"
                    >
                      <div className="flex items-center">
                        <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-gray-300 mr-2 sm:mr-3 flex-shrink-0"></div>
                        <div className="h-4 sm:h-5 bg-gray-200 rounded-lg w-full"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Loading navigation buttons */}
              <div className="flex justify-between pt-3 sm:pt-4 border-t border-[#E5E7EB] gap-3">
                <div className="h-9 sm:h-10 w-20 sm:w-[100px] bg-gray-200 rounded-[8px]"></div>
                <div className="h-9 sm:h-10 w-20 sm:w-[100px] bg-gray-200 rounded-[8px]"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if fetch fails
  if (currentError || !currentData) {
    return (
      <div className="min-h-screen bg-[#F9F9F9] flex items-center justify-center px-4">
        <div className="text-base sm:text-[18px] font-lato font-semibold text-red-500 text-center">
          Failed to load assessment. Please try again later.
        </div>
      </div>
    );
  }

  const currentQuestion = currentData?.questions?.[currentQuestionIndex];
  const isLastQuestion =
    currentQuestionIndex === currentData?.questions?.length - 1;

  const handleAnswer = (questionId, answer) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < currentData?.questions?.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const calculateScore = () => {
    let correct = 0;
    currentData?.questions?.forEach((question) => {
      if (answers[question.question_id] === question.correct_answer) {
        correct++;
      }
    });
    return Math.round((correct / currentData?.questions?.length) * 100);
  };

  const handleSubmit = async () => {
    const finalScore = calculateScore();
    const userDetails = getUserDetailsFromToken();
    const completionTime = new Date().toISOString();

    // Calculate time taken in seconds
    const timeTaken = assessmentStartTime
      ? Math.round(
        (new Date(completionTime) - new Date(assessmentStartTime)) / 1000
      )
      : 0;

    // Determine pass/fail (assuming 60% is passing)
    const passingScore = process.env.NEXT_PUBLIC_ASSESSMENT_PASSING_SCORE || 60;
    const passFail = finalScore >= passingScore ? "pass" : "fail";

    try {
      let responseScore = finalScore;
      let assessmentResponse = null;
      let calculatedCorrectAnswers = 0;
      let totalQuestionsCount = 0;

      if (assessmentId && submissionId) {
        // Format answers for new assessment API
        const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
          question_id: parseInt(questionId),
          answer_text: answer
        }));

        try {
          assessmentResponse = await submitAssessment({
            submissionId,
            answers: formattedAnswers
          }).unwrap();

          responseScore = assessmentResponse.percentage;
          console.log('Assessment submitted successfully:', assessmentResponse);

          // Try to call completion status API, but don't fail if it errors
          try {
            await submitCompletionStatus({
              presentationId,
              isPresentationCompleted: assessmentResponse.passed,
              user_id: userDetails?.sub,
            }).unwrap();
          } catch (completionError) {
            console.warn('Completion status API failed, but assessment was successful:', completionError);
          }

        } catch (assessmentError) {
          console.error('Assessment submission failed:', assessmentError);
          toast.error("Failed to submit assessment. Please try again.");
          return;
        }

      } else {
        // Original completion status API
        try {
          await submitCompletionStatus({
            presentationId,
            isPresentationCompleted: passFail === "pass",
            user_id: userDetails?.sub,
          }).unwrap();
        } catch (completionError) {
          console.error('Completion status submission failed:', completionError);
          toast.error("Failed to submit assessment. Please try again.");
          return;
        }

        // Calculate correct answers for display (fallback for old API)
        const questions = currentData?.questions || [];
        questions.forEach((question) => {
          if (answers[question.question_id] === question.correct_answer) {
            calculatedCorrectAnswers++;
          }
        });
        totalQuestionsCount = questions.length;
      }

      // Track assessment submission event
      capture("assessment_submit", {
        user_id: userDetails?.sub,
        assessment_id: currentData?.quiz_id || assessmentId || presentationId,
        score: responseScore,
        pass_fail: passFail,
        time_taken: timeTaken,
      });

      // Track module completion event
      capture("module_complete", {
        user_id: userDetails?.sub,
        module_id: presentationId,
        completion_time: completionTime,
        score: responseScore,
      });

      // Prepare data for result modal
      const resultData = {
        score: responseScore,
        presentationId,
        assessmentId,
        totalQuestions: assessmentResponse ? assessmentResponse.max_score : totalQuestionsCount,
        correctAnswers: assessmentResponse ? assessmentResponse.score : calculatedCorrectAnswers
      };

      console.log('Assessment results:', {
        totalQuestions: resultData.totalQuestions,
        correctAnswers: resultData.correctAnswers,
        score: resultData.score,
        apiResponse: assessmentResponse
      });

      // Show result modal with correct data
      console.log('Dispatching showResultModal with data:', resultData);
      dispatch(showResultModal(resultData));

    } catch (error) {
      console.error('Unexpected error in assessment submission:', error);
      toast.error("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9F9] pt-3 sm:pt-5 pb-4 sm:pb-8 px-4 sm:px-10">
      <BreadCrumb
        paths={[
          { path: "/", label: "All Courses" },
          {
            path: `/lectures/${presentationId}`,
            label: "Lectures",
          },
          { path: "", label: "Assessment" },
        ]}
      />
      <div className="max-w-4xl mx-auto bg-white rounded-lg sm:rounded-xl border border-[#E5E7EB] overflow-hidden">
        <div className="p-4 sm:p-8">
          <h1 className="text-xl sm:text-[24px] font-lato font-bold mb-6 sm:mb-8 text-center text-[#1A1C29]">
            {currentData.title}
          </h1>

          <div className="mb-4 sm:mb-6">
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <span className="text-sm sm:text-[14px] font-lato font-medium text-[#667085]">
                Question {currentQuestionIndex + 1} of{" "}
                {currentData?.questions?.length}
              </span>
            </div>

            <h2 className="text-base sm:text-[18px] font-lato font-semibold mb-3 sm:mb-4 text-[#1A1C29] leading-relaxed">
              {currentQuestion?.question_text}
            </h2>

            <div className="space-y-2 sm:space-y-3">
              {Object.entries(
                typeof currentQuestion?.options === 'string'
                  ? JSON.parse(currentQuestion.options.replace(/'/g, '"'))
                  : currentQuestion?.options || {}
              ).map(
                ([option, text]) => (
                  <div
                    key={option}
                    onClick={() =>
                      handleAnswer(currentQuestion.question_id, option)
                    }
                    className={`p-3 sm:p-4 border rounded-[8px] cursor-pointer transition-colors ${answers[currentQuestion.question_id] === option
                      ? "border-[#744FFF] bg-[#F3EDFF]"
                      : "border-[#E5E7EB] hover:border-[#744FFF]"
                      }`}
                  >
                    <div className="flex items-start sm:items-center">
                      <div
                        className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center mr-2 sm:mr-3 mt-0.5 sm:mt-0 flex-shrink-0 ${answers[currentQuestion.question_id] === option
                          ? "border-[#744FFF] bg-[#744FFF]"
                          : "border-[#667085]"
                          }`}
                      >
                        {answers[currentQuestion.question_id] === option && (
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white"></div>
                        )}
                      </div>
                      <span className="font-lato font-medium text-[#1A1C29] text-sm sm:text-base leading-relaxed">
                        {option}. {text}
                      </span>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          <div className="flex justify-between pt-3 sm:pt-4 border-t border-[#E5E7EB] gap-3">
            <Button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              variant="secondary"
              className={`px-4 sm:px-6 py-2 sm:py-3 rounded-[8px] font-lato font-medium text-sm sm:text-[14px] flex-1 sm:flex-none ${currentQuestionIndex === 0
                ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                : "bg-white text-[#667085] hover:bg-gray-50 cursor-pointer border border-[#E5E7EB]"
                }`}
            >
              Previous
            </Button>

            {isLastQuestion ? (
              <Button
                onClick={handleSubmit}
                disabled={!answers[currentQuestion.question_id] || isSubmitting || isAssessmentSubmitting}
                variant="primary"
                className={`px-4 sm:px-6 py-2 sm:py-3 rounded-[8px] font-lato font-medium text-sm sm:text-[14px] flex-1 sm:flex-none ${!answers[currentQuestion.question_id] || isSubmitting || isAssessmentSubmitting
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-[#744FFF] text-white hover:bg-[#6B46E5] cursor-pointer"
                  }`}
              >
                <span className="hidden sm:inline">{(isSubmitting || isAssessmentSubmitting) ? "Submitting..." : "Submit Assessment"}</span>
                <span className="sm:hidden">{(isSubmitting || isAssessmentSubmitting) ? "Submitting..." : "Submit"}</span>
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!answers[currentQuestion.question_id]}
                variant="primary"
                className={`px-4 sm:px-6 py-2 sm:py-3 rounded-[8px] font-lato font-medium text-sm sm:text-[14px] flex-1 sm:flex-none ${!answers[currentQuestion.question_id]
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-[#744FFF] text-white hover:bg-[#6B46E5] cursor-pointer"
                  }`}
              >
                Next
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
