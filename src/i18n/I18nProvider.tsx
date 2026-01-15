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

const en = require("./translations/en.json") as Record<string, string>;
const ro = require("./translations/ro.json") as Record<string, string>;

type Language = "en" | "ro";
type TranslationParams = Record<string, string | number>;

type I18nContextValue = {
  language: Language;
  setLanguage: (nextLanguage: Language) => void;
  t: (key: string, params?: TranslationParams) => string;
  isReady: boolean;
};

const translations: Record<Language, Record<string, string>> = { en, ro };
const STORAGE_KEY = "mywardrobe.language";

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (!isMounted) {
          return;
        }
        if (value === "en" || value === "ro") {
          setLanguageState(value);
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

  const setLanguage = useCallback((nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    AsyncStorage.setItem(STORAGE_KEY, nextLanguage).catch(() => {});
  }, []);

  const t = useCallback(
    (key: string, params?: TranslationParams) => {
      const base = translations[language][key] ?? translations.en[key] ?? key;
      if (!params) {
        return base;
      }
      return Object.keys(params).reduce((result, paramKey) => {
        const value = String(params[paramKey]);
        return result.replace(new RegExp(`{{${paramKey}}}`, "g"), value);
      }, base);
    },
    [language]
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      isReady,
    }),
    [language, setLanguage, t, isReady]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
