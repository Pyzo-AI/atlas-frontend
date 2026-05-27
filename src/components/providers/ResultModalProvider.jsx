"use client";

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { restoreResultModal, hideResultModal } from '@/store/features/resultModalSlice';
import ResultModal from '@/components/modals/ResultModal';
import { usePathname } from 'next/navigation';
import { useLocalizedRouter } from "@/hooks/useLocalizedRouter";

export default function ResultModalProvider({ children }) {
  const dispatch = useDispatch();
  const router = useLocalizedRouter();
  const pathname = usePathname();
  const { isOpen, score, presentationId, assessmentId, totalQuestions, correctAnswers } = useSelector(
    (state) => state.resultModal
  );

  // Only show modal on assessment pages
  const isAssessmentPage = pathname?.includes('/assessment/');
  const shouldShowModal = isOpen && isAssessmentPage;

  // Restore modal state on component mount
  useEffect(() => {
    dispatch(restoreResultModal());
  }, [dispatch]);

  // Clear modal state when leaving assessment pages
  useEffect(() => {
    if (!isAssessmentPage && isOpen) {
      dispatch(hideResultModal());
    }
  }, [isAssessmentPage, isOpen, dispatch]);

  const handleRetry = () => {
    // Close the modal first
    dispatch(hideResultModal());

    // Navigate to assessment with fresh parameter to trigger new API call
    if (assessmentId) {
      // For new assessment API, add timestamp to force fresh call
      const timestamp = Date.now();
      router.push(`/assessment/${presentationId}?assessment-id=${assessmentId}&retry=${timestamp}`);
    } else {
      // For legacy quiz, add timestamp to force fresh call
      const timestamp = Date.now();
      router.push(`/assessment/${presentationId}?retry=${timestamp}`);
    }
  };

  const handleRestartTraining = () => {
    // This will be handled in the modal component
  };

  const handleCloseModal = () => {
    dispatch(hideResultModal());
  };

  return (
    <>
      {children}
      <ResultModal
        isOpen={shouldShowModal}
        onClose={handleCloseModal}
        score={score}
        presentationId={presentationId}
        assessmentId={assessmentId}
        totalQuestions={totalQuestions}
        correctAnswers={correctAnswers}
        onRetry={handleRetry}
        onRestartTraining={handleRestartTraining}
      />
    </>
  );
}