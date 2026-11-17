import { supabase } from "@/auth/supabase";
import type { StoredFile } from "./types";

export const BUCKET = "datasets";

/** Object names are kept simple and safe; the user's id is the first path segment (enforced by RLS). */
export function safeObjectName(fileName: string): string {
  const cleaned = fileName.normalize("NFKC").replace(/[^\p{L}\p{N}._ -]+/gu, "_").replace(/^\.+/, "").slice(0, 120);
  return cleaned || "file";
}

function setupHint(message: string): string {
  return /bucket not found|not found/i.test(message)
    ? "File storage is not set up yet. Run the SQL migration from the README in your Supabase project."
    : message;
}

export async function listFiles(userId: string): Promise<StoredFile[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.storage.from(BUCKET).list(userId, { limit: 200, sortBy: { column: "created_at", order: "asc" } });
  if (error) throw new Error(setupHint(error.message));
  return (data ?? [])
    .filter((o) => o.name && !o.name.startsWith("."))
    .map((o) => ({
      name: o.name,
      size: Number((o.metadata as { size?: number } | null)?.size ?? 0),
      updatedAt: o.updated_at ?? o.created_at ?? null,
    }));
}

export async function uploadFile(userId: string, file: File): Promise<void> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { error } = await supabase.storage.from(BUCKET).upload(`${userId}/${safeObjectName(file.name)}`, file, { upsert: true, contentType: file.type || undefined });
  if (error) throw new Error(setupHint(error.message));
}

export async function downloadFile(userId: string, name: string): Promise<ArrayBuffer> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.storage.from(BUCKET).download(`${userId}/${name}`);
  if (error || !data) throw new Error(error?.message ?? "Download failed.");
  return data.arrayBuffer();
}

export async function removeStoredFile(userId: string, name: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.storage.from(BUCKET).remove([`${userId}/${name}`]);
  if (error) throw new Error(error.message);
}
