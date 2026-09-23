import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { questionsApi } from "./api/questionsApi";
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
import { productsApi } from "./api/productsApi";
import accessDeniedReducer from "./features/accessDeniedSlice";

export const store = configureStore({
  reducer: {
    [questionsApi.reducerPath]: questionsApi.reducer,
    [liveKitApi.reducerPath]: liveKitApi.reducer,

    [certificatesApi.reducerPath]: certificatesApi.reducer,
    [notificationApi.reducerPath]: notificationApi.reducer,
    [organizationsApi.reducerPath]: organizationsApi.reducer,
    [productsApi.reducerPath]: productsApi.reducer,
    video: videoReducer,
    resultModal: resultModalReducer,
    feedbackModal: feedbackModalReducer,
    image: imageReducer,
    notifications: notificationsReducer,
    organization: organizationReducer,
    accessDenied: accessDeniedReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      questionsApi.middleware,
      liveKitApi.middleware,
      certificatesApi.middleware,
      notificationApi.middleware,
      organizationsApi.middleware,
      productsApi.middleware
    ),
  devTools: process.env.NODE_ENV !== "production",
});

setupListeners(store.dispatch);

export default store;
