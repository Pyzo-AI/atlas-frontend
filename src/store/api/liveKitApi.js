import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauthAndRetry } from './baseQuery';

export const liveKitApi = createApi({
  reducerPath: 'liveKitApi',
  baseQuery: baseQueryWithReauthAndRetry,
  endpoints: (builder) => ({
    createSession: builder.mutation({
      query: ({ agent_id, user_id, presentation_id }) => ({
        url: 'presentations/session',
        method: 'POST',
        body: { agent_id, user_id, presentation_id },
      }),
    }),
  }),
});

export const { useCreateSessionMutation } = liveKitApi;