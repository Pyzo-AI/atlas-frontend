"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { PyzoLoginScreen } from "@esmagico/pyzo-auth-sdk";
import { toast } from "react-toastify";

export default function LoginPage() {
  const router = useRouter();

  const handleLoginSuccess = (response) => {
    const tokens = response.data.tokens;
    
    // Store tokens in the existing key used by train-boost
    localStorage.setItem(
      "trainboost_tokens",
      JSON.stringify({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
      }),
    );

    toast.success("Login successful!");
    router.push("/");
  };

  const handleLoginFailure = (error) => {
    toast.error(error?.message || "Login failed. Please check your credentials.");
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
