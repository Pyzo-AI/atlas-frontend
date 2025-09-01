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
    
  
  }),
});

export const {
  useGetQuizQuery,
  useSubmitQuestionMutation,
  useGetAllVideoQuery,
  useGetPresentationsQuery,
} = questionsApi;
