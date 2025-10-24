"use client";

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { restoreFeedbackModal, hideFeedbackModal } from '@/store/features/feedbackModalSlice';
import FeedbackModal from '@/components/modals/FeedbackModal';

export default function FeedbackModalProvider({ children }) {
  const dispatch = useDispatch();
  const { isOpen, presentationId } = useSelector(
    (state) => state.feedbackModal
  );

  // Restore modal state on component mount
  useEffect(() => {
    dispatch(restoreFeedbackModal());
  }, [dispatch]);

  const handleCloseModal = () => {
    dispatch(hideFeedbackModal());
  };

  return (
    <>
      {children}
      <FeedbackModal
        isOpen={isOpen}
        onClose={handleCloseModal}
        presentationId={presentationId}
      />
    </>
  );
}