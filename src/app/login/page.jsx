"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/common/Button";
import { toast } from "react-toastify";
import { FiEye, FiEyeOff } from "react-icons/fi";
import trainBoostLogo from "@/assets/svg/train-boost-logo.svg";


const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const loginBaseUrl = process.env.NEXT_PUBLIC_LOGIN_BASE_URL;

  // Redirect if already authenticated
  useEffect(() => {
    const tokens = JSON.parse(localStorage.getItem("trainboost_tokens") || '{}');
    if (tokens.access_token) {
      router.push("/");
    }
  }, [router]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${loginBaseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username:email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Store both tokens
        localStorage.setItem("trainboost_tokens", JSON.stringify({
          access_token: data.access_token,
          refresh_token: data.refresh_token
        }));

        toast.success("Login successful! Welcome to Train Boost", {
          position: "top-right",
          autoClose: 2000,
        });

        router.push("/");
      } else {
        toast.error("Invalid email or password. Please check your credentials.", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (error) {
      toast.error("Login failed. Please try again.", {
        position: "top-right",
        autoClose: 3000,
      });
    }
    
    setIsLoading(false);
  };


  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[#FEFBFF] overflow-hidden mt-[-52px]">
      {/* Background blur effects */}
      <div 
        className="absolute w-[819px] h-[819px] left-[-318px] top-[221px] bg-[rgba(158,59,213,0.7)] rounded-full"
        style={{ filter: 'blur(160px)' }}
      />
      <div 
        className="absolute w-[1157px] h-[1157px] left-[230px] top-[367px] bg-[#4A47C8] rounded-full"
        style={{ filter: 'blur(190px)' }}
      />
      
      {/* Main login card */}
      <div className="relative z-10 w-[441px] bg-white rounded-[13px] shadow-[0px_4px_104px_rgba(0,0,0,0.07)] p-[30px_30px_40px_30px]">
        <div className="flex flex-col items-center gap-12">
          {/* Header section */}
          <div className="flex flex-col items-center gap-1">
            {/* Logo and brand */}
            <div className="flex items-center gap-1 mb-1">
              <div className="w-6 h-6">
                <img src={trainBoostLogo.src} alt="TrainBoost Logo" className="w-6 h-6" />
              </div>
              <span className="text-[16px] font-lato font-bold leading-[19px] tracking-[0.02em] text-[#1A1C29]">
                Train Boost 
              </span>
            </div>
            
            {/* Main heading */}
            <h1 className="text-[24px] font-lato font-bold leading-[29px] tracking-[0.02em] text-[#1A1C29] text-center">
              Sign in to your account
            </h1>
          </div>


          {/* Form section */}
          <div className="w-full flex flex-col gap-6">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Email field */}
              <div className="flex flex-col gap-[11px]">
                <label htmlFor="email" className="text-[16px] font-lato font-semibold leading-[19px] text-[#1A1C29]">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  // type="email"
                  autoComplete="email"
                  required
                  className="w-full h-[44px] bg-white border border-[#E5E7EB] rounded-[11px] px-3 py-[9px] text-[14px] font-lato font-normal leading-[17px] text-black placeholder:text-[rgba(0,0,0,0.5)] focus:outline-none focus:border-[#4A47C8] transition-colors"
                  placeholder="abc@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>


              {/* Password field */}
              <div className="flex flex-col gap-[11px]">
                <label htmlFor="password" className="text-[16px] font-lato font-semibold leading-[19px] text-[#1A1C29]">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    className="w-full h-[44px] bg-white border border-[#E5E7EB] rounded-[11px] px-3 py-[9px] pr-12 text-[14px] font-lato font-normal leading-[17px] text-black placeholder:text-[rgba(0,0,0,0.5)] focus:outline-none focus:border-[#4A47C8] transition-colors"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="cursor-pointer absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 flex items-center justify-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <FiEye className="w-full h-full text-[rgba(26,28,41,0.7)]" strokeWidth={1.5} />
                    ) : (
                      <FiEyeOff className="w-full h-full text-[rgba(26,28,41,0.7)]" strokeWidth={1.5} />
                    )}
                  </button>
                </div>
              </div>


              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading}
                className="cursor-pointer w-full h-[44px] bg-gradient-to-b from-[#685EDD] to-[#DA8BFF] rounded-[11px] flex items-center justify-center px-3 py-[9px] disabled:opacity-70"
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
                    <span className="text-[16px] font-lato font-semibold leading-[19px] text-white">
                      Signing in...
                    </span>
                  </div>
                ) : (
                  <span className="text-[16px] font-lato font-semibold leading-[19px] text-white">
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