import AsyncStorage from "@react-native-async-storage/async-storage";

export type AIMode = "local" | "cloud";

export type AISettings = {
  mode: AIMode;
  apiKey: string;
};

const STORAGE_KEY = "mywardrobe.aiSettings";
const DEFAULT_SETTINGS: AISettings = {
  mode: "local",
  apiKey: "",
};

export async function getAISettings(): Promise<AISettings> {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return DEFAULT_SETTINGS;
  }

  try {
    const parsed = JSON.parse(stored) as Partial<AISettings>;
    return {
      mode: parsed.mode === "cloud" ? "cloud" : "local",
      apiKey: typeof parsed.apiKey === "string" ? parsed.apiKey : "",
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveAISettings(settings: AISettings) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
