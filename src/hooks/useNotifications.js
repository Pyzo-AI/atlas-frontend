import { useEffect, useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import notificationService from "../services/notificationService";
import {
  addNotification,
  setConnected,
  resetPagination,
  setLoading,
} from "../store/features/notificationsSlice";
import { 
  useGetNotificationsQuery, 
  useMarkNotificationAsReadMutation 
} from "../store/api/notificationsApi";

export function useNotifications(token) {
  const dispatch = useDispatch();
  const [pageToFetch, setPageToFetch] = useState(1);
  
  const { 
    items: notifications, 
    unreadCount, 
    isConnected,
    page,
    hasMore,
    total,
    loading
  } = useSelector((state) => state.notifications);

  // RTK Query hooks
  const { isFetching } = useGetNotificationsQuery(
    { page: pageToFetch, perPage: 20 },
    { skip: !token, refetchOnMountOrArgChange: true }
  );

  const [markAsReadMutation] = useMarkNotificationAsReadMutation();

  // Sync loading state with RTK Query's isFetching
  useEffect(() => {
    dispatch(setLoading(isFetching));
  }, [isFetching, dispatch]);

  const fetchNotifications = useCallback((pageNum = 1) => {
    setPageToFetch(pageNum);
  }, []);

  const loadMore = useCallback(() => {
    if (hasMore && token && !loading) {
      fetchNotifications(page + 1);
    }
  }, [hasMore, page, token, fetchNotifications, loading]);

  useEffect(() => {
    if (!token) return;

    // Connect to Socket via Service
    notificationService.connect(token);

    // Subscribe to connection status
    const unsubscribeStatus = notificationService.subscribeStatus((status) => {
      dispatch(setConnected(status));
      // Re-fetch on reconnect to catch missed notifications
      if (status) {
        fetchNotifications(1);
      }
    });

    // Subscribe to new notifications
    const unsubscribeMessage = notificationService.subscribe((notification) => {
      console.log("🔥 Notification Hook received:", notification);
      dispatch(addNotification(notification));

      // Show native browser notification if permitted
      if (typeof window !== "undefined" && window.Notification?.permission === "granted") {
        try {
          new window.Notification(notification.title, {
            body: notification.message,
            icon: "/icon.png", // Use the app icon
          });
        } catch (e) {
          console.error("Failed to show browser notification:", e);
        }
      }
    });

    // Request permissions
    if (typeof window !== "undefined" && window.Notification && window.Notification.permission === "default") {
      window.Notification.requestPermission();
    }

    return () => {
      unsubscribeStatus();
      unsubscribeMessage();
      notificationService.disconnect();
    };
  }, [token, dispatch, fetchNotifications]);

  const markAsRead = async (notificationId) => {
    try {
      await markAsReadMutation(notificationId).unwrap();
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  return {
    notifications,
    unreadCount,
    isConnected,
    hasMore,
    total,
    loading,
    markAsRead,
    loadMore,
    refresh: () => {
      dispatch(resetPagination());
      fetchNotifications(1);
    },
  };
}
