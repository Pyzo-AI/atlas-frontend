"use client";

import { useState } from "react";
import { useDispatch } from "react-redux";
import { useLocalizedRouter } from "@/hooks/useLocalizedRouter";
import Modal from "@/components/common/Modal";
import { getUserDetailsFromToken } from "@/store/utils/token";
import { usePostHog } from "@/hooks/usePostHog";
import { useSubmitFeedbackMutation } from "@/store/api/questionsApi";
import review_image from "@/assets/svg/review.svg";
import unrated_start from "@/assets/svg/unrated_start.svg";
import rated_start from "@/assets/svg/rated_start.svg";
import half_rated_star from "@/assets/svg/half_rated_star.svg";
import Image from "next/image";
import TextArea from "@/components/ui/TextArea";
import Lottie from "lottie-react";
import spinnerAnimation from "@/assets/json/spinner.json";

export default function FeedbackModal({ isOpen, onClose, presentationId }) {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [hoveredStar, setHoveredStar] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dispatch = useDispatch();
  const router = useLocalizedRouter();
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

  const handleKeyDown = (e) => {
    e.stopPropagation();
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
        name: userDetails?.name || userDetails?.preferred_username || "anonymous",
        userId: userDetails?.sub || "anonymous",
      };

      await submitFeedback(feedbackData).unwrap();
      console.log("Feedback submitted successfully");

      capture("qna_feedback", {
        user_id: userDetails?.sub,
        module_id: presentationId,
        feedback: review,
      });

      // Close feedback modal and redirect to home with success parameter
      onClose();
      router.push("/?feedback=success");
    } catch (error) {
      console.log("Error submitting review:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSubmitDisabled = rating === 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}} // Prevent closing
      closeOnOverlayClick={false}
      closeOnEscape={false}
      size="md"
      className="overflow-hidden mx-4 sm:mx-0 rounded-3xl">
      <div className="p-8 bg-white">
        <div className="flex flex-col items-center gap-2">
          {/* Header Section */}
          <div className="flex flex-col items-center gap-4">
            {/* Icon - Using a simple emoji since we don't have the image */}
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center">
              <Image src={review_image} alt="Review" className="w-12 h-12" />
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold text-primary-text text-center">How Was the Training?</h2>
          </div>

          {/* Rating Section */}
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => {
              const currentRating = hoveredStar || rating;
              const isFullStar = star <= currentRating;
              const isHalfStar = star - 0.5 === currentRating;

              let starSrc = unrated_start;
              if (isFullStar) {
                starSrc = rated_start;
              } else if (isHalfStar) {
                starSrc = half_rated_star;
              }

              return (
                <div key={star} className="relative w-8 h-8">
                  <Image
                    src={starSrc}
                    alt={isFullStar ? "Rated star" : isHalfStar ? "Half rated star" : "Unrated star"}
                    width={32}
                    height={32}
                    className="w-8 h-8"
                  />

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
              <TextArea
                value={review}
                onChange={handleReviewChange}
                onKeyDown={handleKeyDown}
                placeholder="Write a review… (optional)"
                className="h-24 text-sm border-gray-300 rounded-xl focus:ring-1 focus:ring-accent"
              />
              <div className="absolute bottom-3 right-3 text-xs text-gray-400">({review.length}/250)</div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="relative group w-full flex justify-center">
            <button
              onClick={handleSubmit}
              disabled={isSubmitDisabled || isSubmitting}
              className={`cursor-pointer w-1/2 py-2 rounded-4xl font-semibold text-lg transition-all duration-200 ${
                isSubmitDisabled || isSubmitting
                  ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                  : "bg-accent hover:bg-accent-hover text-light shadow-lg"
              }`}>
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <Lottie animationData={spinnerAnimation} className="-ml-1 mr-2 h-5 w-5" loop={true} />
                  Submitting...
                </div>
              ) : (
                "Submit"
              )}
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
