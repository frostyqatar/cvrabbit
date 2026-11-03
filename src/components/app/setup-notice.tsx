import Link from "next/link";
import { AlertTriangle, ArrowLeft, Database, KeyRound } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export function SetupNotice() {
  return (
    <div className="flex min-h-dvh flex-col bg-mint">
      <header className="border-b border-onyx/[0.07]">
        <div className="container-page flex h-16 items-center">
          <Link href="/">
            <Logo />
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-12">
        <div className="w-full max-w-xl rounded-2xl border border-onyx/10 bg-white p-6 shadow-soft sm:p-8">
          <div className="flex size-11 items-center justify-center rounded-xl bg-warning/10 text-warning">
            <AlertTriangle className="size-5" />
          </div>
          <h1 className="mt-5 font-serif text-3xl tracking-[-0.02em] text-onyx">
            Connect the CRGT project.
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-charcoal">
            CVRabbit is fully built, but this deployment does not have Supabase credentials
            yet. Add the existing CRGT project&apos;s URL and public key, then apply the
            included migration.
          </p>

          <div className="mt-6 space-y-3">
            <div className="rounded-xl border border-onyx/10 bg-mint/60 p-4">
              <p className="flex items-center gap-2 text-xs font-bold tracking-[0.12em] text-jet uppercase">
                <KeyRound className="size-3.5" />
                Environment
              </p>
              <pre className="mt-2 overflow-x-auto text-[0.72rem] leading-relaxed text-charcoal">
{`NEXT_PUBLIC_SUPABASE_URL=https://<crgt-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-or-publishable-key>`}
              </pre>
            </div>

            <div className="rounded-xl border border-onyx/10 bg-mint/60 p-4">
              <p className="flex items-center gap-2 text-xs font-bold tracking-[0.12em] text-jet uppercase">
                <Database className="size-3.5" />
                Database
              </p>
              <p className="mt-2 text-[0.8rem] leading-relaxed text-charcoal">
                Apply{" "}
                <code className="rounded bg-white px-1 py-0.5 text-[0.72rem]">
                  supabase/migrations/20261103000100_cvrabbit_init.sql
                </code>{" "}
                in the Supabase SQL editor. It creates the CV table, row-level security, the
                private <code className="text-[0.72rem]">cv-originals</code> bucket, and its
                owner-only policies.
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="outline">
              <Link href="/">
                <ArrowLeft className="size-4" />
                Back to home
              </Link>
            </Button>
            <Button asChild>
              <Link href="/login?next=/dashboard">I&apos;ve added the keys</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
