import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col bg-mint">
      <header className="border-b border-onyx/[0.07]">
        <div className="container-page flex h-16 items-center">
          <Link href="/">
            <Logo />
          </Link>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-5 py-16">
        <div className="max-w-md text-center">
          <p className="font-serif text-6xl text-steel">404</p>
          <h1 className="mt-3 font-serif text-3xl tracking-[-0.02em] text-onyx">
            This page is not here.
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-charcoal">
            The CV may have been deleted, or the link may be incorrect. Your other CVs are
            waiting in your workspace.
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Button asChild variant="outline">
              <Link href="/">Home</Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard">Your CVs</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
