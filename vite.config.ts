import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// `base: "./"` makes all asset URLs relative, so the production bundle
// works when Electron loads it via a file:// URL (otherwise the HTML
// references /assets/... which fail under file:// and the window is blank).
export default defineConfig({
  plugins: [react()],
  base: "./",
});
