"use client";

export type ThemeMode = "light" | "dark";

export const THEME_STORAGE_KEY = "pms-theme-mode";
export const ACCENT_STORAGE_KEY = "pms-accent-color";
export const DEFAULT_ACCENT_COLOR = "#138a9e";

export const THEME_ACCENT_PRESETS = [
  { label: "Teal", value: "#138a9e" },
  { label: "Ocean", value: "#2563eb" },
  { label: "Emerald", value: "#1f9d69" },
  { label: "Amber", value: "#c9851a" },
  { label: "Rose", value: "#c65652" },
  { label: "Violet", value: "#7c3aed" },
] as const;

type Rgb = {
  r: number;
  g: number;
  b: number;
};

function clampChannel(value: number) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function channelToHex(value: number) {
  return clampChannel(value).toString(16).padStart(2, "0");
}

function hexToRgb(hex: string): Rgb {
  const normalized = normalizeHexColor(hex);
  return {
    r: Number.parseInt(normalized.slice(1, 3), 16),
    g: Number.parseInt(normalized.slice(3, 5), 16),
    b: Number.parseInt(normalized.slice(5, 7), 16),
  };
}

function rgbToHex({ r, g, b }: Rgb) {
  return `#${channelToHex(r)}${channelToHex(g)}${channelToHex(b)}`;
}

function toLinearLuminanceChannel(channel: number) {
  const normalized = channel / 255;
  return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
}

export function normalizeHexColor(value: string | null | undefined) {
  if (!value) {
    return DEFAULT_ACCENT_COLOR;
  }

  const trimmed = value.trim();
  const shortMatch = /^#?([0-9a-fA-F]{3})$/u.exec(trimmed);
  if (shortMatch) {
    const expanded = shortMatch[1]
      .split("")
      .map((character) => `${character}${character}`)
      .join("");
    return `#${expanded.toLowerCase()}`;
  }

  const fullMatch = /^#?([0-9a-fA-F]{6})$/u.exec(trimmed);
  if (fullMatch) {
    return `#${fullMatch[1].toLowerCase()}`;
  }

  return DEFAULT_ACCENT_COLOR;
}

export function mixHexColors(base: string, mixWith: string, mixWeight: number) {
  const baseRgb = hexToRgb(base);
  const mixRgb = hexToRgb(mixWith);

  return rgbToHex({
    r: baseRgb.r * (1 - mixWeight) + mixRgb.r * mixWeight,
    g: baseRgb.g * (1 - mixWeight) + mixRgb.g * mixWeight,
    b: baseRgb.b * (1 - mixWeight) + mixRgb.b * mixWeight,
  });
}

export function getAccessibleTextColor(background: string) {
  const { r, g, b } = hexToRgb(background);
  const luminance =
    0.2126 * toLinearLuminanceChannel(r) +
    0.7152 * toLinearLuminanceChannel(g) +
    0.0722 * toLinearLuminanceChannel(b);

  return luminance > 0.42 ? "#102738" : "#ffffff";
}

export function getStoredThemeMode(): ThemeMode {
  if (typeof window === "undefined") {
    return "light";
  }

  return window.localStorage.getItem(THEME_STORAGE_KEY) === "dark" ? "dark" : "light";
}

export function getStoredAccentColor() {
  if (typeof window === "undefined") {
    return DEFAULT_ACCENT_COLOR;
  }

  return normalizeHexColor(window.localStorage.getItem(ACCENT_STORAGE_KEY));
}

export function buildThemeCssVariables(mode: ThemeMode, accentColor: string) {
  const accent = normalizeHexColor(accentColor);
  const isDark = mode === "dark";
  const surfaceBase = isDark ? "#152634" : "#ffffff";

  return {
    "--brand": accent,
    "--brand-strong": mixHexColors(accent, isDark ? "#f4fbff" : "#102738", isDark ? 0.72 : 0.58),
    "--brand-soft": mixHexColors(accent, surfaceBase, isDark ? 0.84 : 0.82),
    "--brand-soft-strong": mixHexColors(accent, surfaceBase, isDark ? 0.72 : 0.68),
    "--brand-border": mixHexColors(accent, surfaceBase, isDark ? 0.56 : 0.54),
    "--brand-tint": mixHexColors(accent, surfaceBase, isDark ? 0.9 : 0.88),
    "--on-brand": getAccessibleTextColor(accent),
    "--surface-soft": isDark ? "rgba(26, 43, 57, 0.82)" : "rgba(255, 255, 255, 0.72)",
    "--surface-muted": isDark ? "rgba(31, 50, 66, 0.94)" : "rgba(244, 249, 250, 0.96)",
    "--surface-raised": isDark ? "rgba(20, 36, 49, 0.96)" : "rgba(255, 255, 255, 0.96)",
    "--surface-glass": isDark ? "rgba(18, 33, 45, 0.72)" : "rgba(255, 255, 255, 0.60)",
    "--foreground-subtle": isDark ? "#8fa8b7" : "#71879a",
    "--overlay": isDark ? "rgba(4, 10, 16, 0.6)" : "rgba(15, 23, 42, 0.36)",
    "--topbar-start": mixHexColors(accent, isDark ? "#07131b" : "#102738", isDark ? 0.78 : 0.72),
    "--topbar-mid": mixHexColors(accent, isDark ? "#0f1d28" : "#1c4058", isDark ? 0.65 : 0.52),
    "--topbar-end": mixHexColors(accent, isDark ? "#1b3445" : "#edf4f7", isDark ? 0.48 : 0.12),
    "--topbar-border": isDark ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.2)",
    "--header-button-bg": isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.10)",
    "--header-button-border": isDark ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.15)",
    "--header-panel-bg": isDark ? "rgba(19, 33, 45, 0.96)" : "rgba(255, 255, 255, 0.96)",
    "--header-panel-border": isDark ? "rgba(173,208,225,0.14)" : "rgba(214,231,236,0.92)",
    "--header-panel-shadow": isDark ? "0 22px 48px rgba(2, 8, 14, 0.44)" : "0 18px 40px rgba(15, 23, 42, 0.16)",
    "--menu-surface": isDark ? "rgba(18, 33, 45, 0.9)" : "rgba(235, 244, 247, 0.94)",
    "--menu-border": isDark ? "rgba(173, 208, 225, 0.18)" : "rgba(214, 231, 236, 0.92)",
    "--menu-item-bg": isDark ? "rgba(24, 41, 56, 0.9)" : "rgba(255, 255, 255, 0.92)",
    "--menu-item-text": isDark ? "#d4e7f1" : "#5c7386",
    "--menu-item-hover": isDark ? "rgba(27, 50, 67, 1)" : "rgba(255, 255, 255, 1)",
    "--menu-active-start": mixHexColors(accent, isDark ? "#09151f" : "#14324a", isDark ? 0.7 : 0.6),
    "--menu-active-end": mixHexColors(accent, isDark ? "#142a39" : "#1b6d7f", isDark ? 0.45 : 0.2),
    "--chart-grid": isDark ? "rgba(165, 188, 203, 0.18)" : "rgba(16, 32, 51, 0.08)",
    "--chart-axis": isDark ? "#a5bccb" : "#5c7386",
    "--chart-budget": mixHexColors(accent, isDark ? "#f4fbff" : "#102738", isDark ? 0.62 : 0.52),
    "--chart-allocated": isDark ? "#ef9b63" : "#bf5a36",
    "--chart-actual": isDark ? "#e4cf9d" : "#d6c2a4",
    "--success-soft": isDark ? "rgba(88, 194, 141, 0.18)" : "#ecfdf3",
    "--warning-soft": isDark ? "rgba(215, 162, 78, 0.18)" : "#fff7e8",
    "--danger-soft": isDark ? "rgba(223, 124, 120, 0.18)" : "#fff0ef",
  } as const;
}

export function applyThemeSettings(mode: ThemeMode, accentColor: string, persist = true) {
  const accent = normalizeHexColor(accentColor);

  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-theme", mode);
    const variables = buildThemeCssVariables(mode, accent);
    Object.entries(variables).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
  }

  if (persist && typeof window !== "undefined") {
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);
    window.localStorage.setItem(ACCENT_STORAGE_KEY, accent);
  }
}
