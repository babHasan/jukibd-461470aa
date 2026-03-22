import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ThemeSettings {
  primary_color: string;
  sidebar_bg_color: string;
  page_bg_color: string;
  menu_font_size: number;
  menu_font_color: string;
  submenu_font_size: number;
  submenu_font_color: string;
  table_font_size: number;
  table_font_color: string;
  table_header_bg_color: string;
  table_header_font_color: string;
}

const defaults: ThemeSettings = {
  primary_color: "#1e3a5f",
  sidebar_bg_color: "#0f1c2e",
  page_bg_color: "#f4f6f8",
  menu_font_size: 13,
  menu_font_color: "#94a3b8",
  submenu_font_size: 12,
  submenu_font_color: "#94a3b8",
  table_font_size: 14,
  table_font_color: "#1e293b",
  table_header_bg_color: "#f1f5f9",
  table_header_font_color: "#334155",
};

const ThemeContext = createContext<ThemeSettings>(defaults);

export function useTheme() {
  return useContext(ThemeContext);
}

function hexToHsl(hex: string): string {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex.slice(1, 3), 16);
    g = parseInt(hex.slice(3, 5), 16);
    b = parseInt(hex.slice(5, 7), 16);
  }
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeSettings>(defaults);

  useEffect(() => {
    supabase
      .from("theme_settings")
      .select("*")
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) {
          setTheme({
            primary_color: data.primary_color,
            sidebar_bg_color: data.sidebar_bg_color,
            page_bg_color: data.page_bg_color,
            menu_font_size: data.menu_font_size,
            menu_font_color: data.menu_font_color,
            submenu_font_size: data.submenu_font_size,
            submenu_font_color: data.submenu_font_color,
            table_font_size: data.table_font_size,
            table_font_color: data.table_font_color,
            table_header_bg_color: data.table_header_bg_color,
            table_header_font_color: data.table_header_font_color,
          });
        }
      });
  }, []);

  // Apply CSS variables to document
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--sidebar-background", hexToHsl(theme.sidebar_bg_color));
    root.style.setProperty("--sidebar-foreground", hexToHsl(theme.menu_font_color));
    root.style.setProperty("--primary", hexToHsl(theme.primary_color));
    root.style.setProperty("--background", hexToHsl(theme.page_bg_color));

    // Custom CSS variables for menu/table sizing
    root.style.setProperty("--menu-font-size", `${theme.menu_font_size}px`);
    root.style.setProperty("--menu-font-color", theme.menu_font_color);
    root.style.setProperty("--submenu-font-size", `${theme.submenu_font_size}px`);
    root.style.setProperty("--submenu-font-color", theme.submenu_font_color);
    root.style.setProperty("--table-font-size", `${theme.table_font_size}px`);
    root.style.setProperty("--table-font-color", theme.table_font_color);
    root.style.setProperty("--table-header-bg", theme.table_header_bg_color);
    root.style.setProperty("--table-header-color", theme.table_header_font_color);
  }, [theme]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}
