import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const liveKitApi = createApi({
  reducerPath: 'liveKitApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_LIVEKIT_API_URL,
    timeout: 10000,
  }),
  endpoints: (builder) => ({
    createSession: builder.mutation({
      query: ({ agent_id, user_id, presentation_id }) => ({
        url: '/session',
        method: 'POST',
        body: { agent_id, user_id, presentation_id },
      }),
    }),
  }),
});

export const { useCreateSessionMutation } = liveKitApi;