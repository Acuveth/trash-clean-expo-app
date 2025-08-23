import { configureStore } from "@reduxjs/toolkit";
import cleanupSlice from "./cleanupSlice";
import trashSlice from "./trashSlice";
import leaderboardSlice from "./leaderboardSlice";

export const store = configureStore({
  reducer: {
    trash: trashSlice,
    cleanup: cleanupSlice,
    leaderboard: leaderboardSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["trash/submitTrashReport/fulfilled"],
      },
    }),
});
