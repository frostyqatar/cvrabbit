export type AiProviderId = "openai" | "anthropic" | "deepseek" | "google";

export interface AiModelOption {
  id: string;
  label: string;
  note: string;
}

export interface AiProvider {
  id: AiProviderId;
  name: string;
  shortName: string;
  blurb: string;
  keyUrl: string;
  keyPlaceholder: string;
  keyPrefix: string;
  models: AiModelOption[];
}

/**
 * Line-ups verified on 3 November 2026:
 * - OpenAI: GPT-6.1 Terra / Sol, GPT-6 Luna
 * - Anthropic: Claude Sonnet 5.5 / Haiku 5.5 / Opus 5.5
 * - DeepSeek: deepseek-flash (V4.1 Flash) and deepseek-v4-pro
 * - Google: Gemini 3.8 Flash, Gemini 4 Argon, Gemini 3.5 Flash-Lite
 *
 * Retired names (gpt-4.1, claude-sonnet-4-5, deepseek-chat, gemini-2.5-*) are
 * deliberately not offered.
 */
export const AI_PROVIDERS: AiProvider[] = [
  {
    id: "openai",
    name: "OpenAI",
    shortName: "OpenAI",
    blurb: "GPT-6.1 Terra. Fast, clear, faithful rewriting.",
    keyUrl: "https://platform.openai.com/api-keys",
    keyPlaceholder: "sk-proj-…",
    keyPrefix: "sk-",
    models: [
      {
        id: "gpt-6.1-terra",
        label: "GPT-6.1 Terra",
        note: "Best balance of quality and cost",
      },
      { id: "gpt-6.1-sol", label: "GPT-6.1 Sol", note: "Higher quality, higher cost" },
      { id: "gpt-6-luna", label: "GPT-6 Luna", note: "Cheapest and fastest" },
    ],
  },
  {
    id: "anthropic",
    name: "Claude",
    shortName: "Claude",
    blurb: "Claude Sonnet 5.5. Careful, faithful rewriting.",
    keyUrl: "https://console.anthropic.com/settings/keys",
    keyPlaceholder: "sk-ant-…",
    keyPrefix: "sk-ant-",
    models: [
      {
        id: "claude-sonnet-5-5",
        label: "Claude Sonnet 5.5",
        note: "Best balance of quality and cost",
      },
      {
        id: "claude-haiku-5-5",
        label: "Claude Haiku 5.5",
        note: "Fastest and cheapest",
      },
      {
        id: "claude-opus-5-5",
        label: "Claude Opus 5.5",
        note: "Highest quality, higher cost",
      },
    ],
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    shortName: "DeepSeek",
    blurb: "DeepSeek V4.1 Flash. Strong writing at low cost.",
    keyUrl: "https://platform.deepseek.com/api_keys",
    keyPlaceholder: "sk-…",
    keyPrefix: "sk-",
    models: [
      {
        id: "deepseek-flash",
        label: "DeepSeek V4.1 Flash",
        note: "Best balance of quality and cost",
      },
      {
        id: "deepseek-v4-pro",
        label: "DeepSeek V4 Pro",
        note: "Higher quality, higher cost",
      },
    ],
  },
  {
    id: "google",
    name: "Gemini",
    shortName: "Gemini",
    blurb: "Gemini 3.8 Flash. Long-context reading of dense CVs.",
    keyUrl: "https://aistudio.google.com/app/apikey",
    keyPlaceholder: "AIza…",
    keyPrefix: "AIza",
    models: [
      {
        id: "gemini-3.8-flash",
        label: "Gemini 3.8 Flash",
        note: "Best balance of quality and cost",
      },
      { id: "gemini-4-argon", label: "Gemini 4 Argon", note: "Highest quality, higher cost" },
      {
        id: "gemini-3.5-flash-lite",
        label: "Gemini 3.5 Flash-Lite",
        note: "Fastest and cheapest",
      },
    ],
  },
];

export const AI_PROVIDER_IDS = AI_PROVIDERS.map((provider) => provider.id);

export const DEFAULT_AI_PROVIDER: AiProviderId = "openai";

export function getAiProvider(id: string | null | undefined): AiProvider | undefined {
  return AI_PROVIDERS.find((provider) => provider.id === id);
}

export function getAiModel(
  providerId: string | null | undefined,
  modelId: string | null | undefined,
): AiModelOption | undefined {
  return getAiProvider(providerId)?.models.find((model) => model.id === modelId);
}

export function defaultModelFor(providerId: AiProviderId): string {
  return getAiProvider(providerId)?.models[0]?.id ?? "";
}

/**
 * A deliberately small local check. Providers own the real validation; this
 * only catches obvious paste mistakes before a request is made.
 */
export function looksLikeApiKey(providerId: AiProviderId, value: string): boolean {
  const key = value.trim();
  if (key.length < 20 || key.length > 400) return false;
  if (/\s/.test(key)) return false;
  const provider = getAiProvider(providerId);
  if (!provider) return false;
  return key.startsWith(provider.keyPrefix) || providerId === "google";
}
