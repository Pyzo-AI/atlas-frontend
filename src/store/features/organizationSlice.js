import { createSlice } from '@reduxjs/toolkit';
import { organizationsApi } from '../api/organizationsApi';

const initialState = {
  config: null,
  isLoading: false,
  error: null,
};

const organizationSlice = createSlice({
  name: 'organization',
  initialState,
  reducers: {
    setConfig: (state, action) => {
      state.config = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(
      organizationsApi.endpoints.getOrganizationConfig.matchPending,
      (state) => {
        state.isLoading = true;
      }
    );
    builder.addMatcher(
      organizationsApi.endpoints.getOrganizationConfig.matchFulfilled,
      (state, action) => {
        state.isLoading = false;
        state.config = action.payload;
      }
    );
    builder.addMatcher(
      organizationsApi.endpoints.getOrganizationConfig.matchRejected,
      (state, action) => {
        state.isLoading = false;
        state.error = action.error;
      }
    );
  },
});

export const { setConfig } = organizationSlice.actions;
export default organizationSlice.reducer;
