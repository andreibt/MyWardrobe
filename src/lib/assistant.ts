import { Platform } from "react-native";

import { getAISettings } from "./aiSettings";

const LOCAL_GENERATE_API_URL = "http://localhost:11434/api/generate";
const CLOUD_GENERATE_API_URL = "https://ollama.com/api/generate";
const LOCAL_CHAT_API_URL = "http://localhost:11434/api/chat";
const CLOUD_CHAT_API_URL = "https://ollama.com/api/chat";
const LOCAL_ASSISTANT_MODEL = "gemma4";
const CLOUD_ASSISTANT_MODEL = "gpt-oss:120b";
const LOCAL_CLOUD_ASSISTANT_MODEL = "gpt-oss:120b-cloud";
const LOCAL_VISION_MODEL = "qwen3-vl:8b";
const CLOUD_VISION_MODEL = "qwen3-vl:235b-cloud";

type OllamaChunk = {
  response?: string;
  message?: {
    content?: string;
  };
  error?: string;
};

type AssistantPromptOptions = {
  images?: string[];
};

type AssistantRequestContext = {
  apiKey: string;
  hasImages: boolean;
  images: string[];
  isCloud: boolean;
  prompt: string;
  useLocalCloudBridge: boolean;
};

export async function sendAssistantPrompt(
  prompt: string,
  options: AssistantPromptOptions = {}
) {
  const settings = await getAISettings();
  const isCloud = settings.mode === "cloud";
  const useLocalCloudBridge = isCloud && Platform.OS === "web";
  const images = options.images?.map(stripDataUrlPrefix) ?? [];
  const hasImages = images.length > 0;

  if (isCloud && !useLocalCloudBridge && !settings.apiKey.trim()) {
    throw new Error("Ollama cloud API key is missing.");
  }

  const context = {
    apiKey: settings.apiKey.trim(),
    hasImages,
    images,
    isCloud,
    prompt,
    useLocalCloudBridge,
  };
  const response = await fetch(getEndpoint(context), getRequestOptions(context));

  const body = await response.text();
  if (!response.ok) {
    throw new Error(body || `Assistant request failed with status ${response.status}`);
  }

  return parseOllamaResponse(body, hasImages);
}

function getRequestOptions(context: AssistantRequestContext) {
  return {
    method: "POST",
    headers: getHeaders(context),
    body: JSON.stringify(getRequestBody(context)),
  };
}

function getHeaders({ apiKey, isCloud, useLocalCloudBridge }: AssistantRequestContext) {
  return {
    "Content-Type": "application/json",
    ...(isCloud && !useLocalCloudBridge ? { Authorization: `Bearer ${apiKey}` } : {}),
  };
}

function getRequestBody(context: AssistantRequestContext) {
  if (context.hasImages) {
    return {
      model: getVisionModel(context),
      messages: [{ role: "user", content: context.prompt, images: context.images }],
      stream: false,
    };
  }

  return {
    model: getTextModel(context),
    prompt: context.prompt,
    stream: false,
  };
}

function getVisionModel({ isCloud }: AssistantRequestContext) {
  return isCloud ? CLOUD_VISION_MODEL : LOCAL_VISION_MODEL;
}

function getTextModel({ isCloud, useLocalCloudBridge }: AssistantRequestContext) {
  if (useLocalCloudBridge) {
    return LOCAL_CLOUD_ASSISTANT_MODEL;
  }
  return isCloud ? CLOUD_ASSISTANT_MODEL : LOCAL_ASSISTANT_MODEL;
}

function getEndpoint({
  hasImages,
  isCloud,
  useLocalCloudBridge,
}: {
  hasImages: boolean;
  isCloud: boolean;
  useLocalCloudBridge: boolean;
}) {
  if (hasImages) {
    return isCloud && !useLocalCloudBridge ? CLOUD_CHAT_API_URL : LOCAL_CHAT_API_URL;
  }
  return isCloud && !useLocalCloudBridge ? CLOUD_GENERATE_API_URL : LOCAL_GENERATE_API_URL;
}

function stripDataUrlPrefix(image: string) {
  return image.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, "");
}

function parseOllamaResponse(body: string, isChat: boolean) {
  const chunks = body
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as OllamaChunk);

  const error = chunks.find((chunk) => chunk.error)?.error;
  if (error) {
    throw new Error(error);
  }

  const answer = chunks
    .map((chunk) => (isChat ? chunk.message?.content : chunk.response) ?? "")
    .join("")
    .trim();
  if (!answer) {
    throw new Error("Assistant returned an empty response.");
  }

  return answer;
}
