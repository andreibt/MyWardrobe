const ASSISTANT_API_URL = "http://localhost:11434/api/generate";
const ASSISTANT_MODEL = "gemma4";

type OllamaGenerateChunk = {
  response?: string;
  error?: string;
};

export async function sendAssistantPrompt(prompt: string) {
  const response = await fetch(ASSISTANT_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: ASSISTANT_MODEL,
      prompt,
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
