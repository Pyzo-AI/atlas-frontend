import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { questionsApi } from './api/questionsApi';
import { analyticsApi } from './api/analyticsApi';
import videoReducer from './features/videoSlice';
import resultModalReducer from './features/resultModalSlice';
import feedbackModalReducer from './features/feedbackModalSlice';
import imageReducer from './features/imageSlice';

export const store = configureStore({
  reducer: {
    [questionsApi.reducerPath]: questionsApi.reducer,
    [analyticsApi.reducerPath]: analyticsApi.reducer,
    video: videoReducer,
    resultModal: resultModalReducer,
    feedbackModal: feedbackModalReducer,
    image: imageReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(questionsApi.middleware, analyticsApi.middleware),
  devTools: process.env.NODE_ENV !== 'production',
});

setupListeners(store.dispatch);

export default store;
