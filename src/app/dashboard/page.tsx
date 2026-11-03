import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AppHeader } from "@/components/app/app-header";
import { SetupNotice } from "@/components/app/setup-notice";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { listCvs } from "@/lib/supabase/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your CVs",
  robots: { index: false, follow: false },
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  if (!isSupabaseConfigured()) {
    return <SetupNotice />;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  let cvs: Awaited<ReturnType<typeof listCvs>> = [];
  try {
    cvs = await listCvs(supabase, user.id);
  } catch {
    cvs = [];
  }

  const params = await searchParams;
  const name =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    null;
  const avatar =
    (user.user_metadata?.avatar_url as string | undefined) ??
    (user.user_metadata?.picture as string | undefined) ??
    null;

  return (
    <div className="min-h-dvh bg-mint">
      <AppHeader email={user.email ?? ""} name={name} avatarUrl={avatar} />
      <main className="container-page py-8 sm:py-12">
        <DashboardClient
          userId={user.id}
          initialCvs={cvs}
          autoNew={params.new === "1"}
        />
      </main>
    </div>
  );
}
