'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function CongratulationsPage() {
  const router = useRouter();

  // useEffect(() => {
  //   // Auto redirect to home after 5 seconds
  //   const timer = setTimeout(() => {
  //     router.push('/');
  //   }, 5000);

  //   return () => clearTimeout(timer);
  // }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9F9F9]">
      <div className="max-w-2xl w-full bg-white rounded-xl border border-[#E5E7EB] overflow-hidden mt-[-200px]">
        <div className="p-8 text-center">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg 
              className="w-14 h-14 text-green-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
          </div>
          
          <h1 className="text-[32px] font-lato font-bold text-[#1A1C29] mb-4">
            Congratulations! 🎉
          </h1>
          
          <p className="text-[18px] font-lato font-medium text-[#667085] mb-8">
            Thank you for training with TrainBoost!
          </p>
          
          <div className="bg-[#F3EDFF] border border-[#744FFF] p-4 rounded-[8px] mb-8">
            <p className="text-[16px] font-lato font-medium text-[#744FFF]">
              You&apos;ve successfully completed the training and passed the assessment with flying colors!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
