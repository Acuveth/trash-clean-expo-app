import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "../utils/apiClient";

// Fetch global leaderboard
export const fetchGlobalLeaderboard = createAsyncThunk(
  "leaderboard/fetchGlobal",
  async ({ period = 'all', limit = 50 } = {}) => {
    const response = await apiClient.get("/leaderboard/global", { period, limit });
    console.log('🔍 fetchGlobalLeaderboard response:', response);
    console.log('🔍 response.data length:', response.data?.length || 0);
    const result = { data: response.data || [], period };
    console.log('🔍 returning:', result);
    return result;
  }
);

// Fetch friends leaderboard
export const fetchFriendsLeaderboard = createAsyncThunk(
  "leaderboard/fetchFriends",
  async ({ period = 'all', limit = 50 } = {}) => {
    const response = await apiClient.get("/leaderboard/friends", { period, limit });
    return { data: response.data || [], period };
  }
);

// Fetch user's rank and stats
export const fetchUserRank = createAsyncThunk(
  "leaderboard/fetchUserRank",
  async ({ period = 'all' } = {}, { rejectWithValue }) => {
    try {
      const response = await apiClient.get("/leaderboard/my-rank", { period });
      
      // Handle the structured API response
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      // Return a fallback response if the API fails
      console.warn('Failed to fetch user rank, using fallback:', error);
      return rejectWithValue({
        id: null,
        name: null,
        points: 0,
        totalCleanups: 0,
        totalReports: 0,
        globalRank: null,
        level: "Eco Beginner",
        levelTier: 1,
        levelColor: "#EF476F",
        streakDays: 0,
        error: true,
        fallback: true
      });
    }
  }
);

// Fetch weekly/monthly achievements
export const fetchLeaderboardAchievements = createAsyncThunk(
  "leaderboard/fetchAchievements",
  async () => {
    return await apiClient.get("/leaderboard/achievements");
  }
);

const leaderboardSlice = createSlice({
  name: "leaderboard",
  initialState: {
    globalLeaderboard: [],
    friendsLeaderboard: [],
    userRank: null,
    achievements: [],
    currentPeriod: 'all', // 'all', 'monthly', 'weekly'
    currentView: 'global', // 'global', 'friends'
    loading: {
      global: false,
      friends: false,
      rank: false,
      achievements: false,
    },
    error: null,
    lastUpdated: null,
  },
  reducers: {
    setPeriod: (state, action) => {
      state.currentPeriod = action.payload;
    },
    setView: (state, action) => {
      state.currentView = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    resetLeaderboard: (state) => {
      state.globalLeaderboard = [];
      state.friendsLeaderboard = [];
      state.userRank = null;
      state.achievements = [];
      state.error = null;
      state.lastUpdated = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Global leaderboard
      .addCase(fetchGlobalLeaderboard.pending, (state) => {
        state.loading.global = true;
        state.error = null;
      })
      .addCase(fetchGlobalLeaderboard.fulfilled, (state, action) => {
        state.loading.global = false;
        console.log('🔍 fetchGlobalLeaderboard fulfilled - action.payload:', action.payload);
        console.log('🔍 action.payload.data length:', action.payload.data?.length || 0);
        state.globalLeaderboard = action.payload.data;
        console.log('🔍 state.globalLeaderboard after update length:', state.globalLeaderboard?.length || 0);
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchGlobalLeaderboard.rejected, (state, action) => {
        state.loading.global = false;
        state.error = action.error.message;
      })
      
      // Friends leaderboard
      .addCase(fetchFriendsLeaderboard.pending, (state) => {
        state.loading.friends = true;
        state.error = null;
      })
      .addCase(fetchFriendsLeaderboard.fulfilled, (state, action) => {
        state.loading.friends = false;
        state.friendsLeaderboard = action.payload.data;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchFriendsLeaderboard.rejected, (state, action) => {
        state.loading.friends = false;
        state.error = action.error.message;
      })
      
      // User rank
      .addCase(fetchUserRank.pending, (state) => {
        state.loading.rank = true;
        state.error = null;
      })
      .addCase(fetchUserRank.fulfilled, (state, action) => {
        state.loading.rank = false;
        state.userRank = action.payload;
      })
      .addCase(fetchUserRank.rejected, (state, action) => {
        state.loading.rank = false;
        // If we have fallback data, use it instead of showing an error
        if (action.payload && action.payload.fallback) {
          state.userRank = action.payload;
          console.log('Using fallback user rank data');
        } else {
          state.error = action.error.message;
        }
      })
      
      // Achievements
      .addCase(fetchLeaderboardAchievements.pending, (state) => {
        state.loading.achievements = true;
        state.error = null;
      })
      .addCase(fetchLeaderboardAchievements.fulfilled, (state, action) => {
        state.loading.achievements = false;
        state.achievements = action.payload.achievements || [];
      })
      .addCase(fetchLeaderboardAchievements.rejected, (state, action) => {
        state.loading.achievements = false;
        state.error = action.error.message;
      });
  },
});

export const { setPeriod, setView, clearError, resetLeaderboard } = leaderboardSlice.actions;
export default leaderboardSlice.reducer;