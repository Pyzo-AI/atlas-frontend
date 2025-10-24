"use client";

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { restoreFeedbackModal, hideFeedbackModal } from '@/store/features/feedbackModalSlice';
import FeedbackModal from '@/components/modals/FeedbackModal';
import { usePathname } from 'next/navigation';

export default function FeedbackModalProvider({ children }) {
  const dispatch = useDispatch();
  const pathname = usePathname();
  const { isOpen, presentationId } = useSelector(
    (state) => state.feedbackModal
  );

  // Only show modal on assessment pages
  const isAssessmentPage = pathname?.includes('/assessment/');
  const shouldShowModal = isOpen && isAssessmentPage;

  // Restore modal state on component mount
  useEffect(() => {
    dispatch(restoreFeedbackModal());
  }, [dispatch]);

  // Clear modal state when leaving assessment pages
  useEffect(() => {
    if (!isAssessmentPage && isOpen) {
      dispatch(hideFeedbackModal());
    }
  }, [isAssessmentPage, isOpen, dispatch]);

  const handleCloseModal = () => {
    dispatch(hideFeedbackModal());
  };

  return (
    <>
      {children}
      <FeedbackModal
        isOpen={shouldShowModal}
        onClose={handleCloseModal}
        presentationId={presentationId}
      />
    </>
  );
}