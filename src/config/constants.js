import { Platform } from "react-native";
import { getAPIEndpoint } from "./secrets";

// API Configuration
export const API_BASE_URL = getAPIEndpoint();

// App Configuration
export const APP_NAME = "Trash Clean";
export const APP_VERSION = "1.0.0";

// Location Configuration
export const LOCATION_ACCURACY = {
  LOW: 1,
  BALANCED: 2,
  HIGH: 3,
  BEST: 4,
};

// Points System
export const POINTS_SYSTEM = {
  SMALL_TRASH: 10,
  MEDIUM_TRASH: 20,
  LARGE_TRASH: 30,
  VERY_LARGE_TRASH: 50,
  HAZARDOUS_TRASH: 100,
};

// Map Configuration
export const MAP_DEFAULTS = {
  LATITUDE_DELTA: 0.01,
  LONGITUDE_DELTA: 0.01,
  NEARBY_RADIUS: 5000, // 5km in meters
};

// Image Configuration
export const IMAGE_CONFIG = {
  QUALITY: 0.8,
  MAX_WIDTH: 2000,
  MAX_HEIGHT: 2000,
  ALLOW_EDITING: true,
};

// Enhanced Dark Mode Colors
export const COLORS = {
  // Primary colors with better contrast
  PRIMARY: "#00C853", // Darker green
  PRIMARY_DARK: "#00A152", // Even darker green for pressed states
  PRIMARY_LIGHT: "#69F0AE", // Lighter green for highlights
  SECONDARY: "#1E88E5", // Blue
  ACCENT: "#FF6B35", // Orange accent
  
  // Status colors
  SUCCESS: "#4CAF50",
  WARNING: "#FFA726",
  ERROR: "#EF5350",
  INFO: "#42A5F5",
  
  // Enhanced dark theme colors
  BACKGROUND: "#0A0A0A", // Deeper black for better contrast
  BACKGROUND_SECONDARY: "#121212", // Secondary background
  SURFACE: "#1C1C1C", // Cards, components
  SURFACE_VARIANT: "#2A2A2A", // Elevated surfaces
  SURFACE_HIGH: "#333333", // Highest elevation
  
  // Text colors with better hierarchy
  TEXT_PRIMARY: "#FFFFFF", // Main text
  TEXT_SECONDARY: "#CCCCCC", // Secondary text (improved readability)
  TEXT_TERTIARY: "#999999", // Tertiary text
  TEXT_DISABLED: "#666666", // Disabled text
  
  // Interactive elements
  DIVIDER: "#333333",
  BORDER: "#404040",
  BORDER_LIGHT: "#555555",
  
  // Gradients for visual appeal
  GRADIENT_PRIMARY: ["#00C853", "#00A152"],
  GRADIENT_SURFACE: ["#1C1C1C", "#2A2A2A"],
  GRADIENT_BACKGROUND: ["#0A0A0A", "#1C1C1C"],
  
  // Special colors
  OVERLAY: "rgba(0, 0, 0, 0.7)",
  SHADOW: "rgba(0, 0, 0, 0.5)",
  
  // Legacy (for backwards compatibility)
  LIGHT: "#F8F9FA",
  DARK: "#0A0A0A",
};
