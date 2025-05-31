// src/redux/slices/loaderSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  uploadTotal: 0,
  initialCount: 0,
  progress: 0,
};

const loaderSlice = createSlice({
  name: 'loader',
  initialState,
  reducers: {
    setUploadTotal: (state, action) => {
      state.uploadTotal = action.payload;
    },
    setInitialCount: (state, action) => {
      state.initialCount = action.payload;
    },
    updateProgress: (state, action) => {
      state.progress = action.payload;
    },
    resetLoader: (state) => {
      state.uploadTotal = 0;
      state.initialCount = 0;
      state.progress = 0;
    },
  },
});

export const { setUploadTotal, setInitialCount, updateProgress, resetLoader } = loaderSlice.actions;
export default loaderSlice.reducer;
