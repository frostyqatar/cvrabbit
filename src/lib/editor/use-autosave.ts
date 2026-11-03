"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { toast } from "sonner";

import { normalizeData, normalizeSettings, normalizeTitle } from "@/lib/cv/normalize";
import type { CvData, CvRecord, CvSettings } from "@/lib/cv/types";
import { saveCv } from "@/lib/supabase/data";

import type { EditorStore } from "./store";

export type SaveStatus = "saved" | "saving" | "error" | "offline";

export interface LocalDraft {
  title: string;
  data: CvData;
  settings: CvSettings;
  savedAt: string;
  baseUpdatedAt: string;
}

export interface AutosaveApi {
  status: SaveStatus;
  lastSavedAt: string;
  errorMessage: string;
  recoveredDraft: LocalDraft | null;
  restoreDraft: () => void;
  discardDraft: () => void;
  retry: () => void;
  flush: () => Promise<void>;
}

function signature(state: { title: string; data: CvData; settings: CvSettings }) {
  return JSON.stringify([state.title, state.data, state.settings]);
}

function readDraft(key: string): LocalDraft | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object") return null;
    return {
      title: normalizeTitle(parsed.title),
      data: normalizeData(parsed.data),
      settings: normalizeSettings(parsed.settings),
      savedAt: typeof parsed.savedAt === "string" ? parsed.savedAt : new Date().toISOString(),
      baseUpdatedAt:
        typeof parsed.baseUpdatedAt === "string" ? parsed.baseUpdatedAt : "",
    };
  } catch {
    return null;
  }
}

export function useAutosave({
  store,
  supabase,
  userId,
  cv,
}: {
  store: EditorStore;
  supabase: SupabaseClient;
  userId: string;
  cv: Pick<CvRecord, "id" | "updated_at">;
}): AutosaveApi {
  const draftKey = `cvrabbit:draft:${cv.id}`;
  const initialSignature = signature(store.getState());
  const savedSignatureRef = useRef(initialSignature);
  const savingRef = useRef(false);
  const queuedRef = useRef(false);
  const persistRef = useRef<() => Promise<void>>(async () => {});
  const retryCountRef = useRef(0);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastedRef = useRef(false);

  const [status, setStatus] = useState<SaveStatus>("saved");
  const [lastSavedAt, setLastSavedAt] = useState(cv.updated_at);
  const [errorMessage, setErrorMessage] = useState("");
  const [recoveredDraft, setRecoveredDraft] = useState<LocalDraft | null>(null);

  const writeDraft = useCallback(() => {
    try {
      const state = store.getState();
      const draft: LocalDraft = {
        title: state.title,
        data: state.data,
        settings: state.settings,
        savedAt: new Date().toISOString(),
        baseUpdatedAt: lastSavedAt,
      };
      window.localStorage.setItem(draftKey, JSON.stringify(draft));
    } catch {
      // Storage can be unavailable in private modes; server saving still works.
    }
  }, [draftKey, lastSavedAt, store]);

  const persist = useCallback(async () => {
    if (savingRef.current) {
      queuedRef.current = true;
      return;
    }

    const state = store.getState();
    const currentSignature = signature(state);
    if (currentSignature === savedSignatureRef.current) {
      setStatus("saved");
      return;
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setStatus("offline");
      writeDraft();
      return;
    }

    savingRef.current = true;
    setStatus("saving");
    setErrorMessage("");

    try {
      const record = await saveCv(supabase, userId, cv.id, {
        title: state.title,
        data: state.data,
        settings: state.settings,
      });

      savedSignatureRef.current = currentSignature;
      setLastSavedAt(record.updated_at);
      setStatus("saved");
      retryCountRef.current = 0;
      toastedRef.current = false;
      setErrorMessage("");
      try {
        window.localStorage.removeItem(draftKey);
      } catch {
        // Ignore storage errors.
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save changes.";
      setStatus("error");
      setErrorMessage(message);
      writeDraft();

      if (!toastedRef.current) {
        toastedRef.current = true;
        toast.error("Unable to save", {
          description: "Your changes are kept on this device. We'll keep trying while you edit.",
        });
      }

      retryCountRef.current += 1;
      const delay = Math.min(60_000, 4_000 * 2 ** Math.max(0, retryCountRef.current - 1));
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      retryTimerRef.current = setTimeout(() => {
        void persistRef.current();
      }, delay);
    } finally {
      savingRef.current = false;
      if (queuedRef.current) {
        queuedRef.current = false;
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
          void persist();
        }, 250);
      }
    }
  }, [cv.id, draftKey, store, supabase, userId, writeDraft]);

  useEffect(() => {
    persistRef.current = persist;
  }, [persist]);

  const scheduleSave = useCallback(
    (delay = 900) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        void persist();
      }, delay);
    },
    [persist],
  );

  useEffect(() => {
    const draft = readDraft(draftKey);
    if (!draft) return;
    const serverUpdated = new Date(cv.updated_at).getTime();
    const draftSaved = new Date(draft.savedAt).getTime();
    const draftSignature = signature(draft);
    if (
      Number.isFinite(draftSaved) &&
      draftSaved > serverUpdated + 1000 &&
      draftSignature !== initialSignature
    ) {
      // Reading a local backup after mount is intentionally an effect: the server
      // cannot know about this device's storage, and reading during render would
      // cause a hydration mismatch.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRecoveredDraft(draft);
    } else {
      try {
        window.localStorage.removeItem(draftKey);
      } catch {
        // Ignore.
      }
    }
  }, [cv.updated_at, draftKey, initialSignature]);

  useEffect(() => {
    const unsubscribe = store.subscribe((state) => {
      const current = signature(state);
      if (current === savedSignatureRef.current) return;

      setStatus(
        typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "saving",
      );
      scheduleSave();
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
      draftTimerRef.current = setTimeout(writeDraft, 500);
    });

    return () => {
      unsubscribe();
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, [draftKey, scheduleSave, store, writeDraft]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (signature(store.getState()) !== savedSignatureRef.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        writeDraft();
        if (signature(store.getState()) !== savedSignatureRef.current) {
          void persist();
        }
      }
    };

    const handleOnline = () => {
      if (signature(store.getState()) !== savedSignatureRef.current) {
        void persist();
      }
    };

    const handleOffline = () => {
      if (signature(store.getState()) !== savedSignatureRef.current) {
        setStatus("offline");
        writeDraft();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [persist, store, writeDraft]);

  const restoreDraft = useCallback(() => {
    if (!recoveredDraft) return;
    const state = store.getState();
    state.setTitle(recoveredDraft.title);
    state.setData(recoveredDraft.data, recoveredDraft.settings);
    setRecoveredDraft(null);
    setStatus("saving");
    scheduleSave(200);
    toast.success("Unsaved changes restored");
  }, [recoveredDraft, scheduleSave, store]);

  const discardDraft = useCallback(() => {
    try {
      window.localStorage.removeItem(draftKey);
    } catch {
      // Ignore.
    }
    setRecoveredDraft(null);
    toast.message("Local backup discarded");
  }, [draftKey]);

  const retry = useCallback(() => {
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    retryCountRef.current = 0;
    toastedRef.current = false;
    void persist();
  }, [persist]);

  const flush = useCallback(async () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    if (signature(store.getState()) === savedSignatureRef.current) return;
    await persist();

    const started = Date.now();
    while (
      signature(store.getState()) !== savedSignatureRef.current &&
      Date.now() - started < 3000
    ) {
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
  }, [persist, store]);

  return {
    status,
    lastSavedAt,
    errorMessage,
    recoveredDraft,
    restoreDraft,
    discardDraft,
    retry,
    flush,
  };
}
