import { useEffect, useState } from "react";

type Theme = "light" | "dark";
const KEY = "book-shelf-theme";

function systemTheme(): Theme {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function saved(): Theme | null {
  try {
    const t = localStorage.getItem(KEY);
    return t === "light" || t === "dark" ? t : null;
  } catch {
    return null;
  }
}

/** Follows the system setting until the visitor picks one with the toggle. */
export function useTheme() {
  const [choice, setChoice] = useState<Theme | null>(saved);
  const [system, setSystem] = useState<Theme>(systemTheme);

  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    const on = () => setSystem(mq.matches ? "dark" : "light");
    mq?.addEventListener("change", on);
    return () => mq?.removeEventListener("change", on);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (choice) root.dataset.theme = choice;
    else delete root.dataset.theme;
  }, [choice]);

  const theme = choice ?? system;
  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setChoice(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* ignore */
    }
  };
  return { theme, toggle };
}
