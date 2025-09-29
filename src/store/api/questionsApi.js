import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauthAndRetry } from './baseQuery';

export const questionsApi = createApi({
  reducerPath: 'questionsApi',
  baseQuery: baseQueryWithReauthAndRetry,
  tagTypes: ['Question'],
  endpoints: (builder) => ({
    // Get quiz data
    getQuiz: builder.query({
      query: (presentationId) => `presentations/${presentationId}/quiz`,
      providesTags: ['Question'],
    }),

    getAllVideo: builder.query({
      query: (presentationId) => `presentations/${presentationId}/slides`,
      providesTags: ['Question'],
    }),

    getPresentations: builder.query({
      query: () => 'presentations/',
      providesTags: ['Question'],
    }),
    
    // Submit a new question
    submitQuestion: builder.mutation({
      query: ({ presentationId, ...questionData }) => ({
        url: `qa/${presentationId}`,
        method: 'POST',
        body: questionData,
      }),
      invalidatesTags: ['Question'],
    }),

    // Submit completion status
    submitCompletionStatus: builder.mutation({
      query: ({ presentationId, ...statusData }) => ({
        url: `presentations/${presentationId}/completion-status`,
        method: 'POST',
        body: statusData,
      }),
    }),
    
  
  }),
});

export const {
  useGetQuizQuery,
  useSubmitQuestionMutation,
  useGetAllVideoQuery,
  useGetPresentationsQuery,
  useSubmitCompletionStatusMutation,
} = questionsApi;
