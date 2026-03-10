import { useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import notificationService from "../services/notificationService";
import {
  setNotifications,
  addNotification,
  setUnreadCount,
  markRead,
  setConnected,
} from "../store/features/notificationsSlice";

export function useNotifications(token) {
  const dispatch = useDispatch();
  const { items: notifications, unreadCount, isConnected } = useSelector((state) => state.notifications);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      dispatch(setNotifications(data.notifications || []));
      dispatch(setUnreadCount(data.unread_count || 0));
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  }, [token, dispatch, API_BASE_URL]);

  useEffect(() => {
    if (!token) return;

    // Connect to Socket via Service
    notificationService.connect(token);

    // Subscribe to connection status
    const unsubscribeStatus = notificationService.subscribeStatus((status) => {
      dispatch(setConnected(status));
      // Re-fetch on reconnect to catch missed notifications
      if (status) {
        fetchNotifications();
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

    // Initial fetch
    fetchNotifications();

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
      
      const response = await fetch(`${API_BASE_URL}/api/notifications/${notificationId}/read`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) {
        // If API fails, we might want to revert, but usually fine for notifications
        console.error("Failed to sync markAsRead with server");
      }
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  return {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    refresh: fetchNotifications,
  };
}
