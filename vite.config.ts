import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: "./" keeps asset paths relative, so the build works on
// GitHub Pages sub-paths (username.github.io/repo) as well as Vercel/Netlify.
export default defineConfig({
  plugins: [react()],
  base: "./",
});
