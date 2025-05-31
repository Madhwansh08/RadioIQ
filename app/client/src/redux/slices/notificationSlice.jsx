import { createSlice } from '@reduxjs/toolkit';

const loadNotifications = () => {
  try {
    const saved = localStorage.getItem('notifications');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const initialState = {
  notifications: loadNotifications(),
};

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    addNotification: (state, action) => {
      const newNotifications = [action.payload, ...state.notifications].slice(0, 50);
      state.notifications = newNotifications;
      localStorage.setItem('notifications', JSON.stringify(newNotifications));
    },
    removeNotification: (state, action) => {
      const filtered = state.notifications.filter(
        (notification) => notification.id !== action.payload
      );
      state.notifications = filtered;
      localStorage.setItem('notifications', JSON.stringify(filtered));
    },
    clearNotifications: (state) => {
      state.notifications = [];
      localStorage.removeItem('notifications');
    },
  },
});

export const { addNotification, removeNotification, clearNotifications } = notificationSlice.actions;
export default notificationSlice.reducer;