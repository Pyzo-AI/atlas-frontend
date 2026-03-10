"use client";

import React, { useState, useEffect } from "react";
import SearchFilter from "@/components/common/SearchFilter";
import Image from "next/image";
import PrimaryButton from "@/components/common/PrimaryButton";
import SecondaryButton from "@/components/common/SecondaryButton";
import CertificatePreviewModal from "@/components/common/CertificatePreviewModal";
import noDataFoundIcon from "@/assets/svg/no-data-found.svg";
import noCertificatesIcon from "@/assets/svg/no-certificate.svg";
import { useGetCertificatesMutation } from "@/store/api/certificatesApi";
import CertificateCardSkeleton from "@/components/common/CertificateCardSkeleton";

const FILTER_SECTIONS = [
  {
    title: "Sort By",
    paramName: "sort_order",
    type: "radio",
    gridCols: 1,
    options: [
      { label: "Newest First", value: "newest" },
      { label: "Oldest First", value: "oldest" },
    ],
  },
  {
    title: "Date Range",
    paramName: "date_range",
    type: "radio",
    gridCols: 2,
    options: [
      { label: "All Time", value: "all_time" },
      { label: "Last 7 Days", value: "last_7_days" },
      { label: "Last 30 Days", value: "last_30_days" },
      { label: "Last 3 Months", value: "last_3_months" },
      { label: "Last 6 Months", value: "last_6_months" },
      { label: "Last 1 Year", value: "last_1_year" },
      { label: "Custom Range", value: "custom" },
    ],
    customTriggerValue: "custom",
    customDateFields: [
      { label: "From", paramName: "custom_from" },
      { label: "To", paramName: "custom_to" },
    ],
  },
];

export default function CertificatesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({});
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);

  const [getCertificates, { data, isLoading }] = useGetCertificatesMutation();

  const isFilterApplied = !!searchTerm || Object.values(appliedFilters).some((values) => values.length > 0);

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        const body = { search: searchTerm };

        // Sort order
        const sortOrder = appliedFilters.sort_order?.[0];
        if (sortOrder) {
          body.sort_order = sortOrder;
        }

        // Date range
        const dateRange = appliedFilters.date_range?.[0];
        if (dateRange && dateRange !== "all_time") {
          const today = new Date();
          const to = today.toISOString().split("T")[0];
          let from;

          if (dateRange === "custom") {
            from = appliedFilters.custom_from || undefined;
            body.from = from;
            body.to = appliedFilters.custom_to || to;
          } else {
            const daysMap = {
              last_7_days: 7,
              last_30_days: 30,
              last_3_months: 90,
              last_6_months: 180,
              last_1_year: 365,
            };
            const days = daysMap[dateRange];
            if (days) {
              const fromDate = new Date();
              fromDate.setDate(fromDate.getDate() - days);
              from = fromDate.toISOString().split("T")[0];
            }
            body.from = from;
            body.to = to;
          }
        }

        await getCertificates(body).unwrap();
      } catch (err) {
        console.error("Failed to fetch certificates:", err);
      }
    };
    fetchCertificates();
  }, [searchTerm, appliedFilters, getCertificates]);

  const certificates = data?.certificates || [];

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

      <div className="flex-1 flex flex-col p-4 md:p-5 md:pl-4 pt-0 md:pt-0">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mt-4 md:mt-[0px]">
            {[...Array(8)].map((_, i) => (
              <CertificateCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            {certificates.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mt-4 md:mt-[0px]">
                {certificates.map((cert) => (
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
            ) : (
              <div className="flex-1 flex items-center justify-center pb-[15vh]">
                <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-500 w-[300px] mx-auto">
                  {/* Icon (72x72 container) */}
                  <Image src={isFilterApplied ? noDataFoundIcon : noCertificatesIcon} alt="No Data Found" width={72} height={72} />

                  {/* Text Frame (gap 12px from icon) */}
                  <div className="flex flex-col items-center gap-[6px]">
                    <h2 className="font-lato font-bold text-[16px] leading-[19px] text-[#1A1C29] text-center capitalize">
                      {isFilterApplied ? "No Results Found" : "No Certificates Yet"}
                    </h2>
                    <p className="font-lato font-normal text-[12px] leading-[16px] text-[#4B5563] text-center w-[300px]">
                      {searchTerm
                        ? "No certificates match your search. Try a different keyword."
                        : Object.values(appliedFilters).some((v) => (Array.isArray(v) ? v.length > 0 : !!v))
                          ? "No certificates match your filters. Try different filter."
                          : "Complete your assessments to earn certificates and see them here."}
                    </p>
                  </div>
                </div>
              </div>
            )}
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
