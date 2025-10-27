import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isOpen: false,
  score: null,
  presentationId: null,
  assessmentId: null,
  totalQuestions: null,
  correctAnswers: null,
};

const resultModalSlice = createSlice({
  name: 'resultModal',
  initialState,
  reducers: {
    showResultModal: (state, action) => {
      const { score, presentationId, assessmentId, totalQuestions, correctAnswers } = action.payload;
      state.isOpen = true;
      state.score = score;
      state.presentationId = presentationId;
      state.assessmentId = assessmentId;
      state.totalQuestions = totalQuestions;
      state.correctAnswers = correctAnswers;

      // Persist to localStorage for refresh handling
      if (typeof window !== 'undefined') {
        localStorage.setItem('resultModalState', JSON.stringify({
          isOpen: true,
          score,
          presentationId,
          assessmentId,
          totalQuestions,
          correctAnswers,
        }));
      }
    },
    hideResultModal: (state) => {
      state.isOpen = false;
      state.score = null;
      state.presentationId = null;
      state.assessmentId = null;
      state.totalQuestions = null;
      state.correctAnswers = null;

      // Clear from localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('resultModalState');
      }
    },
    restoreResultModal: (state) => {
      // Restore from localStorage on app initialization
      if (typeof window !== 'undefined') {
        const savedState = localStorage.getItem('resultModalState');
        if (savedState) {
          const parsedState = JSON.parse(savedState);
          state.isOpen = parsedState.isOpen;
          state.score = parsedState.score;
          state.presentationId = parsedState.presentationId;
          state.assessmentId = parsedState.assessmentId;
          state.totalQuestions = parsedState.totalQuestions;
          state.correctAnswers = parsedState.correctAnswers;
        }
      }
    },
  },
});

export const { showResultModal, hideResultModal, restoreResultModal } = resultModalSlice.actions;
export default resultModalSlice.reducer;