import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Check, LockKeyhole, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { LoginForm } from "@/components/auth/login-form";
import { Logo } from "@/components/brand/logo";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to CVRabbit with Google.",
  robots: { index: false, follow: false },
};

function safeNext(value: string | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  return value;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string; error_description?: string }>;
}) {
  const params = await searchParams;
  const configured = isSupabaseConfigured();

  if (configured) {
    try {
      const supabase = await createSupabaseServerClient();
      const { data } = await supabase.auth.getClaims();
      if (data?.claims?.sub) {
        redirect(safeNext(params.next));
      }
    } catch {
      // The form will surface connection problems.
    }
  }

  const error = params.error_description ?? params.error;

  return (
    <div className="grid min-h-dvh bg-mint lg:grid-cols-[0.92fr_1.08fr]">
      <aside className="relative hidden overflow-hidden bg-onyx px-10 py-12 text-mint lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute inset-0 opacity-[0.14] [background-image:radial-gradient(rgba(244,255,248,0.5)_1px,transparent_1px)] [background-size:20px_20px] [mask-image:radial-gradient(ellipse_at_30%_20%,black,transparent_75%)]" />
        <Link href="/" className="relative">
          <Logo tone="light" markClassName="size-10" wordmarkClassName="text-lg" />
        </Link>

        <div className="relative max-w-md">
          <p className="font-serif text-[2.8rem] leading-[1.02] tracking-[-0.025em]">
            The best CV is the one that still
            <span className="italic text-steel"> sounds like you.</span>
          </p>
          <p className="mt-5 text-sm leading-relaxed text-mint/60">
            CVRabbit gives your experience structure without changing your voice. Upload,
            refine, and generate — with your information kept private.
          </p>

          <div className="mt-9 space-y-3.5">
            {[
              "Private storage for your originals",
              "Automatic saving as you type",
              "Seven professional PDF designs",
              "Delete everything whenever you choose",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-[0.82rem] text-mint/80">
                <span className="flex size-5 items-center justify-center rounded-full border border-mint/20 bg-mint/5">
                  <Check className="size-3 text-steel" strokeWidth={2.5} />
                </span>
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center gap-4 text-[0.7rem] text-mint/40">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="size-3.5" />
            Row-level security
          </span>
          <span className="inline-flex items-center gap-1.5">
            <LockKeyhole className="size-3.5" />
            Private bucket
          </span>
        </div>
      </aside>

      <main className="flex min-h-dvh flex-col">
        <div className="flex items-center justify-between border-b border-onyx/[0.07] px-5 py-4 lg:hidden">
          <Link href="/">
            <Logo markClassName="size-8" wordmarkClassName="text-base" />
          </Link>
          <span className="text-[0.7rem] text-charcoal/60">Private by design</span>
        </div>
        <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8 lg:px-14">
          <div className="w-full max-w-[26rem]">
            <LoginForm
              configured={configured}
              initialError={error}
              nextPath={safeNext(params.next)}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
