// src/redux/slices/authSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import config from "../../utils/config";
 
 
const cleanUserData = (user) => {
  if (!user) return null;
  
  const {
    _id,
    name,
    email,
    phoneNumber,
    dob,
    isVerified,
    role,
    accountStatus,
    subscriptionStartDate,
    subscriptionEndDate,
    profilePicture,
    location,
    specialization,
    hospital,
    gender,
  } = user;
 
  return {
    _id,
    name,
    email,
    phoneNumber,
    dob,
    isVerified,
    role,
    accountStatus,
    subscriptionStartDate,
    subscriptionEndDate,
    profilePicture,
    location,
    specialization,
    hospital,
    gender,
  };
};
 
// Utility to load auth state from localStorage
const loadAuthFromLocalStorage = () => {
  try {
    const data = localStorage.getItem("auth");
    return data
      ? JSON.parse(data)
      : { user: null, profilePicture: "", loading: false, error: null };
  } catch (error) {
    console.error("Error loading auth from localStorage:", error);
    return { user: null, profilePicture: "", loading: false, error: null };
  }
};
 
// Utility to save auth state to localStorage
const saveAuthToLocalStorage = (state) => {
  try {
    const cleanedUser = cleanUserData(state.user);
    const profilePicture =
      state.profilePicture || (cleanedUser && cleanedUser.profilePicture) || "";
 
    localStorage.setItem(
      "auth",
      JSON.stringify({ user: cleanedUser, profilePicture })
    );
  } catch (error) {
    console.error("Error saving auth to localStorage:", error);
  }
};
 
// Async thunk for user registration
export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async ({ name, phoneNumber, email, password }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${config.API_URL}/api/auth/secureRegister`,
        { name, phoneNumber, email, password },
        { withCredentials: true }
      );
      return response.data; // e.g., { message: "...", otpToken: "..." }
    } catch (error) {
      console.error("Registration error:", error);
      return rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);
 
// Async thunk for user login
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${config.API_URL}/api/auth/login`,
        { email, password },
        { withCredentials: true }
      );
 
      const cleanedUser = cleanUserData(response.data.user);
      // Server sets JWT as an httpOnly cookie; return user data only.
      return { user: cleanedUser };
    } catch (error) {
      const message =
        error.response?.data?.message || "An unexpected error occurred.";
      return rejectWithValue(message);
    }
  }
);
 
// Async thunk for user logout
export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${config.API_URL}/api/auth/logout`,
        { withCredentials: true }
      );
      return response.data; // e.g., { message: "Logout successful" }
    } catch (error) {
      console.error("Logout error:", error);
      return rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);
 
// Async thunk to fetch (rehydrate) the user profile using the user-auth endpoint
export const fetchUserProfile = createAsyncThunk(
  "auth/fetchUserProfile",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${config.API_URL}/api/auth/user-auth`,
        { withCredentials: true }
      );
      // Expecting response.data: { ok: true, user: { ... } }
      const cleanedUser = cleanUserData(response.data.user);
 
      return cleanedUser;
    } catch (error) {
      console.error("Fetch user profile error:", error);
      return rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);
 
// Async thunk to fetch the profile picture
export const fetchProfilePicture = createAsyncThunk(
  "auth/fetchProfilePicture",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${config.API_URL}/api/auth/get-profile-picture`,
        { withCredentials: true }
      );
      return response.data.profilePicture;
    } catch (error) {
      console.error("Error fetching profile picture:", error);
      return rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);
 
// Initial state: load from localStorage
const initialState = loadAuthFromLocalStorage();
 
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Set the user data manually, if needed.
    setUser(state, action) {
      state.user = action.payload;
      saveAuthToLocalStorage(state);
    },
    // Clear the user state.
    clearUser(state) {
      state.user = null;
      state.profilePicture = "";
      saveAuthToLocalStorage(state);
    },
    // Update parts of the user object.
    updateAuth(state, action) {
      state.user = { ...state.user, ...action.payload };
      if (action.payload.profilePicture) {
        state.profilePicture = action.payload.profilePicture;
      }
      saveAuthToLocalStorage(state);
    },
  },
  extraReducers: (builder) => {
    // Registration
    builder.addCase(registerUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(registerUser.fulfilled, (state) => {
      state.loading = false;
    });
    builder.addCase(registerUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
    // Login
    builder.addCase(loginUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(loginUser.fulfilled, (state, action) => {
      state.loading = false;
      state.user = action.payload.user;
      saveAuthToLocalStorage(state);
    });
    builder.addCase(loginUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
    // Logout
    builder.addCase(logoutUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(logoutUser.fulfilled, (state) => {
      state.loading = false;
      state.user = null;
      state.profilePicture = "";
      saveAuthToLocalStorage(state);
    });
    builder.addCase(logoutUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
    // Fetch user profile (rehydration)
    builder.addCase(fetchUserProfile.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchUserProfile.fulfilled, (state, action) => {
      state.loading = false;
      state.user = action.payload;
     
      if (action.payload && action.payload.profilePicture) {
        state.profilePicture = action.payload.profilePicture;
      }
      saveAuthToLocalStorage(state);
    });
    
    builder.addCase(fetchUserProfile.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
    // Fetch profile picture
    builder.addCase(fetchProfilePicture.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchProfilePicture.fulfilled, (state, action) => {
      state.loading = false;
      state.profilePicture = action.payload;
      saveAuthToLocalStorage(state);
    });
    builder.addCase(fetchProfilePicture.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
  },
});
 
export const { setUser, clearUser, updateAuth } = authSlice.actions;
export default authSlice.reducer;