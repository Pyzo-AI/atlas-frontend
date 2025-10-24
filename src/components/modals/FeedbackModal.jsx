"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/common/Modal";
import { getUserDetailsFromToken } from "@/store/utils/token";
import { usePostHog } from "@/hooks/usePostHog";
import { useSubmitFeedbackMutation } from "@/store/api/questionsApi";

export default function FeedbackModal({
  isOpen,
  onClose,
  presentationId
}) {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [hoveredStar, setHoveredStar] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { capture } = usePostHog();
  const [submitFeedback] = useSubmitFeedbackMutation();

  const handleStarClick = (starIndex, isHalf = false) => {
    setRating(isHalf ? starIndex - 0.5 : starIndex);
  };

  const handleStarHover = (starIndex, isHalf = false) => {
    setHoveredStar(isHalf ? starIndex - 0.5 : starIndex);
  };

  const handleStarLeave = () => {
    setHoveredStar(0);
  };

  const handleReviewChange = (e) => {
    if (e.target.value.length <= 250) {
      setReview(e.target.value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting || rating === 0) return;

    setIsSubmitting(true);

    try {
      const userDetails = getUserDetailsFromToken();
      const feedbackData = {
        rating,
        review,
        presentationId,
        name: userDetails?.name || userDetails?.preferred_username || 'anonymous',
        userId: userDetails?.sub || 'anonymous',
      };

      await submitFeedback(feedbackData).unwrap();
      console.log('Feedback submitted successfully');

      capture("qna_feedback", {
        user_id: userDetails?.sub,
        module_id: presentationId,
        feedback: review
      });

      // Close feedback modal and redirect to home with success parameter
      onClose();
      router.push('/?feedback=success');
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setIsSubmitting(false);
    }
  };



  const isSubmitDisabled = rating === 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => { }} // Prevent closing
      closeOnOverlayClick={false}
      closeOnEscape={false}
      size="md"
      className="overflow-hidden mx-4 sm:mx-0 rounded-3xl"
    >
      <div className="p-8 bg-white">
        <div className="flex flex-col items-center gap-6">
          {/* Header Section */}
          <div className="flex flex-col items-center gap-4">
            {/* Icon - Using a simple emoji since we don't have the image */}
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-3xl">⭐</span>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-gray-900 text-center">
              How Was the Training?
            </h2>
          </div>

          {/* Rating Section */}
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => {
              const currentRating = hoveredStar || rating;
              const isFullStar = star <= currentRating;
              const isHalfStar = star - 0.5 === currentRating;

              return (
                <div key={star} className="relative w-8 h-8">
                  {/* Star SVG */}
                  <svg
                    className={`w-8 h-8 cursor-pointer transition-colors ${isFullStar
                      ? 'text-yellow-400 fill-current'
                      : isHalfStar
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                      }`}
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    {isHalfStar && (
                      <defs>
                        <linearGradient id={`half-${star}`}>
                          <stop offset="50%" stopColor="#FCD34D" />
                          <stop offset="50%" stopColor="#D1D5DB" />
                        </linearGradient>
                      </defs>
                    )}
                  </svg>

                  {/* Left half click area */}
                  <button
                    className="absolute left-0 top-0 w-1/2 h-full focus:outline-none cursor-pointer z-10"
                    onClick={() => handleStarClick(star, true)}
                    onMouseEnter={() => handleStarHover(star, true)}
                    onMouseLeave={handleStarLeave}
                  />

                  {/* Right half click area */}
                  <button
                    className="absolute right-0 top-0 w-1/2 h-full focus:outline-none cursor-pointer z-10"
                    onClick={() => handleStarClick(star, false)}
                    onMouseEnter={() => handleStarHover(star, false)}
                    onMouseLeave={handleStarLeave}
                  />
                </div>
              );
            })}
          </div>

          {/* Review Text Area */}
          <div className="w-full max-w-md">
            <div className="relative rounded-xl">
              <textarea
                value={review}
                onChange={handleReviewChange}
                placeholder="Write a review… (optional)"
                className="w-full h-24 p-3 text-sm resize-none border rounded-xl outline-none border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              />
              <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                ({review.length}/250)
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="relative group w-full">
            <button
              onClick={handleSubmit}
              disabled={isSubmitDisabled || isSubmitting}
              className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all duration-200 ${isSubmitDisabled || isSubmitting
                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg'
                }`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </div>
              ) : 'Submit'}
            </button>

            {/* Tooltip for disabled state */}
            {isSubmitDisabled && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20">
                Rating is required
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-0 border-t-4 border-solid border-gray-800"></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}