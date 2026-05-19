import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { questionsApi } from "./api/questionsApi";
import { analyticsApi } from "./api/analyticsApi";
import { liveKitApi } from "./api/liveKitApi";

import { certificatesApi } from "./api/certificatesApi";
import { notificationApi } from "./api/notificationApi";
import videoReducer from "./features/videoSlice";
import resultModalReducer from "./features/resultModalSlice";
import feedbackModalReducer from "./features/feedbackModalSlice";
import imageReducer from "./features/imageSlice";
import notificationsReducer from "./features/notificationsSlice";

export const store = configureStore({
  reducer: {
    [questionsApi.reducerPath]: questionsApi.reducer,
    [analyticsApi.reducerPath]: analyticsApi.reducer,
    [liveKitApi.reducerPath]: liveKitApi.reducer,

    [certificatesApi.reducerPath]: certificatesApi.reducer,
    [notificationApi.reducerPath]: notificationApi.reducer,
    video: videoReducer,
    resultModal: resultModalReducer,
    feedbackModal: feedbackModalReducer,
    image: imageReducer,
    notifications: notificationsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      questionsApi.middleware,
      analyticsApi.middleware,
      liveKitApi.middleware,
      certificatesApi.middleware,
      notificationApi.middleware
    ),
  devTools: process.env.NODE_ENV !== "production",
});

setupListeners(store.dispatch);

export default store;
