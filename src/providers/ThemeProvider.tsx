import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ThemeMode = "light" | "dark";

export type AppTheme = {
  mode: ThemeMode;
  isDark: boolean;
  colors: {
    background: string;
    surface: string;
    surface2: string;
    surface3: string;
    card: string;
    primary: string;
    accent: string;
    text: string;
    textMuted: string;
    muted: string;
    border: string;
    danger: string;
    shadow: string;
    logoBackground: string;
    logoTint: string;
  };
};

type ThemeContextValue = {
  mode: ThemeMode;
  theme: AppTheme;
  setMode: (nextMode: ThemeMode) => void;
  toggleMode: () => void;
  isReady: boolean;
};

const STORAGE_KEY = "polarnest.theme";

const themes: Record<ThemeMode, AppTheme> = {
  dark: {
    mode: "dark",
    isDark: true,
    colors: {
      background: "#08090E",
      surface: "#111318",
      surface2: "#1A1D23",
      surface3: "#242830",
      card: "#1E293B",
      primary: "#00D4FF",
      accent: "#00E676",
      text: "#F0F2F5",
      textMuted: "#8B8FA3",
      muted: "#5A5E6E",
      border: "#2A2E38",
      danger: "#FF4757",
      shadow: "#00D4FF",
      logoBackground: "#111318",
      logoTint: "#08090E",
    },
  },
  light: {
    mode: "light",
    isDark: false,
    colors: {
      background: "#F5F7FA",
      surface: "#ECEEF1",
      surface2: "#FFFFFF",
      surface3: "#E7E9EC",
      card: "#ECEEF1",
      primary: "#161B22",
      accent: "#0F9F61",
      text: "#0D1117",
      textMuted: "#5E6166",
      muted: "#8D9094",
      border: "#D2D5D8",
      danger: "#D9363D",
      shadow: "#161B22",
      logoBackground: "#161B22",
      logoTint: "#F5F7FA",
    },
  },
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("dark");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (!isMounted) {
          return;
        }
        if (value === "light" || value === "dark") {
          setModeState(value);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsReady(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const setMode = useCallback((nextMode: ThemeMode) => {
    setModeState(nextMode);
    AsyncStorage.setItem(STORAGE_KEY, nextMode).catch(() => {});
  }, []);

  const toggleMode = useCallback(() => {
    setModeState((currentMode) => {
      const nextMode = currentMode === "dark" ? "light" : "dark";
      AsyncStorage.setItem(STORAGE_KEY, nextMode).catch(() => {});
      return nextMode;
    });
  }, []);

  const value = useMemo(
    () => ({
      mode,
      theme: themes[mode],
      setMode,
      toggleMode,
      isReady,
    }),
    [isReady, mode, setMode, toggleMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
