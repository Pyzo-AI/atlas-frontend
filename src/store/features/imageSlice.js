import { createSlice } from '@reduxjs/toolkit';

const imageSlice = createSlice({
  name: 'image',
  initialState: {
    overlayImageUrl: null,
    isImageVisible: false,
    isImageLoading: false,
  },
  reducers: {
    setImageLoading: (state, action) => {
      state.isImageLoading = action.payload;
    },
    setOverlayImage: (state, action) => {
      state.overlayImageUrl = action.payload;
      state.isImageVisible = true;
      state.isImageLoading = false;
    },
    hideOverlayImage: (state) => {
      state.isImageVisible = false;
    },
    clearOverlayImage: (state) => {
      state.overlayImageUrl = null;
      state.isImageVisible = false;
      state.isImageLoading = false;
    },
  },
});

export const { setImageLoading, setOverlayImage, hideOverlayImage, clearOverlayImage } = imageSlice.actions;
export default imageSlice.reducer;