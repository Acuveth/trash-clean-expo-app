import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "../utils/apiClient";

export const fetchNearbyTrash = createAsyncThunk(
  "cleanup/fetchNearbyTrash",
  async (location) => {
    return await apiClient.get("/cleanup/nearby", {
      lat: location.latitude,
      lng: location.longitude
    });
  }
);

export const startCleanupSession = createAsyncThunk(
  "cleanup/startSession",
  async (sessionData) => {
    return await apiClient.post("/cleanup/start", sessionData);
  }
);

const cleanupSlice = createSlice({
  name: "cleanup",
  initialState: {
    nearbyTrash: [],
    activeSession: null,
    verificationResult: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearActiveSession: (state) => {
      state.activeSession = null;
      state.verificationResult = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNearbyTrash.fulfilled, (state, action) => {
        state.nearbyTrash = action.payload;
      })
      .addCase(startCleanupSession.fulfilled, (state, action) => {
        state.activeSession = action.payload;
      });
  },
});

export const { clearActiveSession } = cleanupSlice.actions;
export default cleanupSlice.reducer;
