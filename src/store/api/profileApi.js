import { productsApi } from "./productsApi";

// The logged-in user's own profile lives on central-services (same host as
// auth and the sidebar tool switcher), so these endpoints are injected into
// productsApi to reuse its central base URL (NEXT_PUBLIC_LOGIN_BASE_URL) and
// token-refreshing base query. Ported from pyzo-central-frontend's profileApi.ts.
//
// GET /users/me → { data: MyProfile }: user_id, first_name, last_name,
// full_name, email, designation, phone_number, avatar_url (short-lived,
// ready to render; null when unset), role ("admin" | ...), roles, status,
// department, reports_to, tools[{ id, name, mini_icon, ... }], last_active,
// joined_at.
export const profileApi = productsApi.enhanceEndpoints({ addTagTypes: ["MyProfile"] }).injectEndpoints({
  endpoints: (builder) => ({
    getMyProfile: builder.query({
      query: () => "users/me",
      transformResponse: (res) => res.data,
      providesTags: ["MyProfile"],
    }),
    // PATCH body: only changed fields among first_name, last_name,
    // phone_number, avatar_url (null clears phone_number / avatar_url).
    // Returns only the editable fields; the MyProfile refetch brings back the rest.
    updateMyProfile: builder.mutation({
      query: (body) => ({ url: "users/me", method: "PATCH", body }),
      transformResponse: (res) => res.data,
      invalidatesTags: ["MyProfile"],
    }),
    // multipart "file" → { url (durable, send back via PATCH avatar_url), media_url }
    uploadMyAvatar: builder.mutation({
      query: (formData) => ({ url: "users/me/avatar", method: "POST", body: formData }),
      transformResponse: (res) => res.data,
    }),
  }),
});

export const { useGetMyProfileQuery, useUpdateMyProfileMutation, useUploadMyAvatarMutation } = profileApi;
