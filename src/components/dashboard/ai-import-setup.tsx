"use client";

import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  ShieldCheck,
  Sparkles,
  Wand2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AI_PROVIDERS,
  getAiProvider,
  looksLikeApiKey,
  type AiProviderId,
} from "@/lib/ai/providers";
import { cn } from "@/lib/utils";

interface AiImportSetupProps {
  provider: AiProviderId;
  model: string;
  apiKey: string;
  remember: boolean;
  onProviderChange: (provider: AiProviderId) => void;
  onModelChange: (model: string) => void;
  onApiKeyChange: (apiKey: string) => void;
  onRememberChange: (remember: boolean) => void;
  onBack: () => void;
  onStart: () => void;
}

const SAFEGUARDS = [
  "One request per import, with a hard output limit",
  "Only extracted text is sent — never your file or account",
  "Nothing is written to our database; your key stays in this tab",
];

export function AiImportSetup({
  provider,
  model,
  apiKey,
  remember,
  onProviderChange,
  onModelChange,
  onApiKeyChange,
  onRememberChange,
  onBack,
  onStart,
}: AiImportSetupProps) {
  const [showKey, setShowKey] = useState(false);
  const [touched, setTouched] = useState(false);

  const activeProvider = getAiProvider(provider) ?? AI_PROVIDERS[0];
  const keyValid = looksLikeApiKey(activeProvider.id, apiKey);
  const keyError = touched && apiKey.trim().length > 0 && !keyValid;

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 rounded-xl border border-jet/15 bg-jet px-4 py-3.5 text-mint">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-mint/15">
          <Wand2 className="size-4" />
        </span>
        <div>
          <p className="text-sm font-semibold">Let AI do the work</p>
          <p className="mt-0.5 text-[0.73rem] leading-relaxed text-mint/75">
            We read your CV on this device, then ask your chosen model to organise and rewrite
            it into clean sections. Facts are preserved — only the language improves.
          </p>
        </div>
      </div>

      <div>
        <Label className="text-[0.72rem] font-semibold tracking-[0.08em] text-charcoal/70 uppercase">
          Choose a provider
        </Label>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {AI_PROVIDERS.map((option) => {
            const selected = option.id === activeProvider.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  onProviderChange(option.id);
                  setTouched(false);
                }}
                aria-pressed={selected}
                className={cn(
                  "relative flex flex-col items-start rounded-xl border px-3 py-2.5 text-left transition-[border-color,background-color,transform] duration-150 ease-out active:scale-[0.99]",
                  selected
                    ? "border-jet/40 bg-mint/70 shadow-[inset_0_0_0_1px_rgba(28,55,56,0.08)]"
                    : "border-onyx/10 bg-white hover:border-steel/60 hover:bg-mint/30",
                )}
              >
                <span className="flex w-full items-center justify-between gap-2">
                  <span className="text-[0.82rem] font-semibold text-onyx">{option.name}</span>
                  {selected ? (
                    <span className="flex size-4 items-center justify-center rounded-full bg-jet text-mint">
                      <Check className="size-2.5" strokeWidth={3} />
                    </span>
                  ) : null}
                </span>
                <span className="mt-0.5 line-clamp-2 text-[0.66rem] leading-snug text-charcoal/65">
                  {option.blurb}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="ai-api-key" className="text-[0.72rem] font-semibold text-charcoal">
            {activeProvider.name} API key
          </Label>
          <a
            href={activeProvider.keyUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1 text-[0.66rem] font-semibold text-steel transition-colors hover:text-jet"
          >
            Get a key
            <ExternalLink className="size-3" />
          </a>
        </div>
        <div className="relative">
          <KeyRound className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-charcoal/45" />
          <Input
            id="ai-api-key"
            type={showKey ? "text" : "password"}
            value={apiKey}
            onChange={(event) => onApiKeyChange(event.target.value)}
            onBlur={() => setTouched(true)}
            placeholder={activeProvider.keyPlaceholder}
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            aria-invalid={keyError}
            aria-describedby="ai-key-help"
            className="pr-10 pl-9 font-mono text-[0.78rem]"
          />
          <button
            type="button"
            onClick={() => setShowKey((current) => !current)}
            aria-label={showKey ? "Hide API key" : "Show API key"}
            className="absolute top-1/2 right-2.5 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-charcoal/55 transition-colors hover:bg-secondary hover:text-charcoal"
          >
            {showKey ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
          </button>
        </div>
        <p
          id="ai-key-help"
          className={cn(
            "text-[0.66rem] leading-relaxed",
            keyError ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {keyError
            ? `That does not look like a ${activeProvider.name} key. It usually starts with “${activeProvider.keyPrefix}”.`
            : "Used for this request only. We never store it with your CV."}
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="space-y-1.5">
          <Label className="text-[0.72rem] font-semibold text-charcoal">Model</Label>
          <Select value={model} onValueChange={onModelChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a model" />
            </SelectTrigger>
            <SelectContent>
              {activeProvider.models.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  <span className="flex flex-col items-start">
                    <span>{option.label}</span>
                    <span className="text-[0.64rem] text-muted-foreground">{option.note}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-onyx/10 bg-white px-3 py-2.5 text-[0.7rem] text-charcoal select-none sm:mb-0">
          <input
            type="checkbox"
            checked={remember}
            onChange={(event) => onRememberChange(event.target.checked)}
            className="size-3.5 accent-jet"
          />
          Keep key in this tab
        </label>
      </div>

      <div className="rounded-xl border border-onyx/10 bg-mint/45 p-3.5">
        <p className="flex items-center gap-1.5 text-[0.68rem] font-bold tracking-[0.08em] text-jet uppercase">
          <ShieldCheck className="size-3.5 text-steel" />
          Safe by design
        </p>
        <ul className="mt-2 space-y-1.5">
          {SAFEGUARDS.map((item) => (
            <li key={item} className="flex gap-2 text-[0.7rem] leading-relaxed text-charcoal">
              <Check className="mt-0.5 size-3 shrink-0 text-success" strokeWidth={2.5} />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:items-center sm:justify-between">
        <Button type="button" variant="ghost" onClick={onBack} className="gap-1.5 text-charcoal">
          <ArrowLeft className="size-4" />
          Back
        </Button>
        <Button
          type="button"
          onClick={() => {
            setTouched(true);
            if (!keyValid) return;
            onStart();
          }}
          disabled={!keyValid}
          className="gap-2"
        >
          <Sparkles className="size-4" />
          Choose a CV file
          <ArrowRight className="size-4" />
        </Button>
      </div>

      <p className="flex items-center justify-center gap-1.5 text-center text-[0.64rem] text-muted-foreground">
        <Lock className="size-3" />
        Provider charges apply to your own account.
      </p>
    </div>
  );
}
