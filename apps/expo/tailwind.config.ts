import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{ts,tsx}",
    "../../packages/ui-native/src/**/*.{ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
};

export default config;
