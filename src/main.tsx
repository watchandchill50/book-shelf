import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";
import { Analytics } from "@vercel/analytics/next"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
          <Analytics />

  </StrictMode>,
);
