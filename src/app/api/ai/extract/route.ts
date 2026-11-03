import { NextResponse, type NextRequest } from "next/server";

import { parseAiJson } from "@/lib/ai/json";
import { AI_REQUEST_TIMEOUT_MS, buildCvMessages, prepareCvText } from "@/lib/ai/prompt";
import { getAiProvider, type AiProviderId } from "@/lib/ai/providers";
import { normalizeData } from "@/lib/cv/normalize";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 120;

const MAX_BODY_CHARS = 400_000;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_REQUESTS = 8;

/**
 * Output budgets are deliberately generous enough for a multi-page CV, but
 * still capped so one import can never run away with tokens. Reasoning models
 * count their thinking against the same budget.
 */
const OUTPUT_BUDGET: Record<AiProviderId, number> = {
  openai: 16_000,
  anthropic: 16_000,
  deepseek: 32_000,
  google: 20_000,
};

/**
 * Best-effort, per-instance throttle. It is not a security boundary (the user
 * pays with their own key), but it stops accidental loops from burning tokens.
 */
const recentRequests = new Map<string, number[]>();

function withinRateLimit(userId: string): boolean {
  const now = Date.now();
  const hits = (recentRequests.get(userId) ?? []).filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS,
  );

  if (hits.length >= RATE_LIMIT_REQUESTS) return false;

  hits.push(now);
  recentRequests.set(userId, hits);

  if (recentRequests.size > 5_000) recentRequests.clear();
  return true;
}

function fail(message: string, status: number, code: string, retryable = false) {
  return NextResponse.json({ error: message, code, retryable }, { status });
}

interface ProviderReply {
  text: string;
  usage: { inputTokens?: number; outputTokens?: number };
  finishReason?: string;
}

function readOpenAiContent(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object" && "text" in part) {
          return String((part as { text?: unknown }).text ?? "");
        }
        return "";
      })
      .join("");
  }
  return "";
}

async function callOpenAiCompatible(input: {
  endpoint: string;
  apiKey: string;
  model: string;
  system: string;
  user: string;
  signal: AbortSignal;
  kind: "openai" | "deepseek";
}): Promise<ProviderReply> {
  const budget = OUTPUT_BUDGET[input.kind];
  const messages = [
    { role: "system", content: input.system },
    { role: "user", content: input.user },
  ];

  const body =
    input.kind === "openai"
      ? {
          model: input.model,
          messages,
          // GPT-6.1 Sol requires low reasoning; Terra and Luna support "none".
          reasoning_effort: input.model === "gpt-6.1-sol" ? "low" : "none",
          max_completion_tokens: budget,
          response_format: { type: "json_object" },
          stream: false,
        }
      : {
          model: input.model,
          messages,
          reasoning_effort: "low",
          max_tokens: budget,
          response_format: { type: "json_object" },
          stream: false,
        };

  const response = await fetch(input.endpoint, {
    method: "POST",
    signal: input.signal,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${input.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) throw new ProviderHttpError(response.status);

  const payload = (await response.json()) as {
    choices?: Array<{
      message?: { content?: unknown };
      finish_reason?: string;
    }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };

  return {
    text: readOpenAiContent(payload.choices?.[0]?.message?.content),
    finishReason: payload.choices?.[0]?.finish_reason,
    usage: {
      inputTokens: payload.usage?.prompt_tokens,
      outputTokens: payload.usage?.completion_tokens,
    },
  };
}

async function callAnthropic(input: {
  apiKey: string;
  model: string;
  system: string;
  user: string;
  signal: AbortSignal;
}): Promise<ProviderReply> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    signal: input.signal,
    headers: {
      "content-type": "application/json",
      "x-api-key": input.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: input.model,
      max_tokens: OUTPUT_BUDGET.anthropic,
      system: input.system,
      messages: [{ role: "user", content: input.user }],
    }),
  });

  if (!response.ok) throw new ProviderHttpError(response.status);

  const payload = (await response.json()) as {
    content?: Array<{ type?: string; text?: string }>;
    stop_reason?: string;
    usage?: { input_tokens?: number; output_tokens?: number };
  };

  return {
    text: (payload.content ?? [])
      .filter((block) => block.type === "text" && block.text)
      .map((block) => block.text)
      .join("\n"),
    finishReason: payload.stop_reason,
    usage: {
      inputTokens: payload.usage?.input_tokens,
      outputTokens: payload.usage?.output_tokens,
    },
  };
}

async function callGoogle(input: {
  apiKey: string;
  model: string;
  system: string;
  user: string;
  signal: AbortSignal;
}): Promise<ProviderReply> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      input.model,
    )}:generateContent`,
    {
      method: "POST",
      signal: input.signal,
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": input.apiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: input.system }] },
        contents: [{ role: "user", parts: [{ text: input.user }] }],
        generationConfig: {
          maxOutputTokens: OUTPUT_BUDGET.google,
          responseMimeType: "application/json",
        },
      }),
    },
  );

  if (!response.ok) throw new ProviderHttpError(response.status);

  const payload = (await response.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
      finishReason?: string;
    }>;
    usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
  };

  return {
    text: (payload.candidates?.[0]?.content?.parts ?? [])
      .map((part) => part.text ?? "")
      .join(""),
    finishReason: payload.candidates?.[0]?.finishReason,
    usage: {
      inputTokens: payload.usageMetadata?.promptTokenCount,
      outputTokens: payload.usageMetadata?.candidatesTokenCount,
    },
  };
}

class ProviderHttpError extends Error {
  status: number;

  constructor(status: number) {
    super(`provider_${status}`);
    this.name = "ProviderHttpError";
    this.status = status;
  }
}

function providerErrorMessage(providerName: string, status: number) {
  if (status === 401 || status === 403) {
    return {
      message: `${providerName} rejected that API key. Check the key and try again.`,
      code: "invalid_key",
      retryable: false,
    };
  }
  if (status === 404) {
    return {
      message: `That model is not available for this ${providerName} key. Choose another model.`,
      code: "model_unavailable",
      retryable: false,
    };
  }
  if (status === 429) {
    return {
      message: `${providerName} is rate-limiting this key. Wait a minute before trying once more.`,
      code: "rate_limited",
      retryable: true,
    };
  }
  if (status === 402) {
    return {
      message: `${providerName} reports that this key has no credit left. Top up or use another provider.`,
      code: "no_credit",
      retryable: false,
    };
  }
  if (status >= 500) {
    return {
      message: `${providerName} is temporarily unavailable. Your CV is safe — try again or use local reading.`,
      code: "provider_down",
      retryable: true,
    };
  }
  return {
    message: `${providerName} could not process this request. Try another model, or use local reading.`,
    code: "provider_error",
    retryable: false,
  };
}

function hasUsableContent(data: ReturnType<typeof normalizeData>): boolean {
  const personal = data.personal;
  return Boolean(
    personal.fullName.trim() ||
      personal.summary.trim() ||
      personal.email.trim() ||
      data.experience.length ||
      data.education.length ||
      data.skills.length ||
      data.additional.length,
  );
}

interface AiRequestBody {
  provider?: string;
  model?: string;
  apiKey?: string;
  text?: string;
}

export async function POST(request: NextRequest) {
  let userId: string;
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return fail("Please sign in again before using AI import.", 401, "unauthenticated");
    }
    userId = user.id;
  } catch {
    return fail(
      "Authentication is not configured on this deployment yet.",
      503,
      "not_configured",
    );
  }

  if (!withinRateLimit(userId)) {
    return fail(
      "You have used AI import several times in the last few minutes. Please wait a little before trying again.",
      429,
      "too_many_requests",
      true,
    );
  }

  let body: AiRequestBody | null = null;

  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY_CHARS) {
      return fail("That CV text is too large for AI import.", 413, "body_too_large");
    }
    body = JSON.parse(raw) as AiRequestBody;
  } catch {
    return fail("The request could not be read.", 400, "invalid_body");
  }

  const provider = getAiProvider(body?.provider);
  if (!provider) {
    return fail("Choose a supported AI provider.", 400, "unknown_provider");
  }

  const model = provider.models.find((option) => option.id === body?.model);
  if (!model) {
    return fail("Choose one of the models listed for this provider.", 400, "unknown_model");
  }

  const apiKey = typeof body?.apiKey === "string" ? body.apiKey.trim() : "";
  if (apiKey.length < 20 || apiKey.length > 400 || /\s/.test(apiKey)) {
    return fail("That API key does not look valid.", 400, "invalid_key");
  }

  if (typeof body?.text !== "string" || body.text.replace(/\s/g, "").length < 40) {
    return fail(
      "There is not enough readable text in this CV to send to an AI provider.",
      400,
      "empty_text",
    );
  }

  const prepared = prepareCvText(body.text);
  const messages = buildCvMessages(prepared.text, prepared.truncated);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_REQUEST_TIMEOUT_MS);

  let reply: ProviderReply;
  try {
    if (provider.id === "anthropic") {
      reply = await callAnthropic({
        apiKey,
        model: model.id,
        system: messages.system,
        user: messages.user,
        signal: controller.signal,
      });
    } else if (provider.id === "google") {
      reply = await callGoogle({
        apiKey,
        model: model.id,
        system: messages.system,
        user: messages.user,
        signal: controller.signal,
      });
    } else {
      reply = await callOpenAiCompatible({
        endpoint:
          provider.id === "deepseek"
            ? "https://api.deepseek.com/v1/chat/completions"
            : "https://api.openai.com/v1/chat/completions",
        apiKey,
        model: model.id,
        system: messages.system,
        user: messages.user,
        signal: controller.signal,
        kind: provider.id,
      });
    }
  } catch (error) {
    if (error instanceof ProviderHttpError) {
      const mapped = providerErrorMessage(provider.name, error.status);
      return fail(mapped.message, error.status === 429 ? 429 : 502, mapped.code, mapped.retryable);
    }
    if (error instanceof Error && error.name === "AbortError") {
      return fail(
        `${provider.name} took too long to answer. Nothing was changed — try again, or use local reading.`,
        504,
        "timeout",
        true,
      );
    }
    return fail(
      `We could not reach ${provider.name}. Check your connection and try again.`,
      502,
      "network",
      true,
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!reply.text.trim()) {
    return fail(
      `${provider.name} returned an empty answer. Nothing was changed — try again, or use local reading.`,
      502,
      "empty_response",
      true,
    );
  }

  const outputTruncated = ["length", "max_tokens", "MAX_TOKENS"].includes(
    reply.finishReason ?? "",
  );

  let data;
  try {
    data = normalizeData(parseAiJson(reply.text));
  } catch {
    return fail(
      outputTruncated
        ? `${provider.name} ran out of output space before finishing this CV. Try the next model up, or use local reading.`
        : `${provider.name} returned a response we could not read. Nothing was changed — try again, or use local reading.`,
      502,
      outputTruncated ? "output_truncated" : "unreadable_response",
      true,
    );
  }

  if (!hasUsableContent(data)) {
    return fail(
      `${provider.name} could not find structured CV content. Nothing was changed — try local reading instead.`,
      502,
      "no_content",
      false,
    );
  }

  return NextResponse.json({
    data,
    provider: provider.id,
    model: model.id,
    usage: reply.usage,
    truncated: prepared.truncated,
    outputTruncated,
    originalChars: prepared.originalChars,
  });
}
