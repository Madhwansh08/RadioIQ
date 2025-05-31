import { createSlice } from '@reduxjs/toolkit';

const initialState = null;

const xraySlice = createSlice({
  name: 'xray',
  initialState,
  reducers: {
    setXray: (state, action) => action.payload,
  },
});

export const { setXray } = xraySlice.actions;

export default xraySlice.reducer;
