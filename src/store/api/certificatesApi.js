import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauthAndRetry } from "./baseQuery";

export const certificatesApi = createApi({
  reducerPath: "certificatesApi",
  baseQuery: baseQueryWithReauthAndRetry,
  endpoints: (builder) => ({
    getCertificates: builder.mutation({
      query: (body) => ({
        url: "api/users/certificates",
        method: "POST",
        body: body,
      }),
    }),
    generateCertificate: builder.mutation({
      query: (presentationId) => ({
        url: `presentations/${presentationId}/certificate`,
        method: "GET",
      }),
    }),
    getUserMetadata: builder.query({
      query: () => ({
        url: "api/users/metadata",
        method: "GET",
      }),
    }),
  }),
});

export const { useGetCertificatesMutation, useGenerateCertificateMutation, useGetUserMetadataQuery } = certificatesApi;
