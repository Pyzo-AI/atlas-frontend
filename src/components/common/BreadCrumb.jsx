import React from 'react'
import back_arrow from "../../assets/svg/back_arrow.svg";
import BreadCrumbConnect from "../../assets/svg/BreadCrumbConnect.svg";
import Image from 'next/image'
import { useRouter } from 'next/navigation';

export default function BreadCrumb({ title = "Unknown" }) {
  const router = useRouter();
  const handleBack = () => {
    router.back();
  };

  const handleAllCourse = () => {
    router.push("/");
  };
  return (
    <div className="flex items-center gap-[12px] mb-4">
      <Image src={back_arrow} alt="back_arrow" className="w-[20px] h-[20px] cursor-pointer" onClick={handleBack}/>
      <span className="font-lato font-medium text-[14px] leading-[100%] text-[#667085] cursor-pointer" onClick={handleAllCourse}>All Course </span>
      <Image src={BreadCrumbConnect} alt="BreadCrumbConnect" className="w-[12px] h-[12px]" />
      <span className="font-lato font-medium text-[14px] leading-[100%] text-[#043A87]">{title}</span>
    </div>
  )
}
