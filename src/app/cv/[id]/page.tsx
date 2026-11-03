import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { SetupNotice } from "@/components/app/setup-notice";
import { EditorClient } from "@/components/editor/editor-client";
import { getCv } from "@/lib/supabase/data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  if (!isSupabaseConfigured()) return { title: "CV editor" };
  const { id } = await params;
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { title: "CV editor" };
    const cv = await getCv(supabase, user.id, id);
    return {
      title: cv?.title ?? "CV editor",
      robots: { index: false, follow: false },
    };
  } catch {
    return { title: "CV editor" };
  }
}

export default async function CvEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!isSupabaseConfigured()) {
    return <SetupNotice />;
  }

  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/cv/${id}`)}`);
  }

  let cv;
  try {
    cv = await getCv(supabase, user.id, id);
  } catch {
    notFound();
  }

  if (!cv) notFound();

  return <EditorClient cv={cv} userId={user.id} />;
}
