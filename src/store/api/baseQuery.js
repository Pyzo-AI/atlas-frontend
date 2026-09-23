import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { preparePyzoHeaders, createPyzoBaseQuery } from "@esmagico/pyzo-auth-sdk";
import { logout } from "@/utils/auth";
import { setApiErrorStatus } from "@/store/features/accessDeniedSlice";

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

const pyzoBaseQuery = createPyzoBaseQuery(baseQueryWithReauth, {
  baseUrl: process.env.NEXT_PUBLIC_LOGIN_BASE_URL || API_BASE_URL || "",
  publicRoutes: ["/login"],
  loginPath: "/login",
  onLogout: (loginUrl) => logout(loginUrl),
});

// Every api slice shares this single base query, so an error from ANY
// endpoint could in principle flip the global `accessDenied.status` flag -
// ResponsiveContainer shows AccessDeniedState for a 403, or the generic
// ErrorState for anything else. That full-page swap must only happen for
// whatever page the user is actually on, so it's gated to an allowlist of
// each page's own primary content query below - a background/secondary call
// on the same page (dashboard-summary widget, telemetry writes like
// submitVideoProgress, feedback/QA submissions, notification polling,
// org-config, etc.) failing with ANY status (a 403, a 500, a network drop)
// must never blank out an otherwise-working page or interrupt an active
// lecture/assessment session. Only an actual error sets the flag - a
// successful response never clears it, since a page can fire several
// queries at once and an unrelated one succeeding must not race away a real
// error from another. Clearing happens on navigation instead
// (ResponsiveContainer resets it on pathname change).
//
// Add a new page's primary endpoint here when it needs the same treatment.
const PRIMARY_PAGE_ENDPOINTS_FOR_ACCESS_DENIED = [
  "getPresentations", // Home / Modules
  "getAllVideo", // lecture/presentation details
  "getCertificates", // Certificates
  "getChats", // Chats list
];

export const baseQueryWithReauthAndRetry = async (args, api, extraOptions) => {
  const result = await pyzoBaseQuery(args, api, extraOptions);
  if (result.error && PRIMARY_PAGE_ENDPOINTS_FOR_ACCESS_DENIED.includes(api.endpoint)) {
    api.dispatch(setApiErrorStatus(result.error.status));
  }
  return result;
};
