import { NextRequest } from "next/server";
import { getSessionUser } from "../../../../lib/auth";
import {
  buildSplitAssistantTranscript,
  parseSplitAssistantDraftResponse,
  sanitizeSplitAssistantMessages,
  SPLIT_ASSISTANT_CHAT_SYSTEM_PROMPT,
  SPLIT_ASSISTANT_DAILY_DRAFT_LIMIT,
  SPLIT_ASSISTANT_DRAFT_RESPONSE_SCHEMA,
  SPLIT_ASSISTANT_DRAFT_SYSTEM_PROMPT,
  type SplitAssistantChatMessage,
} from "../../../../lib/workout-splits/assistant";
import type { RawWorkoutSplitPayload } from "../../../../lib/workout-splits/payload";
import {
  hasSplitAssistantDraftCapacity,
  incrementSplitAssistantDraftUsage,
} from "../../../../lib/workout-splits/assistant-usage";
import {
  getInvalidRequestOriginError,
  isTrustedMutationRequest,
} from "../../../../lib/request-security";

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const ANTHROPIC_API_BASE = "https://api.anthropic.com/v1";
const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash-lite";
const DEFAULT_ANTHROPIC_MODEL = "claude-haiku-4-5-20251001";
const GEMINI_CHAT_TIMEOUT_MS = 20_000;
const GEMINI_DRAFT_TIMEOUT_MS = 20_000;
const ANTHROPIC_CHAT_TIMEOUT_MS = 20_000;
const ANTHROPIC_DRAFT_TIMEOUT_MS = 20_000;

class GeminiRequestError extends Error {
  status: number;
  retryDelaySeconds: number | null;

  constructor(message: string, status: number, retryDelaySeconds: number | null = null) {
    super(message);
    this.name = "GeminiRequestError";
    this.status = status;
    this.retryDelaySeconds = retryDelaySeconds;
  }
}

type AssistantRequestBody = {
  messages?: unknown;
  draft?: RawWorkoutSplitPayload | null;
};

type GeminiContent = {
  role: "user" | "model";
  parts: Array<{ text: string }>;
};

function getGeminiApiKey() {
  return process.env.GEMINI_API_KEY?.trim() ?? "";
}

function getAnthropicApiKey() {
  return process.env.ANTHROPIC_API_KEY?.trim() ?? "";
}

function getSplitAssistantProvider() {
  const provider = process.env.SPLIT_ASSISTANT_PROVIDER?.trim().toLowerCase();

  return provider === "anthropic" ? "anthropic" : "gemini";
}

function getGeminiModel() {
  return process.env.SPLIT_ASSISTANT_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
}

function getAnthropicModel() {
  return process.env.SPLIT_ASSISTANT_MODEL?.trim() || DEFAULT_ANTHROPIC_MODEL;
}

function toGeminiContents(messages: SplitAssistantChatMessage[]): GeminiContent[] {
  return messages.map((message) => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: [{ text: message.content }],
  }));
}

function extractGeminiText(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  const candidates = (payload as { candidates?: unknown }).candidates;

  if (!Array.isArray(candidates)) {
    return "";
  }

  return candidates
    .flatMap((candidate) => {
      const parts = (candidate as {
        content?: { parts?: Array<{ text?: unknown }> };
      })?.content?.parts;

      return Array.isArray(parts)
        ? parts.map((part) => (typeof part.text === "string" ? part.text : ""))
        : [];
    })
    .join("");
}

function parseGeminiRetryDelaySeconds(detail: string) {
  const match = /retry in\s+([0-9.]+)s/i.exec(detail);

  if (!match) {
    return null;
  }

  const seconds = Math.ceil(Number.parseFloat(match[1] ?? ""));
  return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
}

function toGeminiRequestError(status: number, detail: string) {
  if (status === 429) {
    const retryDelaySeconds = parseGeminiRetryDelaySeconds(detail);
    const waitText = retryDelaySeconds ? ` Wait about ${retryDelaySeconds}s and try again.` : "";

    return new GeminiRequestError(
      `Ben hit Gemini's free-tier rate limit.${waitText}`,
      status,
      retryDelaySeconds,
    );
  }

  return new GeminiRequestError("Gemini could not answer right now.", status);
}

function splitSseEvents(buffer: string) {
  const normalized = buffer.replace(/\r\n/g, "\n");
  const events = normalized.split("\n\n");

  return {
    events: events.slice(0, -1),
    remainder: events.at(-1) ?? "",
  };
}

function extractSseDataPayloads(event: string) {
  return event
    .split("\n")
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice("data:".length).trim())
    .filter(Boolean);
}

async function* readGeminiSseText(response: Response) {
  if (!response.body) {
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const { events, remainder } = splitSseEvents(buffer);
    buffer = remainder;

    for (const event of events) {
      for (const data of extractSseDataPayloads(event)) {
        if (data === "[DONE]") {
          continue;
        }

        try {
          const text = extractGeminiText(JSON.parse(data));

          if (text) {
            yield text;
          }
        } catch {
          continue;
        }
      }
    }
  }

  const tail = decoder.decode();
  const { events } = splitSseEvents(`${buffer}${tail}\n\n`);

  for (const event of events) {
    for (const data of extractSseDataPayloads(event)) {
      if (data === "[DONE]") {
        continue;
      }

      try {
        const text = extractGeminiText(JSON.parse(data));

        if (text) {
          yield text;
        }
      } catch {
        // Ignore an incomplete trailing SSE event.
      }
    }
  }
}

async function streamAssistantReply(messages: SplitAssistantChatMessage[]) {
  if (getSplitAssistantProvider() === "anthropic") {
    return streamAnthropicAssistantReply(messages);
  }

  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    throw new Error("Gemini is not configured.");
  }

  const response = await fetch(
    `${GEMINI_API_BASE}/models/${encodeURIComponent(getGeminiModel())}:streamGenerateContent?alt=sse`,
    {
      method: "POST",
      signal: AbortSignal.timeout(GEMINI_CHAT_TIMEOUT_MS),
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: SPLIT_ASSISTANT_CHAT_SYSTEM_PROMPT }],
        },
        contents: toGeminiContents(messages),
        generationConfig: {
          temperature: 0.65,
          maxOutputTokens: 420,
        },
      }),
    },
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("Gemini chat failure:", response.status, detail.slice(0, 500));
    throw toGeminiRequestError(response.status, detail);
  }

  return readGeminiSseText(response);
}

async function generateDraft(messages: SplitAssistantChatMessage[], draft?: RawWorkoutSplitPayload | null) {
  if (getSplitAssistantProvider() === "anthropic") {
    return generateAnthropicDraft(messages, draft);
  }

  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    throw new Error("Gemini is not configured.");
  }

  const response = await fetch(
    `${GEMINI_API_BASE}/models/${encodeURIComponent(getGeminiModel())}:generateContent`,
    {
      method: "POST",
      signal: AbortSignal.timeout(GEMINI_DRAFT_TIMEOUT_MS),
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: SPLIT_ASSISTANT_DRAFT_SYSTEM_PROMPT }],
        },
        contents: [
          {
            role: "user",
            parts: [
              {
                text: [
                  "Review this conversation and decide whether a split draft is ready.",
                  "If ready, return a complete weekly split draft.",
                  buildSplitAssistantTranscript(messages, draft),
                ].join("\n\n"),
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.35,
          maxOutputTokens: 1_800,
          responseMimeType: "application/json",
          responseJsonSchema: SPLIT_ASSISTANT_DRAFT_RESPONSE_SCHEMA,
        },
      }),
    },
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("Gemini draft failure:", response.status, detail.slice(0, 500));
    throw toGeminiRequestError(response.status, detail);
  }

  const payload = await response.json();
  return parseSplitAssistantDraftResponse(extractGeminiText(payload));
}

function extractAnthropicText(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  const content = (payload as { content?: unknown }).content;

  if (!Array.isArray(content)) {
    return "";
  }

  return content
    .map((part) => {
      if (!part || typeof part !== "object") {
        return "";
      }

      const typedPart = part as { type?: unknown; text?: unknown };
      return typedPart.type === "text" && typeof typedPart.text === "string"
        ? typedPart.text
        : "";
    })
    .join("");
}

function toAnthropicMessages(messages: SplitAssistantChatMessage[]) {
  return messages.map((message) => ({
    role: message.role,
    content: message.content,
  }));
}

async function* streamAnthropicAssistantReply(messages: SplitAssistantChatMessage[]) {
  const apiKey = getAnthropicApiKey();

  if (!apiKey) {
    throw new Error("Anthropic is not configured.");
  }

  const response = await fetch(`${ANTHROPIC_API_BASE}/messages`, {
    method: "POST",
    signal: AbortSignal.timeout(ANTHROPIC_CHAT_TIMEOUT_MS),
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: getAnthropicModel(),
      max_tokens: 420,
      temperature: 0.65,
      system: SPLIT_ASSISTANT_CHAT_SYSTEM_PROMPT,
      messages: toAnthropicMessages(messages),
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("Anthropic chat failure:", response.status, detail.slice(0, 500));
    throw new Error(
      response.status === 429
        ? "Ben hit Anthropic's rate limit. Try again shortly."
        : response.status === 404
          ? `Anthropic could not find model "${getAnthropicModel()}". Check SPLIT_ASSISTANT_MODEL.`
        : "Anthropic could not answer right now.",
    );
  }

  const payload = await response.json();
  const text = extractAnthropicText(payload);

  if (text) {
    yield text;
  }
}

async function generateAnthropicDraft(
  messages: SplitAssistantChatMessage[],
  draft?: RawWorkoutSplitPayload | null,
) {
  const apiKey = getAnthropicApiKey();

  if (!apiKey) {
    throw new Error("Anthropic is not configured.");
  }

  const response = await fetch(`${ANTHROPIC_API_BASE}/messages`, {
    method: "POST",
    signal: AbortSignal.timeout(ANTHROPIC_DRAFT_TIMEOUT_MS),
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: getAnthropicModel(),
      max_tokens: 1_800,
      temperature: 0.25,
      system: [
        SPLIT_ASSISTANT_DRAFT_SYSTEM_PROMPT,
        "Return only JSON. Do not wrap it in markdown.",
      ].join(" "),
      messages: [
        {
          role: "user",
          content: [
            "Review this conversation and decide whether a split draft is ready.",
            "If ready, return a complete weekly split draft.",
            "Return JSON matching this TypeScript shape:",
            "{ ready: boolean, assistantNote: string, draft?: { name: string, days: { weekday: string, workoutType: string, exercises: { exerciseDisplayName: string, sets: number }[] }[] } }",
            buildSplitAssistantTranscript(messages, draft),
          ].join("\n\n"),
        },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("Anthropic draft failure:", response.status, detail.slice(0, 500));
    throw new Error(
      response.status === 429
        ? "Ben hit Anthropic's rate limit. Try again shortly."
        : response.status === 404
          ? `Anthropic could not find model "${getAnthropicModel()}". Check SPLIT_ASSISTANT_MODEL.`
        : "Anthropic could not draft a split right now.",
    );
  }

  const payload = await response.json();
  return parseSplitAssistantDraftResponse(extractAnthropicText(payload));
}

function encodeSseEvent(event: string, payload: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
}

function assistantReplyStillNeedsUserInput(reply: string) {
  const trimmed = reply.trim();

  if (!trimmed) {
    return true;
  }

  const lastQuestionIndex = trimmed.lastIndexOf("?");
  const lastSentenceIndex = Math.max(
    trimmed.lastIndexOf("."),
    trimmed.lastIndexOf("!"),
  );

  return lastQuestionIndex > lastSentenceIndex;
}

export async function POST(request: NextRequest) {
  if (!isTrustedMutationRequest(request)) {
    return Response.json({ error: getInvalidRequestOriginError() }, { status: 403 });
  }

  const user = await getSessionUser();

  if (!user) {
    return Response.json({ error: "Sign in required." }, { status: 401 });
  }

  let body: AssistantRequestBody;

  try {
    body = (await request.json()) as AssistantRequestBody;
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const messages = sanitizeSplitAssistantMessages(body.messages);

  if (!messages.some((message) => message.role === "user")) {
    return Response.json({ error: "A user message is required." }, { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, payload: unknown) => {
        controller.enqueue(encoder.encode(encodeSseEvent(event, payload)));
      };
      let assistantReply = "";

      try {
        for await (const chunk of await streamAssistantReply(messages)) {
          assistantReply += chunk;
          send("message_delta", { content: chunk });
        }

        if (!assistantReply.trim()) {
          throw new Error("Gemini did not return a message.");
        }

        send("message_done", { content: assistantReply });

        if (assistantReplyStillNeedsUserInput(assistantReply)) {
          return;
        }

        const draftMessages: SplitAssistantChatMessage[] = assistantReply.trim()
          ? [...messages, { role: "assistant", content: assistantReply.trim() }]
          : messages;
        const hasCapacity = await hasSplitAssistantDraftCapacity(user.id);

        if (!hasCapacity) {
          send("limit_reached", {
            limit: SPLIT_ASSISTANT_DAILY_DRAFT_LIMIT,
            message: "You've reached today's split generation limit.",
          });
          return;
        }

        let draftResult;

        try {
          draftResult = await generateDraft(draftMessages, body.draft ?? null);
        } catch (draftError) {
          console.error("split assistant draft failure:", draftError);
          return;
        }

        if (draftResult.ready) {
          await incrementSplitAssistantDraftUsage(user.id);
          send("split_draft", {
            split: draftResult.split,
            assistantNote: draftResult.assistantNote,
          });
        }
      } catch (error) {
        console.error("split assistant failure:", error);
        send("error", {
          message:
            error instanceof GeminiRequestError
              ? error.message
              : error instanceof Error && error.message === "Gemini is not configured."
                ? "Gemini is not configured for this environment."
                : "Ben could not answer right now. Try again in a moment.",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      Connection: "keep-alive",
    },
  });
}
