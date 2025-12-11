"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { FiEye, FiEyeOff } from "react-icons/fi";
import trainBoostLogo from "@/assets/svg/train-boost-logo.svg";
import { usePostHog } from "@/hooks/usePostHog";
import { getUserDetailsFromToken } from "@/store/utils/token";
import { useLoginMutation } from "@/store/api/authApi";
import InputField from "@/components/ui/InputField";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { capture, identify } = usePostHog();
  const [login, { isLoading }] = useLoginMutation();

  // Redirect if already authenticated
  useEffect(() => {
    const tokens = JSON.parse(
      localStorage.getItem("trainboost_tokens") || "{}"
    );
    if (tokens.access_token) {
      router.push("/");
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const data = await login({ email, password }).unwrap();

      // Store both tokens
      localStorage.setItem(
        "trainboost_tokens",
        JSON.stringify({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        })
      );

      // Get user details from token for PostHog tracking
      const userDetails = getUserDetailsFromToken();

      // Track session start event
      capture("session_start", {
        user_id: userDetails?.sub,
        timestamp: new Date().toISOString(),
      });

      // Track successful login event
      capture("user_login", {
        user_id: userDetails?.sub,
        timestamp: new Date().toISOString(),
        device: navigator.userAgent,
        location: window.location.hostname,
      });

      // Identify user in PostHog
      if (userDetails) {
        identify(userDetails.sub, {
          email: email,
          username: userDetails.username || userDetails.preferred_username,
          name: userDetails.name,
          first_login: userDetails.iat
            ? new Date(userDetails.iat * 1000).toISOString()
            : undefined,
          roles: userDetails.roles || userDetails.groups,
          last_login: new Date().toISOString(),
        });
      }

      toast.success("Login successful! Welcome to Upskillr", {
        position: "top-right",
        autoClose: 2000,
      });

      router.push("/");
    } catch (error) {
      const isInvalidCredentials = error.status === 401 || error.status === 400;

      // Track failed login attempt
      capture(isInvalidCredentials ? "login_failed" : "login_error", {
        email: email,
        timestamp: new Date().toISOString(),
        error_type: isInvalidCredentials ? "invalid_credentials" : "network_error",
        status_code: error.status,
        error_message: error.data?.message || error.message,
      });

      toast.error(
        error.data?.message || "Login failed. Please try again.",
        {
          position: "top-right",
          autoClose: 3000,
        }
      );
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[#FEFBFF] overflow-hidden mt-[-44px] px-4 sm:px-6">
      {/* Background blur effects */}
      <div
        className="absolute w-[819px] h-[819px] left-[-318px] top-[221px] bg-[rgba(158,59,213,0.7)] rounded-full"
        style={{ filter: "blur(160px)" }}
      />
      <div
        className="absolute w-[1157px] h-[1157px] left-[230px] top-[367px] bg-[#4A47C8] rounded-full"
        style={{ filter: "blur(190px)" }}
      />

      {/* Main login card */}
      <div className="mt-[-50px] relative z-10 w-full max-w-[441px] bg-white rounded-[13px] shadow-[0px_4px_104px_rgba(0,0,0,0.07)] p-6 sm:p-[30px_30px_40px_30px]">
        <div className="flex flex-col items-center gap-8 sm:gap-12">
          {/* Header section */}
          <div className="flex flex-col items-center gap-1">
            {/* Logo and brand */}
            <div className="flex items-center gap-1 mb-1">
              <div className="w-6 h-6">
                <img
                  src={trainBoostLogo.src}
                  alt="Upskillr Logo"
                  className="w-6 h-6"
                />
              </div>
              <span className="text-[20px] font-lato font-bold leading-[19px] tracking-[0.02em] text-[#1A1C29]">
                Upskillr 
              </span>
            </div>

            {/* Main heading */}
            <h1 className="text-xl sm:text-[24px] font-lato font-bold leading-tight sm:leading-[29px] tracking-[0.02em] text-[#1A1C29] text-center">
              Sign in to your account
            </h1>
          </div>

          {/* Form section */}
          <div className="w-full flex flex-col gap-4 sm:gap-6">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Email field */}
              <InputField
                id="email"
                name="email"
                label="Email"
                placeholder="abc@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />

              {/* Password field */}
              <InputField
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                label="Password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                rightIcon={
                  showPassword ? (
                    <FiEye
                      className="w-full h-full text-[rgba(26,28,41,0.7)]"
                      strokeWidth={1.5}
                    />
                  ) : (
                    <FiEyeOff
                      className="w-full h-full text-[rgba(26,28,41,0.7)]"
                      strokeWidth={1.5}
                    />
                  )
                }
                onRightIconClick={() => setShowPassword(!showPassword)}
              />

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading}
                className="cursor-pointer w-full h-11 sm:h-[44px] bg-gradient-to-b from-[#685EDD] to-[#DA8BFF] rounded-[11px] flex items-center justify-center px-3 py-2 sm:py-[9px] disabled:opacity-70"
              >
                {isLoading ? (
                  <div className="flex items-center gap-3">
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span className="text-sm sm:text-[16px] font-lato font-semibold leading-tight sm:leading-[19px] text-white">
                      Signing in...
                    </span>
                  </div>
                ) : (
                  <span className="text-sm sm:text-[16px] font-lato font-semibold leading-tight sm:leading-[19px] text-white">
                    Sign In
                  </span>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
