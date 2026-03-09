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
  }),
});

export const { useGetCertificatesMutation } = certificatesApi;
