import { useState, useEffect } from "react";

export type Theme = "dark" | "light";

function getStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem("seo-theme") as Theme | null;
    return stored === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove("dark", "light");
  root.classList.add(theme);
  try {
    localStorage.setItem("seo-theme", theme);
  } catch {
    // ignore
  }
}

export function useLocalTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const t = getStoredTheme();
    // Apply immediately so there's no flash
    if (typeof document !== "undefined") applyTheme(t);
    return t;
  });

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  return { theme, toggleTheme };
}
