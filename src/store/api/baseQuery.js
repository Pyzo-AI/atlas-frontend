import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { preparePyzoHeaders, createPyzoBaseQuery } from "@esmagico/pyzo-auth-sdk";
import { logout } from "@/utils/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const baseQueryWithReauth = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers) => {
    headers.set("ngrok-skip-browser-warning", "true");
    return preparePyzoHeaders(headers, {
      baseUrl: process.env.NEXT_PUBLIC_LOGIN_BASE_URL || API_BASE_URL || "",
    });
  },
});

export const baseQueryWithReauthAndRetry = createPyzoBaseQuery(baseQueryWithReauth, {
  baseUrl: process.env.NEXT_PUBLIC_LOGIN_BASE_URL || API_BASE_URL || "",
  publicRoutes: ["/login"],
  loginPath: "/login",
  onLogout: (loginUrl) => logout(loginUrl),
});
