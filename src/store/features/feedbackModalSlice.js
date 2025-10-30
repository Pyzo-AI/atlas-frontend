import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isOpen: false,
  presentationId: null,
};

const feedbackModalSlice = createSlice({
  name: 'feedbackModal',
  initialState,
  reducers: {
    showFeedbackModal: (state, action) => {
      const { presentationId } = action.payload;
      state.isOpen = true;
      state.presentationId = presentationId;

      // Persist to localStorage for refresh handling
      if (typeof window !== 'undefined') {
        localStorage.setItem('feedbackModalState', JSON.stringify({
          isOpen: true,
          presentationId,
        }));
      }
    },
    hideFeedbackModal: (state) => {
      state.isOpen = false;
      state.presentationId = null;

      // Clear from localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('feedbackModalState');
      }
    },
    restoreFeedbackModal: (state) => {
      // Restore from localStorage on app initialization
      if (typeof window !== 'undefined') {
        const savedState = localStorage.getItem('feedbackModalState');
        if (savedState) {
          const parsedState = JSON.parse(savedState);
          state.isOpen = parsedState.isOpen;
          state.presentationId = parsedState.presentationId;
        }
      }
    },
  },
});

export const { showFeedbackModal, hideFeedbackModal, restoreFeedbackModal } = feedbackModalSlice.actions;
export default feedbackModalSlice.reducer;