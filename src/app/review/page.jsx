"use client"
import React, { useState } from 'react';
import unrated_start from '@/assets/svg/unrated_start.svg';
import rated_start from '@/assets/svg/rated_start.svg';
import ratingIMG from '@/assets/svg/rating.svg';
import Image from 'next/image';
import { getTokens, getUsernameFromToken } from '@/store/utils/token';

export default function Review() {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [hoveredStar, setHoveredStar] = useState(0);
  const token = getTokens().access_token;

  const handleStarClick = (starIndex) => {
    setRating(starIndex);
  };

  const handleStarHover = (starIndex) => {
    setHoveredStar(starIndex);
  };

  const handleStarLeave = () => {
    setHoveredStar(0);
  };

  const handleReviewChange = (e) => {
    if (e.target.value.length <= 250) {
      setReview(e.target.value);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const username = getUsernameFromToken();
    let data = {
      rating,
      review,
      userName: username || 'anonymous', // Fallback to 'anonymous' if username not found
    };

    console.log('Submitting review data:', data);

  };

  const isSubmitDisabled = rating === 0;

  return (
    <div className=" w-full min-h-screen bg-gray-50">
      {/* Main Rating Card */}
      <div className="flex justify-center pt-20">
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
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    className="w-8 h-8 rounded focus:outline-none transition-colors cursor-pointer"
                    onClick={() => handleStarClick(star)}
                    onMouseEnter={() => handleStarHover(star)}
                    onMouseLeave={handleStarLeave}
                  >
                    <Image 
                      src={star <= (hoveredStar || rating) ? rated_start : unrated_start} 
                      alt={star <= (hoveredStar || rating) ? "Rated star" : "Unrated star"} 
                      width={32} 
                      height={32}
                    />
                  </button>
                ))}
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
              disabled={isSubmitDisabled}
              className={`px-16 py-2 rounded-full font-medium text-base transition-colors ${
                isSubmitDisabled
                  ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  : 'bg-[#744FFF] text-white hover:bg-[#5F3FCC] cursor-pointer'
              }`}
            >
              Submit
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
    </div>
  );
}