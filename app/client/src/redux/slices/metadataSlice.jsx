import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  metadata: null,
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

const metadataSlice = createSlice({
  name: 'metadata',
  initialState,
  reducers: {
    setLoading(state) {
      state.status = 'loading';
      state.error = null;
    },
    setMetadata(state, action) {
      state.metadata = action.payload;
      state.status = 'succeeded';
      state.error = null;
    },
    setError(state, action) {
      state.status = 'failed';
      state.error = action.payload;
    },
    clearMetadata(state) {
      state.metadata = null;
      state.status = 'idle';
      state.error = null;
    },
  },
});

export const { setLoading, setMetadata, setError, clearMetadata } = metadataSlice.actions;

export default metadataSlice.reducer;
