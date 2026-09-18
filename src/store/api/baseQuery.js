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
export const baseQueryWithReauthAndRetry = async (args, api, extraOptions) => {
  const result = await pyzoBaseQuery(args, api, extraOptions);
  if (result.error) {
    api.dispatch(setApiErrorStatus(result.error.status));
  }
  return result;
};
