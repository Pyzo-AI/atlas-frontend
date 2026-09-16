import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { preparePyzoHeaders, createPyzoBaseQuery } from "@esmagico/pyzo-auth-sdk";
import { logout } from "@/utils/auth";
import pyzoLogo from "@/assets/svg/pyzo-atlas-logo.svg";
import { CURRENT_PRODUCT_ID } from "@/config/product";

// Sidebar tool switcher hits central-services (the same backend
// pyzo-central-frontend itself talks to as its "own" API), not this app's
// own atlas-backend — hence NEXT_PUBLIC_LOGIN_BASE_URL, not
// NEXT_PUBLIC_API_BASE_URL, mirroring pyzo-central-frontend's apiSlice.ts.
const CENTRAL_BASE_URL = process.env.NEXT_PUBLIC_LOGIN_BASE_URL || "";

const baseQuery = fetchBaseQuery({
  baseUrl: CENTRAL_BASE_URL,
  prepareHeaders: (headers) => preparePyzoHeaders(headers, { baseUrl: CENTRAL_BASE_URL }),
});

const baseQueryWithReauth = createPyzoBaseQuery(baseQuery, {
  baseUrl: CENTRAL_BASE_URL,
  publicRoutes: ["/login"],
  loginPath: "/login",
  onLogout: (loginUrl) => logout(loginUrl),
});

export const productsApi = createApi({
  reducerPath: "productsApi",
  baseQuery: baseQueryWithReauth,
  keepUnusedDataFor: 300,
  endpoints: (builder) => ({
    getSidebarTools: builder.query({
      query: () => ({ url: "products/sidebar-tools", params: { current_product_id: CURRENT_PRODUCT_ID } }),
      // Response is { data: [...] }, not a bare array — matches
      // pyzo-central-frontend's own productsApi.ts transformResponse.
      transformResponse: (res) => (res?.data || []).map((p) => ({ ...p, icon: p.icon || pyzoLogo })),
    }),
  }),
});

export const { useGetSidebarToolsQuery } = productsApi;
