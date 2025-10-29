import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { questionsApi } from './api/questionsApi';
import videoReducer from './features/videoSlice';
import resultModalReducer from './features/resultModalSlice';
import feedbackModalReducer from './features/feedbackModalSlice';

export const store = configureStore({
  reducer: {
    [questionsApi.reducerPath]: questionsApi.reducer,
    video: videoReducer,
    resultModal: resultModalReducer,
    feedbackModal: feedbackModalReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(questionsApi.middleware),
  devTools: process.env.NODE_ENV !== 'production',
});

setupListeners(store.dispatch);

export default store;
