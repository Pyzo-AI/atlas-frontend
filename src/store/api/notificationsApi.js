import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauthAndRetry } from './baseQuery';
import { setNotifications, markRead } from '../features/notificationsSlice';

export const notificationsApi = createApi({
  reducerPath: 'notificationsApi',
  baseQuery: baseQueryWithReauthAndRetry,
  tagTypes: ['Notification'],
  endpoints: (builder) => ({
    getNotifications: builder.query({
      query: ({ page = 1, perPage = 20 }) => `api/notifications?page=${page}&per_page=${perPage}`,
      providesTags: (result) =>
        result
          ? [
              ...result.notifications.map(({ id }) => ({ type: 'Notification', id })),
              { type: 'Notification', id: 'LIST' },
            ]
          : [{ type: 'Notification', id: 'LIST' }],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(
            setNotifications({
              notifications: data.notifications || [],
              total: data.total || 0,
              page: data.page || arg.page,
              unread_count: data.unread_count,
            })
          );
        } catch (error) {
          console.error('Failed to fetch notifications via RTK Query:', error);
        }
      },
    }),
    markNotificationAsRead: builder.mutation({
      query: (notificationId) => ({
        url: `api/notifications/${notificationId}/read`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Notification', id }],
      async onQueryStarted(notificationId, { dispatch, queryFulfilled }) {
        // Optimistic update
        dispatch(markRead(notificationId));
        try {
          await queryFulfilled;
        } catch (error) {
          console.error('Failed to mark notification as read via RTK Query:', error);
          // Reverting isn't strictly necessary here as per current logic, 
          // but we could dispatch an unmark action if needed.
        }
      },
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useMarkNotificationAsReadMutation,
} = notificationsApi;
