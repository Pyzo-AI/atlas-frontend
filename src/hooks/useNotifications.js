import { useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import notificationService from "../services/notificationService";
import {
  setNotifications,
  addNotification,
  setConnected,
  resetPagination,
  setLoading,
  markRead,
} from "../store/features/notificationsSlice";
import { useLazyGetNotificationsQuery, useMarkNotificationAsReadMutation } from "../store/api/notificationApi";

export function useNotifications(token) {
  const dispatch = useDispatch();
  const { 
    items: notifications, 
    unreadCount, 
    isConnected,
    page,
    hasMore,
    total,
    loading
  } = useSelector((state) => state.notifications);

  const [triggerGetNotifications] = useLazyGetNotificationsQuery();
  const [triggerMarkRead] = useMarkNotificationAsReadMutation();

  const fetchNotifications = useCallback(async (pageNum = 1) => {
    if (!token) return;
    try {
      dispatch(setLoading(true));
      const perPage = 20;
      const result = await triggerGetNotifications({ 
        page: pageNum, 
        per_page: perPage, 
        admin: true 
      }).unwrap();
      
      dispatch(setNotifications({
        notifications: result.notifications || [],
        total: result.total || 0,
        page: result.page || pageNum,
        unread_count: result.unread_count
      }));
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
        dispatch(setLoading(false));
    }
  }, [token, dispatch, triggerGetNotifications]);

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
            icon: "/icon.png", 
          });
        } catch (e) {
          console.error("Failed to show browser notification:", e);
        }
      }
    });

    // Initial fetch
    fetchNotifications(1);

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
    if (!token) return;
    try {
      dispatch(markRead(notificationId)); // Optimistic update
      await triggerMarkRead(notificationId).unwrap();
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
