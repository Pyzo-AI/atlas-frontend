import { createSlice } from "@reduxjs/toolkit";

// `status` is null (no error), 403 (access denied), or any other error
// status - ResponsiveContainer picks AccessDeniedState vs ErrorState based
// on which.
const accessDeniedSlice = createSlice({
  name: "accessDenied",
  initialState: { status: null },
  reducers: {
    setApiErrorStatus: (state, action) => {
      state.status = action.payload;
    },
  },
});

export const { setApiErrorStatus } = accessDeniedSlice.actions;
export default accessDeniedSlice.reducer;
