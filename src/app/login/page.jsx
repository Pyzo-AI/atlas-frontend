"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FiAlertCircle } from "react-icons/fi";
import Image from "next/image";
import logo from "@/assets/svg/pyzo-logo.svg";
import login_image from "@/assets/svg/login-image.svg";
import EmailInput from "@/components/ui/auth/EmailInput";
import PasswordInput from "@/components/ui/auth/PasswordInput";
import ForgotPasswordForm from "@/components/ui/auth/ForgotPasswordForm";
import UpdatePasswordForm from "@/components/ui/auth/UpdatePasswordForm";
import AuthButton from "@/components/ui/auth/AuthButton";
import { useLoginMutation } from "@/store/api/authApi";
import { usePostHog } from "@/hooks/usePostHog";
import { getUserDetailsFromToken } from "@/store/utils/token";
import { toast } from "react-toastify";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const [login] = useLoginMutation();
  const { capture, identify } = usePostHog();

  const view = searchParams.get("view");
  const token = searchParams.get("token") || "";
  const isForgotPassword = view === "forgot-password";
  const isUpdatePassword = view === "update-password";

  useEffect(() => {
    const tokens = JSON.parse(localStorage.getItem("trainboost_tokens") || "{}");
    if (tokens.access_token) {
      router.push("/");
    }
  }, [router]);

  const validateEmail = (email) => {
    if (!email) {
      return "Email is required";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Invalid email. Check and try again or contact admin.";
    }
    return "";
  };

  const validatePassword = (password) => {
    if (!password) {
      return "Password is required";
    }
    if (password.length < 6) {
      return "Password must be at least 6 characters";
    }
    return "";
  };

  const handleEmailChange = (value) => {
    setEmail(value);
    if (emailError) {
      setEmailError("");
    }
    if (error) setError("");
  };

  const handlePasswordChange = (value) => {
    setPassword(value);
    if (passwordError) {
      setPasswordError("");
    }
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setEmailError("");
    setPasswordError("");
    setLoading(true);

    const emailValidationError = validateEmail(email);
    const passwordValidationError = validatePassword(password);

    if (emailValidationError || passwordValidationError) {
      setEmailError(emailValidationError);
      setPasswordError(passwordValidationError);

      let errorMessage = "Please enter your ";
      const isFormatError = emailValidationError === "Invalid email. Check and try again or contact admin.";

      if (emailValidationError && passwordValidationError) {
        if (isFormatError) {
          errorMessage = "Invalid email and missing password.";
        } else {
          errorMessage += "email and password to continue.";
        }
      } else if (emailValidationError) {
        if (isFormatError) {
          errorMessage = emailValidationError;
        } else {
          errorMessage += "email to continue.";
        }
      } else {
        errorMessage += "password to continue.";
      }

      setError(errorMessage);
      setLoading(false);
      return;
    }

    try {
      const data = await login({ email, password }).unwrap();

      localStorage.setItem(
        "trainboost_tokens",
        JSON.stringify({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        })
      );

      // PostHog tracking
      const userDetails = getUserDetailsFromToken();
      if (userDetails) {
        capture("user_login", {
          user_id: userDetails.sub,
          timestamp: new Date().toISOString(),
        });
        identify(userDetails.sub, {
          email: email,
          name: userDetails.name,
        });
      }

      toast.success("Login successful!");
      router.push("/");
    } catch (error) {
      setError("Invalid email or password. Please check your credentials.");
      toast.error("Invalid email or password.");
    }

    setLoading(false);
  };

  return (
    <div className="flex flex-col lg:flex-row w-full min-h-screen bg-white font-lato">
      {/* Left side Section */}
      <div className="flex flex-col flex-1">
        {/* Logo - Normal Flow */}
        <div className="pt-[30px] px-[20px] lg:pl-[40px]">
          <Image
            src={logo}
            alt="Pyzo Logo"
            width={84.54}
            height={36}
            className="object-contain cursor-pointer"
            onClick={() => router.push("/")}
          />
        </div>

        {/* Login/Forgot Password/Update Password Form Container - Centered in remaining space using Normal CSS */}
        <div className="flex-1 flex items-center justify-center lg:justify-start px-[20px] lg:pl-[60px] mt-[-5vh] py-10 lg:py-0">
          {isForgotPassword ? (
            <ForgotPasswordForm onBackToLogin={() => router.push("/login")} initialEmail={email} />
          ) : isUpdatePassword ? (
            <UpdatePasswordForm onSuccess={() => router.push("/login")} token={token} />
          ) : (
            <div className="max-w-[440px] w-full flex flex-col gap-6">
              {/* Headline and Subhead */}
              <div className="flex flex-col gap-2">
                <h1 className="font-semibold text-[28px] lg:text-[32px] leading-[34px] lg:leading-[38px] text-[#111827]">
                  Hi, Welcome! 👋
                </h1>
                <p className="font-normal text-[14px] lg:text-[16px] leading-[20px] lg:leading-[24px] text-[#4B5563]">
                  Lets login to your account
                </p>
              </div>

              {/* General Error Alert - Normal Flow */}
              {error && (
                <div
                  className="w-full min-h-[40px] flex items-center px-[12px] py-2 gap-[4px] rounded-[9px] border border-[rgba(214,87,69,0.2)]"
                  style={{
                    background: "linear-gradient(0deg, rgba(214, 87, 69, 0.1), rgba(214, 87, 69, 0.1)), #FFFFFF",
                  }}>
                  <div className="flex items-center gap-[4px] w-full">
                    <FiAlertCircle className="w-4 h-4 text-[#D65745] flex-shrink-0" />
                    <span className="font-normal text-[12px] leading-[14px] text-[#D65745] font-lato">{error}</span>
                  </div>
                </div>
              )}

              {/* Form Content - Normal Flow */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-8">
                <div className="flex flex-col gap-4">
                  <EmailInput value={email} onChange={handleEmailChange} error={emailError} />

                  <PasswordInput value={password} onChange={handlePasswordChange} error={passwordError} />

                  {/* Forgot Password */}
                  <div className="w-full text-right">
                    <button
                      type="button"
                      onClick={() => router.push("/login?view=forgot-password")}
                      className="font-medium text-[14px] lg:text-[16px] leading-[16px] text-[#2762EA] hover:underline transition-all cursor-pointer">
                      Forgot password?
                    </button>
                  </div>
                </div>

                {/* Log In Button */}
                <AuthButton title="Log In" loadingTitle="Signing in..." isLoading={loading} />
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Right side Section - Image with Overlays */}
      <div className="hidden lg:flex relative w-1/2 overflow-hidden flex-col">
        {/* Mirror effect - Image background (Absolute to stay behind) */}
        <div className="absolute inset-0 scale-x-[-1]">
          <Image src={login_image} alt="Business workspace" fill className="object-cover" priority />
        </div>

        {/* Top Overlay - Normal Flow (Will sit on top due to z-index/order) */}
        <div
          className="relative w-full h-[88px] backdrop-blur-[2px] z-10"
          style={{
            background: "linear-gradient(180deg, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0) 100%)",
          }}
        />

        {/* Bottom Info Panel (Remains Absolute as requested) */}
        <div className="absolute bottom-0 left-0 w-full h-[368px] flex flex-col justify-center items-center px-[127px] text-center z-10">
          {/* Multi-layered Gradients as per Figma */}
          <div
            className="absolute inset-0 scale-y-[-1]"
            style={{
              background: "linear-gradient(180deg, #000000 0%, rgba(0, 0, 0, 0.71) 45.97%, rgba(0, 0, 0, 0) 100%)",
            }}
          />
          <div
            className="absolute inset-0 scale-y-[-1] opacity-50"
            style={{
              background:
                "linear-gradient(180deg, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.355) 45.97%, rgba(0, 0, 0, 0) 100%)",
            }}
          />

          {/* Text Content - Frame 1707479085 */}
          <div className="relative z-10 flex flex-col gap-[10px] items-center mt-10">
            <h2 className="font-bold text-[26px] leading-[31px] text-white">All-in-One Training Dashboard</h2>
            <p className="font-normal text-[16px] leading-[23px] text-white opacity-80 max-w-[494px]">
              Quickly onboard your team, create modules and assessments, assign them to users, and track progress
              effortlessly all from a single dashboard
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
