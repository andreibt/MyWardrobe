import { getAISettings } from "./aiSettings";
import { Platform } from "react-native";

const LOCAL_ASSISTANT_API_URL = "http://localhost:11434/api/generate";
const CLOUD_ASSISTANT_API_URL = "https://ollama.com/api/generate";
const LOCAL_ASSISTANT_MODEL = "gemma4";
const CLOUD_ASSISTANT_MODEL = "gpt-oss:120b";
const LOCAL_CLOUD_ASSISTANT_MODEL = "gpt-oss:120b-cloud";

type OllamaGenerateChunk = {
  response?: string;
  error?: string;
};

export async function sendAssistantPrompt(prompt: string) {
  const settings = await getAISettings();
  const isCloud = settings.mode === "cloud";
  const useLocalCloudBridge = isCloud && Platform.OS === "web";
  if (isCloud && !useLocalCloudBridge && !settings.apiKey.trim()) {
    throw new Error("Ollama cloud API key is missing.");
  }

  const response = await fetch(isCloud && !useLocalCloudBridge ? CLOUD_ASSISTANT_API_URL : LOCAL_ASSISTANT_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(isCloud && !useLocalCloudBridge
        ? { Authorization: `Bearer ${settings.apiKey.trim()}` }
        : {}),
    },
    body: JSON.stringify({
      model: useLocalCloudBridge
        ? LOCAL_CLOUD_ASSISTANT_MODEL
        : isCloud
          ? CLOUD_ASSISTANT_MODEL
          : LOCAL_ASSISTANT_MODEL,
      prompt,
      stream: false,
    }),
  });

  const body = await response.text();

  if (!response.ok) {
    throw new Error(body || `Assistant request failed with status ${response.status}`);
  }

  return parseOllamaResponse(body);
}

function parseOllamaResponse(body: string) {
  const chunks = body
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as OllamaGenerateChunk);

  const error = chunks.find((chunk) => chunk.error)?.error;
  if (error) {
    throw new Error(error);
  }

  const answer = chunks.map((chunk) => chunk.response ?? "").join("").trim();
  if (!answer) {
    throw new Error("Assistant returned an empty response.");
  }

  return answer;
}
