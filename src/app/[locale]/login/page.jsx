"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PyzoLoginScreen } from "@esmagico/pyzo-auth-sdk";
import { showToast } from "@/utils/toast";
import { getApiErrorMessage } from "@/utils/errorHandler";
import { useTranslation } from "react-i18next";
import PyzoLoader from "@/components/common/PyzoLoader";
import atlasLoginLogo from "@/assets/svg/pyzo-atlas-logo.svg";

export default function LoginPage() {
  const router = useRouter();
  // Unlike window.location.search, useSearchParams() resolves consistently
  // during server-side rendering too, so this is already correct in the
  // very first HTML the server sends - passed to PyzoLoginScreen so it
  // never has to render the email form for an in-progress SSO callback,
  // not even for a single frame before hydration.
  const hasSsoCallback = useSearchParams().has("code");

  const handleLoginSuccess = (response) => {
    showToast.success("Login Successful!", "Welcome back to Atlas.");

    const urlParams = new URLSearchParams(window.location.search);
    const redirectUrl = urlParams.get("redirect");

    if (redirectUrl) {
      router.push(redirectUrl);
    } else {
      router.push("/");
    }
  };

  const handleLoginFailure = (error) => {
    showToast.error(getApiErrorMessage(error, "Login failed. Please try again."));
  };

  return (
    <div className="min-h-screen bg-white">
      <PyzoLoginScreen
        productName="atlas"
        baseUrl={process.env.NEXT_PUBLIC_LOGIN_BASE_URL || ""}
        hasSsoCallback={hasSsoCallback}
        // ssoLoadingScreen={<PyzoLoader fullScreen />}
        onLoginSuccess={handleLoginSuccess}
        onLoginFailure={handleLoginFailure}
        // Signup is disabled for products other than "central" unless explicitly allowed
        onSignupSuccess={() => {}} 
        onSignupFailure={() => {}}
        onPermissionDenied={() => {
          showToast.warning("You do not have an active subscription for Atlas.");
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

