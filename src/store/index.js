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
import { organizationsApi } from "./api/organizationsApi";
import organizationReducer from "./features/organizationSlice";

export const store = configureStore({
  reducer: {
    [questionsApi.reducerPath]: questionsApi.reducer,
    [analyticsApi.reducerPath]: analyticsApi.reducer,
    [liveKitApi.reducerPath]: liveKitApi.reducer,

    [certificatesApi.reducerPath]: certificatesApi.reducer,
    [notificationApi.reducerPath]: notificationApi.reducer,
    [organizationsApi.reducerPath]: organizationsApi.reducer,
    video: videoReducer,
    resultModal: resultModalReducer,
    feedbackModal: feedbackModalReducer,
    image: imageReducer,
    notifications: notificationsReducer,
    organization: organizationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      questionsApi.middleware,
      analyticsApi.middleware,
      liveKitApi.middleware,
      certificatesApi.middleware,
      notificationApi.middleware,
      organizationsApi.middleware
    ),
  devTools: process.env.NODE_ENV !== "production",
});

setupListeners(store.dispatch);

export default store;
