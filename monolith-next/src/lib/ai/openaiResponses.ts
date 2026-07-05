import "server-only";

import { buildArielResponsesPayload, type ArielPromptInput } from "@/lib/ai/arielPrompt";
import { getOpenAiConfig } from "@/lib/config/env";
import { BadRequestError, ServiceUnavailableError } from "@/lib/http/errors";

interface ResponsesContentItem {
  type?: string;
  text?: string;
}

interface ResponsesOutputItem {
  type?: string;
  content?: ResponsesContentItem[];
}

interface ResponsesApiResult {
  output_text?: string;
  output?: ResponsesOutputItem[];
  error?: {
    message?: string;
  };
}

function extractOutputText(result: ResponsesApiResult): string {
  if (result.output_text && result.output_text.trim().length > 0) {
    return result.output_text.trim();
  }

  const textParts: string[] = [];
  for (const outputItem of result.output ?? []) {
    for (const contentItem of outputItem.content ?? []) {
      if (contentItem.type === "output_text" && contentItem.text?.trim()) {
        textParts.push(contentItem.text.trim());
      }
    }
  }
  return textParts.join("\n").trim();
}

export async function requestArielAnswer(input: ArielPromptInput): Promise<string> {
  const { apiKey, model } = getOpenAiConfig();
  if (!apiKey) {
    throw new ServiceUnavailableError("ARIEL no está disponible. Falta configurar OPENAI_API_KEY en el servidor.");
  }

  const payload = buildArielResponsesPayload(input, model);
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  let body: ResponsesApiResult | null = null;
  try {
    body = (await response.json()) as ResponsesApiResult;
  } catch {
    body = null;
  }

  if (!response.ok) {
    const detail = body?.error?.message?.trim();
    throw new ServiceUnavailableError(detail ? `No se pudo consultar ARIEL: ${detail}` : "No se pudo consultar ARIEL en este momento.");
  }

  if (!body) {
    throw new ServiceUnavailableError("No se recibió una respuesta válida del proveedor de IA.");
  }

  const outputText = extractOutputText(body);
  if (!outputText) {
    throw new BadRequestError("ARIEL no generó una respuesta utilizable para esta consulta.");
  }

  return outputText;
}
