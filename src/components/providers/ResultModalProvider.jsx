"use client";

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { restoreResultModal, hideResultModal } from '@/store/features/resultModalSlice';
import ResultModal from '@/components/modals/ResultModal';
import { useRouter } from 'next/navigation';

export default function ResultModalProvider({ children }) {
  const dispatch = useDispatch();
  const router = useRouter();
  const { isOpen, score, presentationId, assessmentId } = useSelector(
    (state) => state.resultModal
  );

  // Restore modal state on component mount
  useEffect(() => {
    dispatch(restoreResultModal());
  }, [dispatch]);

  const handleRetry = () => {
    if (assessmentId) {
      router.push(`/assessment/${presentationId}?assessment-id=${assessmentId}`);
    } else {
      router.push(`/assessment/${presentationId}`);
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
        isOpen={isOpen}
        onClose={handleCloseModal}
        score={score}
        presentationId={presentationId}
        assessmentId={assessmentId}
        onRetry={handleRetry}
        onRestartTraining={handleRestartTraining}
      />
    </>
  );
}