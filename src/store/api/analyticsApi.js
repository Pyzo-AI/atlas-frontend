import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const dummyResponse = {
  summary_metrics: [
    {
      title: "# Total Presentations",
      value: "1"
    },
    {
      title: "# Total Active Users", 
      value: "6"
    },
    {
      title: "Average Completion Rate",
      value: "0.00%"
    }
  ]
};

export const analyticsApi = createApi({
  reducerPath: "analyticsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api/analytics/",
  }),
  endpoints: (builder) => ({
    getPresentationStats: builder.query({
      queryFn: () => ({ data: dummyResponse }),
    }),
    getAssessmentStats: builder.query({
      queryFn: () => ({ data: dummyResponse }),
    }),
  }),
});

export const {
  useGetPresentationStatsQuery,
  useGetAssessmentStatsQuery,
} = analyticsApi;