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
    createChatbotSession: builder.mutation({
      query: ({ agent_id, user_id }) => ({
        url: 'session/',
        method: 'POST',
        body: { agent_id, user_id },
      }),
    }),
    getChatbotConversations: builder.query({
      query: ({ page = 1, limit = 20 } = {}) =>
        `session/conversations?page=${page}&limit=${limit}`,
    }),
  }),
});

export const {
  useCreateSessionMutation,
  useCreateChatbotSessionMutation,
  useGetChatbotConversationsQuery,
  useLazyGetChatbotConversationsQuery,
} = liveKitApi;