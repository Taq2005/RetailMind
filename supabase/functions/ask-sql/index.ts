
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  BadRequest,
  buildSqlMessages,
  buildSummaryMessages,
  parseRequest,
  parseSqlAnswer,
  parseSummaryAnswer,
} from "./core.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

async function callModel(messages: { role: string; content: string }[], maxTokens: number): Promise<string> {
  const base = (Deno.env.get("AI_BASE_URL") ?? "").replace(/\/+$/, "");
  const key = Deno.env.get("AI_API_KEY");
  const model = Deno.env.get("AI_MODEL");
  if (!base || !key || !model) throw new Error("AI provider is not configured.");

  const attempt = async (withJsonMode: boolean) => {
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0,
        max_tokens: maxTokens,
        // Reasoning models (e.g. gpt-oss) spend tokens on thinking first; keep that short.
        ...(/gpt-oss/i.test(model) ? { reasoning_effort: "low" } : {}),
        ...(withJsonMode ? { response_format: { type: "json_object" } } : {}),
      }),
      signal: AbortSignal.timeout(45_000),
    });
    return res;
  };

  let res = await attempt(true);
  if (res.status === 400) res = await attempt(false); // some providers reject response_format
  if (!res.ok) throw new Error(`AI provider error (${res.status}).`);
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) throw new Error("AI provider returned no content.");
  return content;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);

  try {
    // 1) Authenticate the caller.
    const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    if (!jwt) return json({ error: "Please sign in." }, 401);
    const url = Deno.env.get("SUPABASE_URL")!;
    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
    const { data: u, error: uerr } = await admin.auth.getUser(jwt);
    if (uerr || !u?.user) return json({ error: "Please sign in again." }, 401);

    // 2) Validate the request (size-capped).
    const raw = await req.text();
    if (raw.length > 120_000) return json({ error: "Request too large." }, 413);
    let parsed;
    try { parsed = parseRequest(JSON.parse(raw)); } catch (e) {
      if (e instanceof BadRequest) return json({ error: e.message }, 400);
      return json({ error: "Invalid request." }, 400);
    }

    // 3) Per-user daily quota protects the paid API key.
    const limit = Math.max(1, Number(Deno.env.get("AI_DAILY_LIMIT") ?? 100) || 100);
    const { data: allowed, error: qerr } = await admin.rpc("consume_ai_quota", { p_user: u.user.id, p_limit: limit });
    if (qerr) return json({ error: "Usage tracking is not set up. Run the SQL migration." }, 500);
    if (!allowed) return json({ error: `Daily AI limit reached (${limit} requests). Try again tomorrow.` }, 429);

    // 4) Ask the model.
    if (parsed.mode === "sql") {
      const out = await callModel(buildSqlMessages(parsed), 3000);
      return json(parseSqlAnswer(out));
    }
    const out = await callModel(buildSummaryMessages(parsed), 2000);
    return json(parseSummaryAnswer(out));
  } catch (e) {
    if (e instanceof BadRequest) return json({ error: e.message }, 422);
    console.error("ask-sql error:", e instanceof Error ? e.message : e);
    return json({ error: e instanceof Error && /AI provider/.test(e.message) ? e.message : "The AI service failed. Please try again." }, 502);
  }
});