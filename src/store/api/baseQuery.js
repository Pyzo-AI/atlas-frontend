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

// Every api slice shares this single base query, so any error status from
// ANY endpoint flips the global `accessDenied.status` flag - ResponsiveContainer
// shows AccessDeniedState for a 403 specifically, or the generic ErrorState
// for anything else. Only an actual error sets it - a successful response
// never clears it, since a page can fire several queries at once (e.g. the
// Modules page's presentations + dashboard-summary calls) and an unrelated
// one succeeding must not race away a real error from another. Clearing
// happens on navigation instead (ResponsiveContainer resets it on pathname
// change).
//
// The notification bell and org-config gating are header-level widgets, not
// page content - an error from either must not blank out whatever page the
// user is currently on. `getNotifications` reports its own 403 locally
// instead (see notificationsSlice / NotificationDrawer).
const ENDPOINTS_EXCLUDED_FROM_GLOBAL_ACCESS_DENIED = [
  "getOrganizationConfig",
  "getNotifications",
  "markNotificationAsRead",
];

// A 403 specifically must only blank a page when it comes from THAT page's
// own primary content query - not from a secondary/incidental call sharing
// the same page (dashboard-summary widget, user metadata, telemetry writes,
// etc.), which would otherwise wrongly show "access denied" over a page
// whose main data loaded fine. Add a new page's primary endpoint here when
// it needs the same treatment; a non-403 error still falls through to the
// blanket ErrorState for any endpoint, unchanged.
const PRIMARY_PAGE_ENDPOINTS_FOR_ACCESS_DENIED = [
  "getPresentations", // Home / Modules
  "getAllVideo", // lecture/presentation details
  "getCertificates", // Certificates
  "getChats", // Chats list
];

export const baseQueryWithReauthAndRetry = async (args, api, extraOptions) => {
  const result = await pyzoBaseQuery(args, api, extraOptions);
  if (result.error && !ENDPOINTS_EXCLUDED_FROM_GLOBAL_ACCESS_DENIED.includes(api.endpoint)) {
    const isAccessDenied = result.error.status === 403;
    if (!isAccessDenied || PRIMARY_PAGE_ENDPOINTS_FOR_ACCESS_DENIED.includes(api.endpoint)) {
      api.dispatch(setApiErrorStatus(result.error.status));
    }
  }
  return result;
};
