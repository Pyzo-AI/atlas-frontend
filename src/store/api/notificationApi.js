import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauthAndRetry } from './baseQuery';

export const notificationApi = createApi({
  reducerPath: 'notificationApi',
  baseQuery: baseQueryWithReauthAndRetry,
  tagTypes: ['Notification'],
  endpoints: (builder) => ({
    getNotifications: builder.query({
      query: ({ page = 1, per_page = 20, admin = false }) => ({
        url: 'api/notifications',
        params: { page, per_page },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.notifications.map(({ id }) => ({ type: 'Notification', id })),
              { type: 'Notification', id: 'LIST' },
            ]
          : [{ type: 'Notification', id: 'LIST' }],
    }),
    markNotificationAsRead: builder.mutation({
      query: (notificationId) => ({
        url: `api/notifications/${notificationId}/read`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Notification', id }],
    }),
  }),
});

export const {
  useLazyGetNotificationsQuery,
  useMarkNotificationAsReadMutation,
} = notificationApi;
