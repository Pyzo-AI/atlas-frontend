import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauthAndRetry } from "./baseQuery";

export const analyticsApi = createApi({
  reducerPath: "analyticsApi",
  baseQuery: baseQueryWithReauthAndRetry,
  endpoints: (builder) => ({
    getPresentationStats: builder.query({
      query: () => ({
        url: "api/users/analytics/presentations",
        method: "POST",
        body: {},
      }),
    }),
    getAssessmentStats: builder.query({
      query: () => ({
        url: "api/users/analytics/assessments",
        method: "POST",
        body: {},
      }),
    }),
  }),
});

export const {
  useGetPresentationStatsQuery,
  useGetAssessmentStatsQuery,
} = analyticsApi;