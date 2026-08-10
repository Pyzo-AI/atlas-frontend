"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { PyzoLoginScreen } from "@esmagico/pyzo-auth-sdk";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import atlasLoginLogo from "@/assets/svg/atlas-login-logo.svg";

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
        ssoConfig={{
          keycloakBaseUrl: process.env.NEXT_PUBLIC_KEYCLOAK_BASE_URL || "",
          realm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM || "",
          clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || "",
          clientSecret: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_SECRET || "",
          redirectUri: process.env.NEXT_PUBLIC_REDIRECT_URI || "",
        }}
        productLogo={atlasLoginLogo.src}
        productLabel="Atlas"
        panelHeading="AI Training Coach"
        panelDescription="Transform your SOPs, policies, and decks into AI-powered training with voice-first learning—available on any device, in any language, and built to reinforce competency."
        panelFeatures={[
          'Auto-generate training modules',
          'Voice & chat query resolution',
          'Any language, any device',
          'Built-in competency tracking',
        ]}
      />
    </div>
  );
}

