"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import SearchFilter from "@/components/common/SearchFilter";
import Image from "next/image";
import PrimaryButton from "@/components/common/PrimaryButton";
import SecondaryButton from "@/components/common/SecondaryButton";
import CertificatePreviewModal from "@/components/common/CertificatePreviewModal";
import noDataFoundIcon from "@/assets/svg/no-data-found.svg";
import noCertificatesIcon from "@/assets/svg/no-certificate.svg";
import { useGetCertificatesMutation, useGetUserMetadataQuery } from "@/store/api/certificatesApi";
import CertificateCardSkeleton from "@/components/common/CertificateCardSkeleton";

export default function CertificatesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const isInitialMount = useRef(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({});
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);

  const [getCertificates, { data, isLoading }] = useGetCertificatesMutation();
  const { data: metadata } = useGetUserMetadataQuery();
  const filterSections = metadata || [];

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 800);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Initialize state from URL
  useEffect(() => {
    if (!filterSections.length) return; // Wait for metadata to be ready

    const filters = {};
    searchParams.forEach((value, key) => {
      // Decide if it's an array or string based on filterSections
      const section = filterSections.find((s) => s.paramName === key);
      if (section) {
        if (section.type === "radio") {
          filters[key] = [value];
        } else {
          filters[key] = value.split(",");
        }
      } else {
        // Check if it's a custom date field
        const isDateField = filterSections.some((s) => s.customDateFields?.some((f) => f.paramName === key));
        if (isDateField) {
          filters[key] = value;
        } else {
          filters[key] = value.split(",");
        }
      }
    });
    setAppliedFilters(filters);
    isInitialMount.current = false;
  }, [filterSections]); // Trigger when metadata is loaded

  // Sync state to URL (Only appliedFilters)
  useEffect(() => {
    if (isInitialMount.current) return;

    const params = new URLSearchParams();
    Object.entries(appliedFilters).forEach(([key, value]) => {
      if (Array.isArray(value) && value.length > 0) {
        params.set(key, value.join(","));
      } else if (typeof value === "string" && value) {
        params.set(key, value);
      }
    });

    const queryString = params.toString();
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
    router.replace(newUrl, { scroll: false });
  }, [appliedFilters, pathname, router]);

  const isFilterApplied = !!searchTerm || Object.values(appliedFilters).some((values) => values.length > 0);

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        const body = { search: debouncedSearchTerm };

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
        console.log("Failed to fetch certificates:", err);
      }
    };
    fetchCertificates();
  }, [debouncedSearchTerm, appliedFilters, getCertificates]);

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
          <h1 className="font-lato font-bold text-base leading-[19px] text-[#111827]">Certificates</h1>
          <p className="font-lato font-normal text-xs leading-[14px] text-[#4B5563]">
            View and download your earned certificates from completed courses
          </p>
        </div>

        {/* Search and Filter Row */}
        <SearchFilter
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search by certificate name"
          filterSections={filterSections}
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
                  <Image
                    src={isFilterApplied ? noDataFoundIcon : noCertificatesIcon}
                    alt="No Data Found"
                    width={72}
                    height={72}
                  />

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
