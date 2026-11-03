import type { SupabaseClient } from "@supabase/supabase-js";

import { createBlankCv } from "@/lib/cv/defaults";
import { normalizeData, normalizeSettings, normalizeTitle } from "@/lib/cv/normalize";
import type { CvData, CvRecord, CvSettings, CvSummary } from "@/lib/cv/types";

const SUMMARY_COLUMNS =
  "id,title,data,settings,source_file_name,created_at,updated_at,user_id,source_file_path,source_file_type,source_file_size,extraction_status,revision";

export function mapCvRow(row: Record<string, unknown>): CvRecord {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    title: normalizeTitle(row.title),
    data: normalizeData(row.data),
    settings: normalizeSettings(row.settings),
    source_file_path: (row.source_file_path as string | null) ?? null,
    source_file_name: (row.source_file_name as string | null) ?? null,
    source_file_type: (row.source_file_type as string | null) ?? null,
    source_file_size: row.source_file_size == null ? null : Number(row.source_file_size),
    extraction_status:
      (row.extraction_status as CvRecord["extraction_status"]) ?? "none",
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    revision: Number(row.revision ?? 1),
  };
}

export function mapCvSummary(row: Record<string, unknown>): CvSummary {
  const cv = mapCvRow(row);
  return {
    id: cv.id,
    title: cv.title,
    data: cv.data,
    settings: cv.settings,
    source_file_name: cv.source_file_name,
    created_at: cv.created_at,
    updated_at: cv.updated_at,
  };
}

export async function listCvs(supabase: SupabaseClient, userId: string): Promise<CvSummary[]> {
  const { data, error } = await supabase
    .from("cvs")
    .select(SUMMARY_COLUMNS)
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapCvSummary(row as Record<string, unknown>));
}

export async function getCv(
  supabase: SupabaseClient,
  userId: string,
  id: string,
): Promise<CvRecord | null> {
  const { data, error } = await supabase
    .from("cvs")
    .select(SUMMARY_COLUMNS)
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapCvRow(data as Record<string, unknown>) : null;
}

export interface CreateCvInput {
  id?: string;
  title?: string;
  data?: CvData;
  settings?: CvSettings;
  sourceFilePath?: string | null;
  sourceFileName?: string | null;
  sourceFileType?: string | null;
  sourceFileSize?: number | null;
  extractionStatus?: CvRecord["extraction_status"];
}

export async function createCv(
  supabase: SupabaseClient,
  userId: string,
  input: CreateCvInput = {},
): Promise<CvRecord> {
  const blank = createBlankCv();
  const { data, error } = await supabase
    .from("cvs")
    .insert({
      ...(input.id ? { id: input.id } : {}),
      user_id: userId,
      title: normalizeTitle(input.title ?? blank.title),
      data: input.data ?? blank.data,
      settings: input.settings ?? blank.settings,
      source_file_path: input.sourceFilePath ?? null,
      source_file_name: input.sourceFileName ?? null,
      source_file_type: input.sourceFileType ?? null,
      source_file_size: input.sourceFileSize ?? null,
      extraction_status: input.extractionStatus ?? "none",
    })
    .select(SUMMARY_COLUMNS)
    .single();

  if (error) throw new Error(error.message);
  return mapCvRow(data as Record<string, unknown>);
}

export async function saveCv(
  supabase: SupabaseClient,
  userId: string,
  id: string,
  payload: { title: string; data: CvData; settings: CvSettings },
): Promise<CvRecord> {
  const { data, error } = await supabase
    .from("cvs")
    .update({
      title: normalizeTitle(payload.title),
      data: payload.data,
      settings: payload.settings,
    })
    .eq("id", id)
    .eq("user_id", userId)
    .select(SUMMARY_COLUMNS)
    .single();

  if (error) throw new Error(error.message);
  return mapCvRow(data as Record<string, unknown>);
}

export async function finalizeCv(
  supabase: SupabaseClient,
  userId: string,
  id: string,
  payload: {
    title: string;
    data: CvData;
    settings: CvSettings;
    extractionStatus: CvRecord["extraction_status"];
  },
): Promise<CvRecord> {
  const { data, error } = await supabase
    .from("cvs")
    .update({
      title: normalizeTitle(payload.title),
      data: payload.data,
      settings: payload.settings,
      extraction_status: payload.extractionStatus,
    })
    .eq("id", id)
    .eq("user_id", userId)
    .select(SUMMARY_COLUMNS)
    .single();

  if (error) throw new Error(error.message);
  return mapCvRow(data as Record<string, unknown>);
}

export async function renameCv(
  supabase: SupabaseClient,
  userId: string,
  id: string,
  title: string,
): Promise<void> {
  const { error } = await supabase
    .from("cvs")
    .update({ title: normalizeTitle(title) })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
}

export async function updateExtractionStatus(
  supabase: SupabaseClient,
  userId: string,
  id: string,
  status: CvRecord["extraction_status"],
): Promise<void> {
  const { error } = await supabase
    .from("cvs")
    .update({ extraction_status: status })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
}

export async function duplicateCv(
  supabase: SupabaseClient,
  userId: string,
  source: CvRecord,
): Promise<CvRecord> {
  return createCv(supabase, userId, {
    title: `${source.title} (copy)`.slice(0, 120),
    data: source.data,
    settings: source.settings,
    sourceFileName: source.source_file_name,
    sourceFileType: source.source_file_type,
    sourceFileSize: source.source_file_size,
    extractionStatus: source.extraction_status,
    // The original file is not copied; the duplicate starts without a private attachment.
    sourceFilePath: null,
  });
}

export async function deleteCv(
  supabase: SupabaseClient,
  userId: string,
  cv: Pick<CvRecord, "id" | "source_file_path">,
): Promise<void> {
  if (cv.source_file_path) {
    const { error: storageError } = await supabase.storage
      .from("cv-originals")
      .remove([cv.source_file_path]);
    // A missing file should not prevent deleting the CV itself.
    if (storageError && !/not found/i.test(storageError.message)) {
      console.warn("Could not remove original file", storageError.message);
    }
  }

  const { error } = await supabase
    .from("cvs")
    .delete()
    .eq("id", cv.id)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
}
