import Link from "next/link";
import {
  ArrowRight,
  Check,
  FileDown,
  FileUp,
  Layers,
  LockKeyhole,
  MoveRight,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TemplateThumb } from "@/components/templates/template-thumb";
import { TEMPLATES } from "@/lib/cv/templates";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

async function getViewer() {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getClaims();
    return data?.claims ?? null;
  } catch {
    return null;
  }
}

function HeroDocument() {
  return (
    <div className="relative mx-auto w-full max-w-[430px]">
      <div className="absolute -inset-8 -z-10 rounded-[3rem] bg-[radial-gradient(circle_at_70%_20%,rgba(139,170,173,0.35),transparent_62%)] blur-2xl" />
      <div className="animate-rise relative rotate-[-2.2deg] rounded-[1.4rem] border border-onyx/10 bg-white p-6 shadow-[0_2px_0_rgba(0,15,8,0.04),0_40px_80px_-40px_rgba(0,15,8,0.45)] sm:p-8">
        <div className="border-b border-onyx/10 pb-5 text-center">
          <p className="font-serif text-[1.65rem] leading-none tracking-[-0.02em] text-onyx">
            Amara Okafor
          </p>
          <p className="mt-2 text-[0.6rem] font-semibold tracking-[0.2em] text-jet/70 uppercase">
            Senior Product Manager
          </p>
          <p className="mt-2 text-[0.58rem] text-charcoal/70">
            London, UK · amara.okafor@example.com · +44 7700 900 118
          </p>
        </div>

        <div className="mt-5 space-y-5">
          <div>
            <p className="text-[0.55rem] font-bold tracking-[0.18em] text-jet uppercase">
              Profile
            </p>
            <p className="mt-1.5 text-[0.62rem] leading-[1.65] text-charcoal">
              Product leader with nine years of experience building financial and consumer
              products used by more than two million people. Known for turning ambiguous
              problems into focused roadmaps.
            </p>
          </div>

          <div>
            <p className="text-[0.55rem] font-bold tracking-[0.18em] text-jet uppercase">
              Experience
            </p>
            <div className="mt-2 space-y-3">
              <div>
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-[0.66rem] font-bold text-onyx">Senior Product Manager</p>
                  <p className="shrink-0 text-[0.52rem] text-charcoal/60">2021 — Present</p>
                </div>
                <p className="text-[0.56rem] text-charcoal/75">Northwind Financial · London</p>
                <ul className="mt-1.5 space-y-1 pl-3">
                  <li className="relative text-[0.56rem] leading-[1.55] text-charcoal before:absolute before:top-[0.42em] before:-left-3 before:size-[2px] before:rounded-full before:bg-jet">
                    Reduced account opening time from 11 minutes to 4.
                  </li>
                  <li className="relative text-[0.56rem] leading-[1.55] text-charcoal before:absolute before:top-[0.42em] before:-left-3 before:size-[2px] before:rounded-full before:bg-jet">
                    Grew validated releases from 3 to 14 per quarter.
                  </li>
                </ul>
              </div>
              <div className="opacity-70">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-[0.64rem] font-bold text-onyx">Product Manager</p>
                  <p className="shrink-0 text-[0.52rem] text-charcoal/60">2018 — 2021</p>
                </div>
                <p className="text-[0.55rem] text-charcoal/75">Lumen Health · Manchester</p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-[0.55rem] font-bold tracking-[0.18em] text-jet uppercase">
              Skills
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {["Discovery", "Roadmapping", "SQL", "Experimentation", "Coaching"].map(
                (skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-onyx/10 bg-mint px-2 py-[3px] text-[0.5rem] font-medium text-jet"
                  >
                    {skill}
                  </span>
                ),
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="animate-fade absolute -top-3 -right-2 flex items-center gap-1.5 rounded-full border border-white/50 bg-white/95 px-3 py-1.5 shadow-soft backdrop-blur sm:-right-6">
        <span className="flex size-4 items-center justify-center rounded-full bg-success/12 text-success">
          <Check className="size-2.5" strokeWidth={3} />
        </span>
        <span className="text-[0.62rem] font-semibold text-onyx">Saved</span>
      </div>

      <div className="animate-fade absolute -bottom-4 -left-2 flex items-center gap-2 rounded-2xl border border-white/60 bg-jet px-3 py-2 text-mint shadow-soft sm:-left-6">
        <Layers className="size-3.5 text-steel" />
        <div className="leading-tight">
          <p className="text-[0.58rem] font-semibold">7 designs</p>
          <p className="text-[0.48rem] text-mint/60">One source of truth</p>
        </div>
      </div>
    </div>
  );
}

export default async function LandingPage() {
  const claims = await getViewer();
  const signedIn = Boolean(claims?.sub);

  return (
    <div className="min-h-dvh overflow-x-clip bg-mint">
      <header className="sticky top-0 z-40 border-b border-onyx/[0.07] bg-mint/85 backdrop-blur-xl">
        <div className="container-page flex h-16 items-center justify-between gap-4 sm:h-[4.5rem]">
          <Link href="/" aria-label="CVRabbit home">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-7 text-[0.82rem] font-medium text-charcoal md:flex">
            <a href="#how" className="transition-colors hover:text-onyx">
              How it works
            </a>
            <a href="#templates" className="transition-colors hover:text-onyx">
              Templates
            </a>
            <a href="#privacy" className="transition-colors hover:text-onyx">
              Privacy
            </a>
          </nav>
          <div className="flex items-center gap-2">
            {signedIn ? (
              <Button asChild size="sm" className="h-9 px-4">
                <Link href="/dashboard">
                  Dashboard
                  <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm" className="hidden h-9 px-3 sm:inline-flex">
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button asChild size="sm" className="h-9 px-4">
                  <Link href="/login">
                    Get started
                    <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative">
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute -top-40 -left-40 size-[34rem] rounded-full bg-[radial-gradient(circle,rgba(139,170,173,0.28),transparent_65%)] blur-2xl" />
            <div className="absolute top-24 right-0 size-[28rem] rounded-full bg-[radial-gradient(circle,rgba(28,55,56,0.10),transparent_70%)] blur-2xl" />
            <div className="cv-dots absolute inset-x-0 bottom-0 h-72 opacity-40 [mask-image:linear-gradient(to_top,black,transparent)]" />
          </div>

          <div className="container-page grid items-center gap-14 py-16 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:py-28">
            <div className="animate-rise max-w-xl">
              <Badge variant="steel" className="mb-5 gap-1.5 px-3 py-1">
                <LockKeyhole className="size-3" />
                Private by design
              </Badge>
              <h1 className="font-serif text-[3.1rem] leading-[0.98] tracking-[-0.025em] text-onyx sm:text-[4.1rem] lg:text-[4.4rem]">
                Your career,
                <br />
                beautifully
                <br />
                <span className="italic text-jet">in order.</span>
              </h1>
              <p className="mt-6 max-w-md text-[1rem] leading-relaxed text-charcoal sm:text-[1.05rem]">
                Upload the CV you already have. Refine it in a calm, structured editor.
                Generate a considered PDF in the design that fits the role.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button asChild size="lg" className="h-12 px-6">
                  <Link href="/login">
                    Get started free
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-12 border-onyx/15 bg-white/60 px-6">
                  <a href="#templates">Explore templates</a>
                </Button>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.72rem] font-medium text-charcoal/80">
                <span className="inline-flex items-center gap-1.5">
                  <Check className="size-3.5 text-success" strokeWidth={2.5} />
                  Private storage
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Check className="size-3.5 text-success" strokeWidth={2.5} />
                  No AI rewriting
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Check className="size-3.5 text-success" strokeWidth={2.5} />
                  No credit card
                </span>
              </div>
            </div>

            <div className="relative px-3 sm:px-8 lg:px-0">
              <HeroDocument />
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="border-t border-onyx/[0.07] bg-white/60">
          <div className="container-page py-16 sm:py-24">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
              <div>
                <p className="text-[0.7rem] font-bold tracking-[0.2em] text-steel uppercase">
                  How it works
                </p>
                <h2 className="mt-3 max-w-sm font-serif text-[2.35rem] leading-[1.02] tracking-[-0.02em] text-onyx sm:text-[2.9rem]">
                  Upload once.
                  <br />
                  <span className="italic text-jet">Edit with clarity.</span>
                </h2>
                <p className="mt-4 max-w-sm text-sm leading-relaxed text-charcoal">
                  No blank-page anxiety and no automated rewrites. CVRabbit reads your
                  existing CV, puts its contents into editable sections, and leaves every
                  decision to you.
                </p>
              </div>

              <div className="divide-y divide-onyx/10 border-y border-onyx/10">
                {[
                  {
                    icon: FileUp,
                    title: "Bring your CV",
                    body: "Drop in a PDF or DOCX. We extract the text and organise it into clear sections — you review every detail before it is saved.",
                  },
                  {
                    icon: SlidersHorizontal,
                    title: "Make it yours",
                    body: "Adjust roles, education, and hierarchical skills. Reorder anything. Every change saves automatically; optional fields simply disappear when empty.",
                  },
                  {
                    icon: FileDown,
                    title: "Generate the right version",
                    body: "Choose from seven distinct designs, tune the accent and density, preview your real content, and download a clean, selectable A4 PDF.",
                  },
                ].map((step, index) => (
                  <div key={step.title} className="flex gap-5 py-6 sm:gap-7 sm:py-8">
                    <div className="flex flex-col items-center gap-2">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-onyx/10 bg-mint text-jet">
                        <step.icon className="size-4.5" strokeWidth={1.8} />
                      </span>
                      <span className="font-serif text-xs text-charcoal/50">
                        0{index + 1}
                      </span>
                    </div>
                    <div className="pt-0.5">
                      <h3 className="text-[1.02rem] font-semibold tracking-[-0.015em] text-onyx">
                        {step.title}
                      </h3>
                      <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-charcoal">
                        {step.body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Feature band */}
        <section className="bg-mint">
          <div className="container-page py-16 sm:py-24">
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                {
                  icon: Layers,
                  title: "Many versions, one account",
                  body: "Keep a tailored CV for each direction. Duplicate, rename, and switch without rebuilding your history.",
                },
                {
                  icon: ShieldCheck,
                  title: "Yours alone",
                  body: "Row-level security and a private storage bucket mean no other account can read your CV or its original file.",
                },
                {
                  icon: FileDown,
                  title: "A PDF that behaves",
                  body: "Real selectable text, working links, consistent margins, and page breaks that never clip a line.",
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-onyx/[0.08] bg-white/70 p-6 shadow-[0_1px_0_rgba(0,15,8,0.04)] transition-transform duration-200 ease-out hover:-translate-y-0.5"
                >
                  <feature.icon className="size-5 text-jet" strokeWidth={1.7} />
                  <h3 className="mt-5 text-[0.98rem] font-semibold text-onyx">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-charcoal">{feature.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Templates */}
        <section id="templates" className="border-y border-onyx/[0.07] bg-white">
          <div className="container-page py-16 sm:py-24">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <p className="text-[0.7rem] font-bold tracking-[0.2em] text-steel uppercase">
                  Seven considered designs
                </p>
                <h2 className="mt-3 max-w-xl font-serif text-[2.35rem] leading-[1.02] tracking-[-0.02em] text-onyx sm:text-[2.9rem]">
                  A different room for every <span className="italic text-jet">ambition.</span>
                </h2>
              </div>
              <p className="max-w-xs text-sm leading-relaxed text-charcoal">
                From quietly classic to unapologetically minimal. Every template uses the
                same content, so you can compare without retyping.
              </p>
            </div>

            <div className="mt-9 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-7">
              {TEMPLATES.map((template) => (
                <Link
                  key={template.id}
                  href="/login"
                  className="group flex flex-col gap-2.5 rounded-xl p-1.5 transition-colors duration-150 hover:bg-mint/70"
                >
                  <div className="overflow-hidden rounded-lg border border-onyx/10 shadow-[0_10px_24px_-18px_rgba(0,15,8,0.4)] transition-transform duration-200 ease-out group-hover:-translate-y-1">
                    <TemplateThumb
                      template={template.id}
                      name="Amara Okafor"
                      role={template.shortName}
                      accent={template.id === "executive" ? "#1c3738" : "#1c3738"}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-1 px-0.5">
                    <span className="text-[0.72rem] font-semibold text-onyx">{template.shortName}</span>
                    <MoveRight className="size-3 text-steel opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Privacy */}
        <section id="privacy" className="relative overflow-hidden bg-onyx text-mint">
          <div className="pointer-events-none absolute inset-0 opacity-[0.16] [background-image:radial-gradient(rgba(244,255,248,0.5)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
          <div className="container-page relative grid gap-12 py-16 sm:py-24 lg:grid-cols-[1fr_0.9fr] lg:gap-20">
            <div>
              <Badge className="mb-5 border-mint/15 bg-mint/10 text-mint">
                Privacy, not as an afterthought
              </Badge>
              <h2 className="max-w-lg font-serif text-[2.4rem] leading-[1.02] tracking-[-0.02em] sm:text-[3rem]">
                Your CV contains your life.
                <br />
                <span className="italic text-steel">We treat it that way.</span>
              </h2>
              <p className="mt-5 max-w-md text-sm leading-relaxed text-mint/70">
                No public links to your original file. No sharing between accounts. No
                training on your personal information. You can remove a CV and its
                original file at any time.
              </p>
              <div className="mt-8">
                <Button asChild variant="secondary" className="bg-mint text-onyx hover:bg-white">
                  <Link href="/login">
                    Create your private workspace
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {[
                {
                  title: "Row-level security",
                  body: "Every query is scoped to your authenticated user ID at the database level.",
                },
                {
                  title: "Private file storage",
                  body: "Originals live in a non-public bucket, reachable only through your session.",
                },
                {
                  title: "Real deletion",
                  body: "Deleting a CV removes the record and its stored original. Nothing is archived behind the scenes.",
                },
                {
                  title: "No AI rewriting",
                  body: "Your words stay your words. Extraction only reorganises what is already there.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-xl border border-mint/12 bg-mint/[0.045] p-4 backdrop-blur-sm"
                >
                  <div className="flex items-start gap-3">
                    <Check className="mt-0.5 size-4 shrink-0 text-steel" strokeWidth={2.5} />
                    <div>
                      <p className="text-sm font-semibold">{item.title}</p>
                      <p className="mt-1 text-[0.8rem] leading-relaxed text-mint/60">{item.body}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-mint">
          <div className="container-page py-16 sm:py-24">
            <div className="relative overflow-hidden rounded-[1.75rem] border border-onyx/10 bg-white px-6 py-12 text-center shadow-soft sm:px-12 sm:py-16">
              <div className="pointer-events-none absolute -top-24 left-1/2 size-72 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(139,170,173,0.28),transparent_70%)] blur-2xl" />
              <p className="text-[0.7rem] font-bold tracking-[0.2em] text-steel uppercase">
                Ready when you are
              </p>
              <h2 className="mx-auto mt-3 max-w-2xl font-serif text-[2.5rem] leading-[1.02] tracking-[-0.02em] text-onyx sm:text-[3.2rem]">
                Give your experience the <span className="italic text-jet">presentation</span> it deserves.
              </h2>
              <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-charcoal">
                Sign in with Google, bring your existing CV, and leave with something you
                are glad to send.
              </p>
              <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button asChild size="lg" className="h-12 px-6">
                  <Link href="/login">
                    Get started free
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="lg" className="h-12 px-5">
                  <a href="#how">See how it works</a>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-onyx/[0.07] bg-white/50">
        <div className="container-page flex flex-col gap-5 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Logo markClassName="size-7" wordmarkClassName="text-sm" />
            <span className="text-[0.7rem] text-charcoal/60">
              A calmer way to manage your CV.
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.72rem] text-charcoal/70">
            <a href="#templates" className="hover:text-onyx">
              Templates
            </a>
            <a href="#privacy" className="hover:text-onyx">
              Privacy
            </a>
            <Link href="/login" className="hover:text-onyx">
              Sign in
            </Link>
            <span className="text-charcoal/40">
              © {new Date().getFullYear()} CVRabbit
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
