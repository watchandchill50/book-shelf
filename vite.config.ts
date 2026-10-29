import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "/" because the site uses real paths (/articles, /p/…).
export default defineConfig({
  plugins: [react()],
  base: "/",
});
