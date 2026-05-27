"use client";

import React, { useState } from "react";
import PasswordInput from "./PasswordInput";
import AuthButton from "./AuthButton";
import { useResetPasswordMutation } from "@/store/api/authApi";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

const UpdatePasswordForm = ({ onSuccess, token }) => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newPasswordError, setNewPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [resetPassword, { isLoading: loading }] = useResetPasswordMutation();
  const [generalError, setGeneralError] = useState("");
  const { t } = useTranslation();

  const validate = () => {
    let isValid = true;
    if (!newPassword) {
      setNewPasswordError(t("auth.newPasswordReq"));
      isValid = false;
    } else if (newPassword.length < 6) {
      setNewPasswordError(t("auth.passwordLength"));
      isValid = false;
    } else {
      setNewPasswordError("");
    }

    if (!confirmPassword) {
      setConfirmPasswordError(t("auth.confirmPasswordReq"));
      isValid = false;
    } else if (newPassword !== confirmPassword) {
      setConfirmPasswordError(t("auth.passwordsNotMatch"));
      isValid = false;
    } else {
      setConfirmPasswordError("");
    }

    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setGeneralError("");

    try {
      await resetPassword({ token, password: newPassword }).unwrap();
      toast.success(t("auth.newPasswordSet"));
      onSuccess();
    } catch (error) {
      const errorMessage = error?.data?.error || t("auth.failedUpdatePassword");
      setGeneralError(errorMessage);
    }
  };

  return (
    <div className="max-w-[400px] w-full flex flex-col gap-9 mt-[-5vh]">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h2 className="font-semibold text-[28px] lg:text-[32px] leading-[34px] lg:leading-[38px] text-[#111827]">
          {t("auth.resetPasswordTitle")}
        </h2>
        <p className="font-normal text-[14px] lg:text-[16px] leading-[20px] lg:leading-[24px] text-[#4B5563]">
          {t("auth.createNewPassword")}
        </p>
      </div>

      {/* General Error */}
      {generalError && (
        <div
          className="w-full h-[40px] flex items-center px-[12px] gap-[4px] rounded-[9px] border border-[rgba(214,87,69,0.2)]"
          style={{
            background: "linear-gradient(0deg, rgba(214, 87, 69, 0.1), rgba(214, 87, 69, 0.1)), #FFFFFF",
          }}>
          <span className="font-normal text-[12px] leading-[14px] text-[#D65745]">{generalError}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        <div className="flex flex-col gap-6">
          <PasswordInput
            labelKey="auth.newPassword"
            value={newPassword}
            onChange={(val) => {
              setNewPassword(val);
              if (newPasswordError) setNewPasswordError("");
            }}
            error={newPasswordError}
          />

          <PasswordInput
            labelKey="auth.confirmPassword"
            value={confirmPassword}
            onChange={(val) => {
              setConfirmPassword(val);
              if (confirmPasswordError) setConfirmPasswordError("");
            }}
            error={confirmPasswordError}
          />
        </div>

        {/* Update Button */}
        <AuthButton title={t("auth.updatePassword")} loadingTitle={t("auth.updating")} isLoading={loading} />
      </form>
    </div>
  );
};

export default UpdatePasswordForm;
