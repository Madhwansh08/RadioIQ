import { createSlice } from "@reduxjs/toolkit";

const tableSlice = createSlice({
  name: "table",
  initialState: [],
  reducers: {
    setTableData: (state, action) => action.payload, // Overwrite all table data
    addTableData: (state, action) => {
      state.push(action.payload); // Append new row
    },
    updateTableRow: (state, action) => {
      const { index, key, value } = action.payload;
      if (state[index]) {
        state[index][key] = value;
      }
    },
    clearTableData: () => [], // Reset table data to empty array
  },
});

export const { setTableData, addTableData, updateTableRow , clearTableData } = tableSlice.actions;
export default tableSlice.reducer;
