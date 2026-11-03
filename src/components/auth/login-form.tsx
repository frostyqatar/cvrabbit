"use client";

import { useState } from "react";
import { AlertCircle, ArrowLeft, Check, Loader2, Mail } from "lucide-react";
import Link from "next/link";

import { GoogleIcon } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isEmail } from "@/lib/utils";

type Status = "idle" | "google" | "email" | "sent";

export function LoginForm({
  configured,
  initialError,
  nextPath,
}: {
  configured: boolean;
  initialError?: string;
  nextPath: string;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState(initialError ?? "");
  const [email, setEmail] = useState("");
  const [magicOpen, setMagicOpen] = useState(false);

  const callbackUrl = () => {
    const origin = window.location.origin;
    const next = encodeURIComponent(nextPath || "/dashboard");
    return `${origin}/auth/callback?next=${next}`;
  };

  async function signInWithGoogle() {
    if (!configured) return;
    setError("");
    setStatus("google");
    try {
      const supabase = getSupabaseBrowserClient();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl(),
          queryParams: { prompt: "select_account" },
        },
      });
      if (oauthError) {
        const message = oauthError.message.toLowerCase();
        if (message.includes("not enabled") || message.includes("provider")) {
          setError(
            "Google sign-in is not enabled for this workspace yet. Use an email sign-in link below.",
          );
          setMagicOpen(true);
        } else {
          setError(oauthError.message);
        }
        setStatus("idle");
      }
    } catch {
      setError("We could not reach the sign-in service. Check your connection and try again.");
      setStatus("idle");
    }
  }

  async function sendMagicLink(event: React.FormEvent) {
    event.preventDefault();
    if (!configured) return;
    setError("");

    if (!isEmail(email)) {
      setError("Enter a valid email address.");
      return;
    }

    setStatus("email");
    try {
      const supabase = getSupabaseBrowserClient();
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: callbackUrl(),
          shouldCreateUser: true,
        },
      });

      if (otpError) {
        setError(otpError.message);
        setStatus("idle");
        return;
      }

      setStatus("sent");
    } catch {
      setError("We could not send the link. Check your connection and try again.");
      setStatus("idle");
    }
  }

  if (status === "sent") {
    return (
      <div className="animate-fade">
        <div className="flex size-12 items-center justify-center rounded-full bg-success/10 text-success">
          <Check className="size-5" strokeWidth={2.5} />
        </div>
        <h1 className="mt-5 font-serif text-3xl tracking-[-0.02em] text-onyx">
          Check your inbox.
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-charcoal">
          We sent a sign-in link to <span className="font-semibold text-onyx">{email}</span>.
          It expires shortly, so open it on this device when you are ready.
        </p>
        <Button
          variant="outline"
          className="mt-6"
          onClick={() => {
            setStatus("idle");
            setMagicOpen(true);
          }}
        >
          <ArrowLeft className="size-4" />
          Use a different email
        </Button>
      </div>
    );
  }

  return (
    <div className="animate-fade">
      <p className="text-[0.7rem] font-bold tracking-[0.2em] text-steel uppercase">
        Welcome
      </p>
      <h1 className="mt-2 font-serif text-[2.4rem] leading-[1.02] tracking-[-0.02em] text-onyx sm:text-[2.8rem]">
        Your CV, <span className="italic text-jet">in order.</span>
      </h1>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-charcoal">
        Sign in to upload, edit, and generate your CV. Your workspace is private to your
        account.
      </p>

      {!configured ? (
        <div className="mt-6 flex gap-3 rounded-xl border border-warning/25 bg-warning/8 p-4 text-sm text-charcoal">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-warning" />
          <p>
            CVRabbit is not connected to Supabase yet. Add the project credentials to{" "}
            <code className="rounded bg-onyx/5 px-1 py-0.5 text-[0.72rem]">.env.local</code>{" "}
            and reload this page.
          </p>
        </div>
      ) : null}

      {error ? (
        <div
          role="alert"
          className="mt-5 flex gap-3 rounded-xl border border-destructive/20 bg-destructive/[0.05] p-3.5 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <p className="leading-relaxed">{error}</p>
        </div>
      ) : null}

      <div className="mt-7 space-y-3">
        <Button
          size="lg"
          className="h-12 w-full"
          onClick={signInWithGoogle}
          disabled={!configured || status !== "idle"}
        >
          {status === "google" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <GoogleIcon />
          )}
          {status === "google" ? "Opening Google…" : "Continue with Google"}
        </Button>

        {!magicOpen ? (
          <Button
            variant="ghost"
            className="h-10 w-full text-charcoal"
            onClick={() => setMagicOpen(true)}
            disabled={!configured || status !== "idle"}
          >
            <Mail className="size-4" />
            Use an email link instead
          </Button>
        ) : (
          <form onSubmit={sendMagicLink} className="animate-fade space-y-3 pt-1">
            <Separator />
            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={status !== "idle"}
              />
            </div>
            <Button
              type="submit"
              variant="outline"
              className="h-11 w-full"
              disabled={!configured || status !== "idle"}
            >
              {status === "email" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Mail className="size-4" />
              )}
              {status === "email" ? "Sending link…" : "Email me a sign-in link"}
            </Button>
          </form>
        )}
      </div>

      <p className="mt-6 text-[0.72rem] leading-relaxed text-charcoal/65">
        By continuing you agree to keep your account secure and to use CVRabbit only for
        your own professional information. Your uploaded files are stored privately and
        are never made public.
      </p>

      <Separator className="my-6" />

      <div className="flex items-center justify-between gap-3 text-[0.72rem] text-charcoal/60">
        <Link href="/" className="inline-flex items-center gap-1.5 hover:text-onyx">
          <ArrowLeft className="size-3.5" />
          Back to home
        </Link>
        <span>Private by design</span>
      </div>
    </div>
  );
}
