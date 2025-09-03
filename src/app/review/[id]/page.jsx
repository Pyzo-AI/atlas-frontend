"use client"
import React, { useState } from 'react';
import unrated_start from '@/assets/svg/unrated_start.svg';
import rated_start from '@/assets/svg/rated_start.svg';
import half_rated_star from '@/assets/svg/half_rated_star.svg';
import ratingIMG from '@/assets/svg/rating.svg';
import Image from 'next/image';
import { getTokens, getUserDetailsFromToken } from '@/store/utils/token';
import RatingSuccessModal from '@/components/ui/RatingSuccessModal';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import BreadCrumb from '@/components/common/BreadCrumb';


export default function Review({params}) {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [hoveredStar, setHoveredStar] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const router = useRouter();
  const resolvedParams = React.use(params);
  const presentationId = resolvedParams.id;
  console.log("Presentation ID:", presentationId);

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
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      const userDetails = getUserDetailsFromToken();
      console.log("User details:", userDetails);
      
      const data = {
        rating,
        review,
        presentationId,
        name: userDetails?.name || 'anonymous',
        userName: userDetails?.preferred_username || 'anonymous',
        email: userDetails?.email || 'anonymous',
        userId: userDetails?.sub || 'anonymous',
      };

      console.log('Submitting review data:', data);

      const response = await fetch("https://script.google.com/macros/s/AKfycbwOMSbXPGz1vAXtp2eGWgtP-O4WNpnqI0cUi1PfEQqM9_bAK9TL3gxKCQnJtVoEO7THOA/exec", {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
    //   const result = await response.json();
    //   console.log('Success:', result);
      
      // Show success modal
      setShowSuccessModal(true);
      
    } catch (error) {
      console.error('Error submitting review:', error);
      // TODO: Add error notification to the user
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
    // Reset form after successful submission
    setRating(0);
    setReview('');
    router.push('/');
  };

  const isSubmitDisabled = rating === 0;

  return (
    <div className="min-h-screen bg-[#F9F9F9] pt-5 pb-8 px-10">
       <BreadCrumb
             paths={[
               { path: "/", label: "All Courses" },
               { path: "", label: "Review" },
             ]}
           />
      {/* Main Rating Card */}
      <div className="flex justify-center pt-12">
        <div className="w-144 bg-white border border-gray-200 rounded-2xl px-10 py-[30px] flex flex-col items-center gap-5">
          <div className="flex flex-col items-center gap-5 w-full">
            {/* Header Section */}
            <div className="flex flex-col items-center gap-5">
              {/* Icon */}
              <Image src={ratingIMG} alt="Rating" width={100} height={100} />

              {/* Title */}
              <h2 className="text-2xl font-bold text-gray-900">How Was the Training?</h2>
            </div>

            {/* Rating and Review Section */}
            <div className="flex flex-col items-center gap-6 w-full">
              {/* Star Rating */}
              <div className="flex items-center gap-2">
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
              <div className="w-full max-w-md px-7">
                <div className="relative rounded-xl">
                  <textarea
                    value={review}
                    onChange={handleReviewChange}
                    placeholder="Write a review… (optional)"
                    className="w-full h-24 p-3 text-sm resize-none border-0 rounded-xl outline outline-1 outline-[#E5E7EB] focus:outline-1 focus:outline-[#744FFF]"
                  />
                  <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                    ({review.length}/250)
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button with Tooltip */}
          <div className="relative group">
            <button
              onClick={handleSubmit}
              disabled={isSubmitDisabled || isSubmitting}
              className={`px-16 py-2 rounded-full font-medium text-base transition-colors flex items-center justify-center min-w-[120px] ${
                isSubmitDisabled || isSubmitting
                  ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  : 'bg-[#744FFF] text-white hover:bg-[#5F3FCC] cursor-pointer'
              }`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </>
              ) : 'Submit'}
            </button>
            {isSubmitDisabled && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                Rating is required
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-0 border-t-4 border-solid border-gray-800 border-t-gray-800"></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <RatingSuccessModal 
        isOpen={showSuccessModal} 
        onClose={handleCloseModal} 
      />
    </div>
  );
}