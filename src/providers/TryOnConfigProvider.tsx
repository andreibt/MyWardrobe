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

type TryOnConfigContextValue = {
  activeConfig: string | null;
  setActiveConfig: (nextConfig: string | null) => void;
  isReady: boolean;
};

const STORAGE_KEY = "mywardrobe.tryOnConfig";
const TryOnConfigContext = createContext<TryOnConfigContextValue | null>(null);

export function TryOnConfigProvider({ children }: { children: ReactNode }) {
  const [activeConfig, setActiveConfigState] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (!isMounted) {
          return;
        }
        setActiveConfigState(value ?? null);
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

  const setActiveConfig = useCallback((nextConfig: string | null) => {
    setActiveConfigState(nextConfig);
    if (nextConfig) {
      AsyncStorage.setItem(STORAGE_KEY, nextConfig).catch(() => {});
    } else {
      AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
    }
  }, []);

  const value = useMemo(
    () => ({
      activeConfig,
      setActiveConfig,
      isReady,
    }),
    [activeConfig, setActiveConfig, isReady]
  );

  return <TryOnConfigContext.Provider value={value}>{children}</TryOnConfigContext.Provider>;
}

export function useTryOnConfig() {
  const context = useContext(TryOnConfigContext);
  if (!context) {
    throw new Error("useTryOnConfig must be used within a TryOnConfigProvider");
  }
  return context;
}
