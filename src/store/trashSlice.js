import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "../utils/apiClient";

export const fetchTrashReports = createAsyncThunk(
  "trash/fetchReports",
  async () => {
    return await apiClient.get("/trash/reports");
  }
);

export const submitTrashReport = createAsyncThunk(
  "trash/submitReport",
  async (reportData) => {
    const formData = new FormData();

    formData.append("photo", {
      uri: reportData.photo.uri,
      type: "image/jpeg",
      name: "photo.jpg",
    });

    formData.append("latitude", reportData.location.latitude.toString());
    formData.append("longitude", reportData.location.longitude.toString());
    formData.append("description", reportData.description);
    formData.append("trashType", reportData.trashType);
    formData.append("size", reportData.size);
    formData.append("timestamp", reportData.timestamp);

    return await apiClient.upload("/trash/report", formData);
  }
);

const trashSlice = createSlice({
  name: "trash",
  initialState: {
    reports: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTrashReports.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTrashReports.fulfilled, (state, action) => {
        state.loading = false;
        state.reports = action.payload;
      })
      .addCase(fetchTrashReports.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(submitTrashReport.fulfilled, (state, action) => {
        state.reports.push(action.payload);
      });
  },
});

export const { clearError } = trashSlice.actions;
export default trashSlice.reducer;
