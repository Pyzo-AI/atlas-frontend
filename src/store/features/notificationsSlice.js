import { createSlice } from "@reduxjs/toolkit";

const notificationsSlice = createSlice({
  name: "notifications",
  initialState: {
    items: [],
    unreadCount: 0,
    isConnected: false,
  },
  reducers: {
    setNotifications: (state, action) => {
      state.items = action.payload;
    },
    addNotification: (state, action) => {
      state.items = [action.payload, ...state.items];
      if (!action.payload.is_read) {
        state.unreadCount += 1;
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
  },
});

export const { setNotifications, addNotification, setUnreadCount, markRead, setConnected } = notificationsSlice.actions;

export default notificationsSlice.reducer;
