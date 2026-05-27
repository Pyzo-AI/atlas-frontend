"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { PyzoLoginScreen } from "@esmagico/pyzo-auth-sdk";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

export default function LoginPage() {
  const router = useRouter();

  const handleLoginSuccess = (response) => {
    toast.success("Login successful!");
    
    const urlParams = new URLSearchParams(window.location.search);
    const redirectUrl = urlParams.get("redirect");
    
    if (redirectUrl) {
      router.push(redirectUrl);
    } else {
      router.push("/");
    }
  };

  const handleLoginFailure = (error) => {
    console.log(error?.message || "Login failed. Please check your credentials.")
    // toast.error(error?.message || "Login failed. Please check your credentials.");
  };

  return (
    <div className="min-h-screen bg-white">
      <PyzoLoginScreen
        productName="atlas"
        baseUrl={process.env.NEXT_PUBLIC_LOGIN_BASE_URL || ""}
        onLoginSuccess={handleLoginSuccess}
        onLoginFailure={handleLoginFailure}
        // Signup is disabled for products other than "central" unless explicitly allowed
        onSignupSuccess={() => {}} 
        onSignupFailure={() => {}}
        onPermissionDenied={() => {
          toast.warning("You do not have an active subscription for Atlas.");
        }}
      />
    </div>
  );
}
