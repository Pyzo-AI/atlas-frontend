"use client";

import React, { useState } from "react";
import SearchFilter from "@/components/common/SearchFilter";
import Image from "next/image";
import PrimaryButton from "@/components/common/PrimaryButton";
import SecondaryButton from "@/components/common/SecondaryButton";
import CertificatePreviewModal from "@/components/common/CertificatePreviewModal";

// Dummy data
const GERTIFICATES_DATA = [
  {
    id: 1,
    title: "Mastering the Art of Conversation",
    instructor: "Dr. Ananya Mehta",
    issuedDate: "21 Sept 2025",
    category: "Communication",
    icon: "https://cdn-icons-png.flaticon.com/512/3112/3112946.png",
    pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    certificateImageUrl:
      "https://img.freepik.com/free-vector/modern-certificate-template-with-golden-frame_53876-116743.jpg",
  },
  {
    id: 2,
    title: "The Psychology of Dialogue",
    instructor: "Dr. Sarah Elman",
    issuedDate: "10 Jun 2025",
    category: "Psychology",
    icon: "https://cdn-icons-png.flaticon.com/512/3112/3112946.png",
    pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    certificateImageUrl:
      "https://img.freepik.com/free-vector/elegant-certificate-template-with-golden-seal_23-2148202022.jpg",
  },
  {
    id: 3,
    title: "Introduction to Effective Communication",
    instructor: "Prof. Liam Johnson",
    issuedDate: "15 Apr 2025",
    category: "Communication",
    icon: "https://cdn-icons-png.flaticon.com/512/3112/3112946.png",
    pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    certificateImageUrl:
      "https://img.freepik.com/free-vector/modern-certificate-template-flat-design_23-2148216335.jpg",
  },
  {
    id: 4,
    title: "The Power of Clear Communication",
    instructor: "Dr. Alok Singh",
    issuedDate: "21 Mar 2025",
    category: "Communication",
    icon: "https://cdn-icons-png.flaticon.com/512/3112/3112946.png",
    pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    certificateImageUrl:
      "https://img.freepik.com/free-vector/classic-certificate-template-horizontal-orientation_23-2148200673.jpg",
  },
];

const FILTER_SECTIONS = [
  {
    title: "Category",
    paramName: "category",
    options: [
      { label: "Communication", value: "Communication" },
      { label: "Psychology", value: "Psychology" },
    ],
  },
];

export default function CertificatesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({});
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);

  const filteredCertificates = GERTIFICATES_DATA.filter((cert) => {
    const matchesSearch = cert.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      !appliedFilters.category ||
      appliedFilters.category.length === 0 ||
      appliedFilters.category.includes(cert.category);
    return matchesSearch && matchesCategory;
  });

  const handleDownload = (url, title) => {
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${title}.pdf`);
    link.setAttribute("target", "_blank");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col bg-[#F9F9FC] min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col gap-3 p-4 md:p-5 md:pl-4 bg-[#F2F2F8] md:bg-transparent">
        <div className="flex flex-col gap-1">
          <h1 className="font-lato font-bold text-base leading-[19px] text-[#111827]">Reports</h1>
          <p className="font-lato font-normal text-xs leading-[14px] text-[#4B5563]">
            View and download your earned certificates from completed courses
          </p>
        </div>

        {/* Search and Filter Row */}
        <SearchFilter
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search by certificate name"
          filterSections={FILTER_SECTIONS}
          appliedFilters={appliedFilters}
          onFilterChange={setAppliedFilters}
          marginTop="0px"
        />
      </div>

      <div className="flex flex-col p-4 md:p-5 md:pl-4 pt-0 md:pt-0">
        {/* Certificates Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mt-4 md:mt-[0px]">
          {filteredCertificates.map((cert) => (
            <div
              key={cert.id}
              className="bg-white rounded-lg p-3 flex flex-col gap-[10px] md:gap-4 shadow-[0px_1px_12px_rgba(0,0,0,0.04)] border border-[#E5E7EB]">
              {/* Top Icon and Label */}
              <div className="flex flex-col gap-2">
                <Image src={cert.icon} alt="Award" width={40} height={40} className="object-contain rounded-lg" />
                <div className="flex flex-col gap-[5px]">
                  <h3 className="font-lato font-semibold text-sm leading-[17px] text-[#1D1F2C] line-clamp-2">
                    {cert.title}
                  </h3>
                  <p className="font-lato font-normal text-xs leading-[14px] text-[#585858] truncate">
                    {cert.instructor}
                  </p>
                  <p className="font-lato font-normal text-[10px] leading-[12px] text-[#4B5563]">
                    Issued On {cert.issuedDate}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <SecondaryButton
                  className="flex-1"
                  onClick={() => {
                    setSelectedCertificate(cert);
                    setIsPreviewModalOpen(true);
                  }}>
                  View Certificate
                </SecondaryButton>
                <PrimaryButton className="flex-1" onClick={() => handleDownload(cert.pdfUrl, cert.title)}>
                  Download
                </PrimaryButton>
              </div>
            </div>
          ))}
        </div>

        {filteredCertificates.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <p className="font-lato font-medium text-gray-400">No certificates found matching your criteria</p>
            <button
              onClick={() => {
                setSearchTerm("");
                setAppliedFilters({});
              }}
              className="text-[#2762EA] text-sm hover:underline cursor-pointer">
              Clear all filters
            </button>
          </div>
        )}

        {selectedCertificate && (
          <CertificatePreviewModal
            isOpen={isPreviewModalOpen}
            onClose={() => setIsPreviewModalOpen(false)}
            imageUrl={selectedCertificate.certificateImageUrl}
            title={selectedCertificate.title}
            onDownload={() => handleDownload(selectedCertificate.pdfUrl, selectedCertificate.title)}
          />
        )}
      </div>
    </div>
  );
}
