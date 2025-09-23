import React from "react";
import back_arrow from "../../assets/svg/back_arrow.svg";
import BreadCrumbConnect from "../../assets/svg/BreadCrumbConnect.svg";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function BreadCrumb({ paths = [] }) {
  const router = useRouter();
  const handleBack = () => {
    router.back();
  };

  const handlePathClick = (pathUrl) => {
    router.push(pathUrl);
  };

  const clickablePaths = paths.slice(0, -1);
  const title = paths[paths.length - 1];

  return (
    <div className="invisible md:visible flex items-center gap-[12px] mb-[-12px] md:mb-4">
      <Image
        src={back_arrow}
        alt="back_arrow"
        className="w-[20px] h-[20px] cursor-pointer"
        onClick={handleBack}
      />
      {clickablePaths.map((path, index) => (
        <React.Fragment key={index}>
          <span
            className="font-lato font-medium text-[14px] leading-[100%] text-[#667085] cursor-pointer"
            onClick={() => handlePathClick(path.path)}
          >
            {path.label}
          </span>
          <Image
            src={BreadCrumbConnect}
            alt="BreadCrumbConnect"
            className="w-[12px] h-[12px]"
          />
        </React.Fragment>
      ))}
      {title && (
        <span className="font-lato font-medium text-[14px] leading-[100%] text-[#043A87]">
          {title.label}
        </span>
      )}
    </div>
  );
}
