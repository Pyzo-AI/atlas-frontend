import React from "react";

const PageSkeleton = () => {
  return (
    <div className="relative flex size-full h-[calc(100vh-55px)] flex-col bg-page-background overflow-x-hidden">
      <div className="layout-container flex h-full grow flex-col">
        <div className="px-6 py-5 overflow-hidden">
          {/* BreadCrumb Skeleton */}
          <div className="flex items-center gap-[12px] mb-4 animate-pulse">
            <div className="w-[20px] h-[20px] bg-gray-200 rounded"></div>
            <div className="h-[14px] w-20 bg-gray-200 rounded"></div>
            <div className="w-[12px] h-[12px] bg-gray-200 rounded"></div>
            <div className="h-[14px] w-32 bg-gray-200 rounded"></div>
          </div>

          <div className="flex w-full h-[calc(100%-36px)] min-w-0 bg-white py-4 px-5">
            {/* PPT Section Skeleton - 70% */}
            <div
              className="flex flex-col h-[calc(100vh-156px)] pr-5 border-r border-border-light flex-shrink-0"
              style={{ width: "70%" }}>
              {/* Main Video/Slide Section Skeleton */}
              <div className="bg-white rounded-xl border border-border-light min-h-[400px] relative animate-pulse flex-1">
                <div className="w-full h-full bg-gray-200 rounded-xl flex items-center justify-center">
                  <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
                </div>
              </div>

              {/* Title and Author Skeleton */}
              <div className="mt-3 flex justify-between items-center pr-1 animate-pulse">
                <div className="h-5 w-48 bg-gray-200 rounded"></div>
                <div className="h-4 w-32 bg-gray-200 rounded"></div>
              </div>

              {/* Video Playlist Skeleton */}
              <div className="w-full rounded-xl relative mt-4">
                <div className="overflow-x-auto overflow-y-visible">
                  <div className="flex gap-2 pb-1.5 pt-5 overflow-y-visible animate-pulse">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className="flex-shrink-0 w-[119px] h-[68px] bg-white border border-border-light rounded-lg">
                        <div className="p-2 flex flex-col gap-1.5">
                          <div className="h-[28px] bg-gray-200 rounded w-full"></div>
                          <div className="h-[10px] bg-gray-100 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Video Panel Skeleton - 30% */}
            <div className="flex flex-col h-full relative gap-4 flex-shrink-0 pl-4" style={{ width: "30%" }}>
              {/* Video Player Skeleton */}
              <div className="p-3 pb-2 bg-white rounded-xl border border-border-light animate-pulse">
                <div className="relative w-full pt-[56.25%] bg-gray-200 rounded-lg overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                  </div>
                </div>
                {/* Time display skeleton */}
                <div className="px-1 flex justify-between mt-2">
                  <div className="h-3 w-16 bg-gray-200 rounded"></div>
                  <div className="h-3 w-8 bg-gray-200 rounded"></div>
                </div>
              </div>

              {/* AI Learning Assistant Skeleton */}
              <div className="flex flex-col items-start p-3 gap-2.5 w-full flex-1 border border-border-light rounded-xl bg-white animate-pulse">
                <div className="w-full h-full bg-gray-100 rounded-xl p-3 flex flex-col">
                  <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4">
                    <div className="flex flex-col items-center gap-4 w-full max-w-[275px]">
                      {/* Icon skeleton */}
                      <div className="w-[72px] h-[72px] bg-gray-200 rounded-full"></div>
                      {/* Text skeleton */}
                      <div className="flex flex-col items-center gap-2 w-full">
                        <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-100 rounded w-full"></div>
                        <div className="h-4 bg-gray-100 rounded w-4/5"></div>
                      </div>
                    </div>
                    {/* Button skeleton */}
                    <div className="w-[136px] h-9 bg-gray-200 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageSkeleton;
