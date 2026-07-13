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

    // Submit video progress
    submitVideoProgress: builder.mutation({
      query: (progressData) => ({
        url: 'api/learner/activities',
        method: 'POST',
        body: progressData,
      }),
    }),

    // Get assessment
    getAssessment: builder.query({
      query: (assessmentId) => `api/learner/assessments/${assessmentId}/start`,
      providesTags: ['Question'],
    }),

    // Submit assessment
    submitAssessment: builder.mutation({
      query: ({ submissionId, answers }) => ({
        url: `api/learner/submissions/${submissionId}/submit`,
        method: 'POST',
        body: { answers },
      }),
    }),

    // Submit feedback
    submitFeedback: builder.mutation({
      query: (feedbackData) => ({
        url: 'presentations/feedback',
        method: 'POST',
        body: feedbackData,
      }),
    }),

    // Get assessment summary
    getAssessmentSummary: builder.query({
      query: (presentationId) => `presentations/${presentationId}/assessments/summary`,
      providesTags: ['Question'],
    }),

    // Generate image from presentation query
    generateImage: builder.mutation({
      query: ({ presentationId, currentSlideId, userMessage }) => ({
        url: 'presentations/query',
        method: 'POST',
        body: {
          presentation_id: presentationId,
          current_slide_id: currentSlideId,
          query: userMessage,
        },
      }),
    }),

    // Get conversation history
    getConversationHistory: builder.query({
      query: ({ presentationId, page = 1, limit = 20 }) =>
        `api/webhooks/presentations/${presentationId}/conversations?page=${page}&limit=${limit}`,
      providesTags: ['Question'],
    }),

    // Get interview link
    getInterviewLink: builder.mutation({
      query: () => ({
        url: `api/learner/interview-link`,
        method: 'POST',
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
  useSubmitVideoProgressMutation,
  useGetAssessmentQuery,
  useSubmitAssessmentMutation,
  useSubmitFeedbackMutation,
  useGetAssessmentSummaryQuery,
  useGenerateImageMutation,
  useGetConversationHistoryQuery,
  useLazyGetConversationHistoryQuery,
  useGetInterviewLinkMutation,
} = questionsApi;
