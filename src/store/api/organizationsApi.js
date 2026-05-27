import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauthAndRetry } from './baseQuery';

export const organizationsApi = createApi({
  reducerPath: 'organizationsApi',
  baseQuery: baseQueryWithReauthAndRetry,
  tagTypes: ['OrganizationConfig'],
  endpoints: (builder) => ({
    getOrganizationConfig: builder.query({
      query: () => '/api/organizations/config',
      providesTags: ['OrganizationConfig'],
    }),
  }),
});

export const { useGetOrganizationConfigQuery } = organizationsApi;
