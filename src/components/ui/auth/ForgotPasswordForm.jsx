"use client";

import React, { useState, useEffect, useCallback } from "react";
import { FiArrowLeft } from "react-icons/fi";
import EmailInput from "./EmailInput";
import AuthButton from "./AuthButton";
import { useForgotPasswordMutation } from "@/store/api/authApi";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

const ForgotPasswordForm = ({ onBackToLogin, initialEmail = "" }) => {
  const [email, setEmail] = useState(initialEmail);
  const [emailError, setEmailError] = useState("");
  const [success, setSuccess] = useState(false);
  const [forgotPassword, { isLoading: loading }] = useForgotPasswordMutation();
  const [resendTimer, setResendTimer] = useState(0);
  const { t } = useTranslation();

  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const startResendTimer = useCallback(() => {
    setResendTimer(30);
  }, []);

  const validateEmail = (email) => {
    if (!email) {
      return t("auth.emailRequired");
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return t("auth.invalidEmail");
    }
    return "";
  };

  const handleEmailChange = (value) => {
    setEmail(value);
    if (emailError) {
      setEmailError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEmailError("");

    const validationError = validateEmail(email);
    if (validationError) {
      setEmailError(validationError);
      return;
    }

    try {
      await forgotPassword({ email }).unwrap();
      toast.success(t("auth.resetLinkSentSuccess"));
      setSuccess(true);
      startResendTimer();
    } catch (error) {
      const errorMessage = error?.data?.error || t("auth.failedResetLink");
      setEmailError(errorMessage);
    }
  };

  if (success) {
    return (
      <div className="max-w-[440px] w-full flex flex-col gap-9">
        <button
          onClick={onBackToLogin}
          className="flex flex-row items-center gap-[10px] w-fit group hover:bg-[#F9FAFB] px-3 py-2 -ml-3 rounded-[8px] transition-all duration-200 cursor-pointer">
          <FiArrowLeft className="w-5 h-5 text-[#111827] group-hover:-translate-x-1 transition-transform duration-200" />
          <span className="font-semibold text-[14px] leading-[19px] text-[#333333]">{t("auth.backToLogin")}</span>
        </button>

        <div className="flex flex-col gap-2">
          <h2 className="font-bold text-[28px] lg:text-[32px] leading-[34px] lg:leading-[38px] text-[#111827]">
            {t("auth.checkEmailTitle")}
          </h2>
          <div className="flex flex-wrap items-center gap-1 font-normal text-[14px] leading-[17px] text-[#4B5563]">
            <span>{t("auth.sentResetLinkDesc")}</span>
            <span className="text-[#111827] font-medium">{email}</span>
            <button
              onClick={() => setSuccess(false)}
              className="text-[#2877EE] font-semibold hover:underline cursor-pointer">
              {t("auth.change")}
            </button>
          </div>
        </div>

        {/* Next Steps Card */}
        <div
          className="w-full p-[12px] flex flex-col gap-[12px] rounded-[9px] border border-[rgba(40,119,238,0.2)]"
          style={{
            background: "linear-gradient(0deg, rgba(40, 119, 238, 0.1), rgba(40, 119, 238, 0.1)), #FFFFFF",
          }}>
          <div className="flex items-center">
            <span className="font-semibold text-[14px] leading-[17px] text-[#2877EE]">{t("auth.nextSteps")}</span>
          </div>
          <div className="flex flex-col gap-[8px]">
            <span className="font-normal text-[12px] leading-[14px] text-[#2877EE]">{t("auth.step1")}</span>
            <span className="font-normal text-[12px] leading-[14px] text-[#2877EE]">
              {t("auth.step2")}
            </span>
            <span className="font-normal text-[12px] leading-[14px] text-[#2877EE]">{t("auth.step3")}</span>
            <span className="font-normal text-[12px] leading-[14px] text-[#2877EE]">
              {t("auth.step4")}
            </span>
          </div>
        </div>

        {/* Resend Footer */}
        <div className="flex flex-row justify-center items-center gap-[8px] w-full">
          <span className="font-normal text-[14px] leading-[17px] text-[#4B5563]">{t("auth.didntReceiveEmail")}</span>
          <button
            type="button"
            onClick={async (e) => {
              await handleSubmit(e);
              startResendTimer();
            }}
            disabled={resendTimer > 0 || loading}
            className={`font-semibold text-[14px] leading-[17px] ${
              resendTimer > 0 || loading
                ? "text-[#9CA3AF] cursor-not-allowed"
                : "text-[#2877EE] hover:underline cursor-pointer"
            }`}>
            {loading ? t("auth.sending") : resendTimer > 0 ? t("auth.resendIn", { time: resendTimer }) : t("auth.clickToResend")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[440px] w-full flex flex-col gap-9 mt-[-5vh]">
      {/* Back to login */}
      <button
        type="button"
        onClick={onBackToLogin}
        className="flex flex-row items-center gap-[10px] w-fit group hover:bg-[#F9FAFB] px-3 py-2 -ml-3 rounded-[8px] transition-all duration-200 cursor-pointer">
        <FiArrowLeft className="w-5 h-5 text-[#111827] " />
        <span className="font-semibold text-[14px] leading-[19px] text-[#333333]">{t("auth.backToLogin")}</span>
      </button>

      {/* Header */}
      <div className="flex flex-col gap-2">
        <h2 className="font-semibold text-[28px] lg:text-[32px] leading-[34px] lg:leading-[38px] text-[#111827]">
          {t("auth.forgotPasswordTitle")}
        </h2>
        <p className="font-normal text-[14px] leading-[17px] text-[#4B5563]">
          {t("auth.forgotPasswordDesc")}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        <EmailInput value={email} onChange={handleEmailChange} error={emailError} />

        {/* Submit Button */}
        <AuthButton title={t("auth.sendResetLink")} loadingTitle={t("auth.sending")} isLoading={loading} />
      </form>
    </div>
  );
};

export default ForgotPasswordForm;
