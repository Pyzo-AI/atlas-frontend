"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Header from "@/components/layout/Header";
import { getTokens } from "@/store/utils/token";

const PrivateRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Skip auth check for login page
    if (pathname === "/login") {
      // setIsLoading(false);
      return;
    }

    const tokens = getTokens();

    // Simple check: if access token exists, user is authenticated
    if (tokens.access_token) {
      setIsAuthenticated(true);
    } else {
      router.push("/login");
    }

    // setIsLoading(false);
  }, [pathname, router]);

  // Show loading state while checking authentication
  // if (isLoading) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center">
  //       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4A47C8]"></div>
  //     </div>
  //   );
  // }

  // For login page, render without header
  if (pathname === "/login") {
    return children;
  }

  // For other pages, render with header if authenticated
  if (isAuthenticated) {
    return (
      <>
        <Header />
        {children}
      </>
    );
  }

  // Return null while redirecting to login
  return null;
};

export default PrivateRoute;
