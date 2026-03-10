import { createSlice } from "@reduxjs/toolkit";

const notificationsSlice = createSlice({
  name: "notifications",
  initialState: {
    items: [],
    unreadCount: 0,
    isConnected: false,
    total: 0,
    page: 1,
    hasMore: true,
    loading: false,
  },
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setNotifications: (state, action) => {
      const { notifications, total, page, unread_count } = action.payload;
      state.loading = false;
      if (page === 1) {
        state.items = notifications || [];
      } else {
        // Filter out duplicates if any
        const newItemIds = new Set(notifications.map(n => n.id));
        state.items = [
          ...state.items.filter(n => !newItemIds.has(n.id)),
          ...(notifications || [])
        ];
      }
      state.total = total || 0;
      state.page = page || 1;
      state.unreadCount = unread_count !== undefined ? unread_count : state.unreadCount;
      state.hasMore = state.items.length < state.total;
    },
    addNotification: (state, action) => {
      const exists = state.items.some(n => n.id === action.payload.id);
      if (!exists) {
        state.items = [action.payload, ...state.items];
        state.total += 1;
        if (!action.payload.is_read) {
          state.unreadCount += 1;
        }
      }
    },
    setUnreadCount: (state, action) => {
      state.unreadCount = action.payload;
    },
    markRead: (state, action) => {
      const id = action.payload;
      const notification = state.items.find((n) => n.id === id);
      if (notification && !notification.is_read) {
        notification.is_read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    setConnected: (state, action) => {
      state.isConnected = action.payload;
    },
    resetPagination: (state) => {
      state.page = 1;
      state.hasMore = true;
    }
  },
});

export const { 
  setNotifications, 
  addNotification, 
  setUnreadCount, 
  markRead, 
  setConnected,
  resetPagination,
  setLoading
} = notificationsSlice.actions;

export default notificationsSlice.reducer;
