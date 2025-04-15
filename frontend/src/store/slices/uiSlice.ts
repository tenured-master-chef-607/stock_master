import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  dismissed: boolean;
}

interface UiState {
  darkMode: boolean;
  sidebarCollapsed: boolean;
  currentPage: 'dashboard' | 'screener' | 'technical' | 'settings';
  notifications: Notification[];
}

const initialState: UiState = {
  darkMode: localStorage.getItem('darkMode') === 'true',
  sidebarCollapsed: localStorage.getItem('sidebarCollapsed') === 'true',
  currentPage: 'dashboard',
  notifications: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleDarkMode: (state: UiState) => {
      state.darkMode = !state.darkMode;
      localStorage.setItem('darkMode', String(state.darkMode));
    },
    toggleSidebar: (state: UiState) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
      localStorage.setItem('sidebarCollapsed', String(state.sidebarCollapsed));
    },
    setCurrentPage: (state: UiState, action: PayloadAction<UiState['currentPage']>) => {
      state.currentPage = action.payload;
    },
    addNotification: (state: UiState, action: PayloadAction<Omit<Notification, 'id' | 'dismissed'>>) => {
      const id = Date.now().toString();
      state.notifications.push({
        id,
        ...action.payload,
        dismissed: false,
      });
    },
    dismissNotification: (state: UiState, action: PayloadAction<string>) => {
      const notification = state.notifications.find((n: Notification) => n.id === action.payload);
      if (notification) {
        notification.dismissed = true;
      }
    },
    clearNotifications: (state: UiState) => {
      state.notifications = state.notifications.filter((n: Notification) => !n.dismissed);
    },
  },
});

export const {
  toggleDarkMode,
  toggleSidebar,
  setCurrentPage,
  addNotification,
  dismissNotification,
  clearNotifications,
} = uiSlice.actions;

export default uiSlice.reducer; 