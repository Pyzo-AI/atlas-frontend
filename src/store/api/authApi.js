import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const LOGIN_BASE_URL = process.env.NEXT_PUBLIC_LOGIN_BASE_URL;

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers) => {
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: `${LOGIN_BASE_URL}/auth/login`,
        method: "POST",
        body: { username: credentials.email, password: credentials.password },
      }),
    }),
    forgotPassword: builder.mutation({
      query: (body) => ({
        url: "api/users/forgot-password",
        method: "POST",
        body: { ...body, is_user_app: true },
      }),
    }),
    resetPassword: builder.mutation({
      query: (body) => ({
        url: "api/users/reset-password",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const { useLoginMutation, useForgotPasswordMutation, useResetPasswordMutation } = authApi;
