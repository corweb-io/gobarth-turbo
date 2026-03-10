export const colors = {
  // Brand palette
  brand: {
    50: "#eff6ff",
    100: "#dbeafe",
    200: "#bfdbfe",
    300: "#93c5fd",
    400: "#60a5fa",
    500: "#3b82f6",
    600: "#2563eb",
    700: "#1d4ed8",
    800: "#1e40af",
    900: "#1e3a8a",
    950: "#172554",
  },

  // Gray scale
  gray: {
    50: "#f9fafb",
    100: "#f3f4f6",
    200: "#e5e7eb",
    300: "#d1d5db",
    400: "#9ca3af",
    500: "#6b7280",
    600: "#4b5563",
    700: "#374151",
    800: "#1f2937",
    900: "#111827",
    950: "#030712",
  },

  // Semantic colors
  success: {
    light: "#dcfce7",
    DEFAULT: "#22c55e",
    dark: "#15803d",
  },
  warning: {
    light: "#fef9c3",
    DEFAULT: "#eab308",
    dark: "#a16207",
  },
  error: {
    light: "#fee2e2",
    DEFAULT: "#ef4444",
    dark: "#b91c1c",
  },
  info: {
    light: "#dbeafe",
    DEFAULT: "#3b82f6",
    dark: "#1d4ed8",
  },

  // Base
  white: "#ffffff",
  black: "#000000",
  transparent: "transparent",
} as const;

export type Colors = typeof colors;
