import { createSlice } from '@reduxjs/toolkit';

const initialState = null;

const patientSlice = createSlice({
  name: 'patient',
  initialState,
  reducers: {
    setPatient: (state, action) => action.payload,
  },
});

export const { setPatient } = patientSlice.actions;

export default patientSlice.reducer;
