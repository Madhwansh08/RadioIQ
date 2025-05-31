import { createSlice } from "@reduxjs/toolkit";

// Default to dark theme if no theme is set in localStorage
const initialState = localStorage.getItem("theme") || "dark";

// Ensure the theme is applied to the DOM on load
if (initialState === "dark") {
  document.documentElement.classList.add("dark");
} else {
  document.documentElement.classList.remove("dark");
}

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    toggleTheme: (state) => {
      const newTheme = state === "dark" ? "light" : "dark";
      localStorage.setItem("theme", newTheme); // Persist theme in localStorage
      // Apply the theme to the HTML root element
      if (newTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      return newTheme;
    },
    setTheme: (state, action) => {
      const newTheme = action.payload || "dark"; // Ensure fallback to dark
      localStorage.setItem("theme", newTheme);
      // Apply the theme to the HTML root element
      if (newTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      return newTheme;
    },
  },
});

export const { toggleTheme, setTheme } = themeSlice.actions;
export default themeSlice.reducer;
