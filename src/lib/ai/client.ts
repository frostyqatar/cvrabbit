import type { AiProviderId } from "./providers";

export interface AiUsage {
  inputTokens?: number;
  outputTokens?: number;
}

export interface AiExtractionResponse {
  data: unknown;
  provider: AiProviderId;
  model: string;
  usage: AiUsage;
  truncated: boolean;
  outputTruncated: boolean;
  originalChars: number;
}

export class AiRequestError extends Error {
  code: string;
  retryable: boolean;

  constructor(message: string, code: string, retryable = false) {
    super(message);
    this.name = "AiRequestError";
    this.code = code;
    this.retryable = retryable;
  }
}

export async function requestAiExtraction(input: {
  provider: AiProviderId;
  model: string;
  apiKey: string;
  text: string;
}): Promise<AiExtractionResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 135_000);

  try {
    const response = await fetch("/api/ai/extract", {
      method: "POST",
      headers: { "content-type": "application/json" },
      cache: "no-store",
      credentials: "same-origin",
      signal: controller.signal,
      body: JSON.stringify(input),
    });

    const payload = (await response.json().catch(() => null)) as
      | (Partial<AiExtractionResponse> & { error?: string; code?: string; retryable?: boolean })
      | null;

    if (!response.ok || !payload?.data) {
      const message =
        payload?.error ??
        (response.status === 401
          ? "Please sign in again before using AI import."
          : "The AI provider could not organise this CV. Your file is safe.");
      throw new AiRequestError(
        message,
        payload?.code ?? `http_${response.status}`,
        Boolean(payload?.retryable),
      );
    }

    return {
      data: payload.data,
      provider: (payload.provider as AiProviderId) ?? input.provider,
      model: payload.model ?? input.model,
      usage: payload.usage ?? {},
      truncated: Boolean(payload.truncated),
      outputTruncated: Boolean(payload.outputTruncated),
      originalChars: Number(payload.originalChars ?? input.text.length),
    };
  } catch (error) {
    if (error instanceof AiRequestError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new AiRequestError(
        "The AI provider took too long to answer. Nothing was changed — try again, or use local reading.",
        "timeout",
        true,
      );
    }
    throw new AiRequestError(
      "We could not reach the AI service. Check your connection and try again.",
      "network",
      true,
    );
  } finally {
    clearTimeout(timer);
  }
}

const STORAGE_KEY = "cvrabbit.ai-key.v1";

export interface StoredAiKey {
  provider: AiProviderId;
  model: string;
  apiKey: string;
}

/**
 * Keys live in sessionStorage only: they are never sent to CVRabbit's database
 * and disappear when the tab is closed.
 */
export function loadStoredAiKey(): Partial<StoredAiKey> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredAiKey>;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export function storeAiKey(value: StoredAiKey): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Storage can be blocked; the key stays in memory for this dialog only.
  }
}

export function clearStoredAiKey(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clean up.
  }
}
