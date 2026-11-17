import { supabase } from "@/auth/supabase";
import type { SchemaPayload } from "./types";

export type SqlAnswer = { sql: string | null; title: string; reason: string; follow_ups: string[] };
export type SummaryAnswer = { summary: string; follow_ups: string[] };

export type AskCall =
  | { mode: "sql"; question: string; today: string; schema: SchemaPayload; history: { question: string; sql?: string }[]; repair?: { sql: string; error: string } }
  | { mode: "summary"; question: string; sql: string; columns: string[]; rows: Record<string, string | number | null>[]; rowCount: number; truncated: boolean };

export class AiError extends Error {
  constructor(message: string, readonly status?: number) { super(message); }
}

/** Calls the `ask-sql` Supabase Edge Function. The AI key never reaches the browser. */
export async function callAsk<T extends SqlAnswer | SummaryAnswer>(body: AskCall): Promise<T> {
  if (!supabase) throw new AiError("Supabase is not configured.");
  const { data, error } = await supabase.functions.invoke("ask-sql", { body });
  if (error) {
    let msg = "The AI service is not reachable. Check that the ask-sql function is deployed.";
    let status: number | undefined;
    const ctx = (error as { context?: Response }).context;
    if (ctx && typeof ctx.json === "function") {
      status = ctx.status;
      try { const j = await ctx.json(); if (j?.error) msg = String(j.error); } catch { /* keep default */ }
    }
    throw new AiError(msg, status);
  }
  if (!data || typeof data !== "object") throw new AiError("Empty response from the AI service.");
  return data as T;
}
