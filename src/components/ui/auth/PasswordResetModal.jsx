"use client";

import React, { useState, useEffect } from "react";
import { useForgotPasswordMutation } from "@/store/api/authApi";
import { toast } from "react-toastify";
import { logout } from "@/utils/auth";
import Modal from "@/components/common/Modal";
import Button from "@/components/common/Button";
import Image from "next/image";
import reset_password_icon from "@/assets/svg/reset-password-modal.svg";

export default function PasswordResetModal({ isOpen, email, onClose }) {
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setResendTimer(30);
    }
  }, [isOpen]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleResend = async () => {
    if (resendTimer > 0 || isLoading) return;
    try {
      await forgotPassword({ email }).unwrap();
      toast.success("Password reset link sent successfully.");
      setResendTimer(30);
    } catch (error) {
      toast.error(error?.data?.error || error?.data?.message || "Failed to resend reset link.");
    }
  };

  const handleClose = () => {
    onClose();
    logout();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="custom"
      className="!p-0 !bg-transparent shadow-none"
      showCloseButton={false}>
      {/* Main Container - managed by padding/max-width instead of hardcoded dimensions */}
      <div className="max-w-[440px] w-full bg-white rounded-[16px] p-5 flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-300">
        {/* Content Section */}
        <div className="flex flex-col items-center gap-6 w-full">
          {/* Header Section (Icon + Text) */}
          <div className="flex flex-col items-center gap-5 w-full">
            {/* Icon */}
            <div className="shrink-0">
              <Image src={reset_password_icon} alt="Password Reset" width={64} height={64} priority />
            </div>

            {/* Labels Section */}
            <div className="flex flex-col items-center gap-2 w-full">
              <h2 className="font-lato font-bold text-[20px] leading-[24px] text-[#1A1C29] text-center max-w-[240px]">
                Password Reset Email Sent
              </h2>
              <p className="font-lato font-normal text-[14px] leading-[19px] text-[rgba(26,28,41,0.8)] text-center">
                We’ve sent a password reset link to your registered email address. Please check your inbox and follow
                the link to create a new password. The link expires in 10 minutes.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-row items-center gap-3">
            {/* Resend Email Button */}
            <Button
              variant="secondary"
              onClick={handleResend}
              disabled={resendTimer > 0 || isLoading}
              className={`!px-3 !py-1.5 !rounded-[6px] !border-none !text-[12px] !leading-[14px] min-w-[95px] flex items-center justify-center transition-all ${
                resendTimer > 0 || isLoading
                  ? "!bg-[#F5F8FF] !text-[#A8C5F4]"
                  : "!bg-[#E8F0F9] !text-[#2762EA] hover:!opacity-90 cursor-pointer"
              }`}>
              {isLoading ? "Resending..." : resendTimer > 0 ? `Resend ${resendTimer}s` : "Resend Email"}
            </Button>

            {/* Close Button */}
            <Button
              variant="primary"
              onClick={handleClose}
              className="!px-3 !py-1.5 !bg-[#2762EA] !rounded-[6px] !text-white !text-[12px] !leading-[14px] min-w-[95px] flex items-center justify-center">
              Close
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
