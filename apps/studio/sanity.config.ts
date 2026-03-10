import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { schemaTypes } from "./schemaTypes";

export default defineConfig({
  name: "default",
  title: "My App Studio",
  projectId: process.env.SANITY_STUDIO_PROJECT_ID ?? "YOUR_PROJECT_ID",
  dataset: "production",
  plugins: [structureTool()],
  schema: {
    types: schemaTypes,
  },
});
