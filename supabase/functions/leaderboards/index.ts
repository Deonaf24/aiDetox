// supabase/functions/leaderboards/index.ts
// Leaderboard API -> wraps Postgres RPC:
//   - lb_offgrid_streak

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
} as const;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "content-type": "application/json" },
  });
}

function err(message: string, status = 500, details?: unknown) {
  return json({ error: message, details }, status);
}

// Prefer platform-injected URL; fall back to your project ref.
const SUPABASE_URL =
  Deno.env.get("SUPABASE_URL") ??
  "https://ltjtjgdjllmbyknaygof.supabase.co";

// Use a non-reserved secret name. (Names starting with SUPABASE_ are skipped.)
const SERVICE_ROLE_KEY =
  Deno.env.get("SERVICE_ROLE_KEY") ??
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? // fallback if you already set it
  "";

serve(async (req: Request) => {
  try {
    if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      return err("missing_env", 500, {
        hasUrl: !!SUPABASE_URL,
        hasServiceRole: !!SERVICE_ROLE_KEY,
      });
    }

    // Accept GET (query params) and POST (JSON body)
    let metric: string | null;

    if (req.method === "GET") {
      const url = new URL(req.url);
      metric = url.searchParams.get("metric");
    } else if (req.method === "POST") {
      const body = await req.json().catch(() => ({} as any));
      metric = body.metric ?? null;
    } else {
      return new Response("Method Not Allowed", { status: 405, headers: CORS });
    }

    // Validate metric
    if (String(metric) !== "novisit") {
      return err("invalid_metric", 400, { metric });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Require auth user
    const authHeader =
      req.headers.get("authorization") ?? req.headers.get("Authorization") ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!token) return err("login_required", 401);
    const { data: { user }, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !user) return err("login_required", 401);
    const meId = user.id;

    // Collect friends
    const { data: friendRows, error: friendsErr } = await supabase
      .from("friends")
      .select("owner, friend")
      .or(`owner.eq.${meId},friend.eq.${meId}`);

    if (friendsErr) return err("friends_query_failed", 500, friendsErr.message);

    const friendIds = new Set<string>([meId]);
    for (const row of friendRows ?? []) {
      friendIds.add(row.owner === meId ? row.friend : row.owner);
    }

    // 6-month window
    const since = new Date();
    since.setMonth(since.getMonth() - 6);

    // RPC name for Off-Grid leaderboard
    const rpcName = "lb_offgrid_streak";

    const { data, error } = await supabase.rpc(rpcName, {
      p_since: since.toISOString(),
    });

    if (error) return err("rpc_failed", 500, error.message);

    // Shape + rank (names are resolved later)
    let entries = (data ?? [])
      .map((r: any) => ({
        id: r.identity ? String(r.identity) : "",
        val: Number(r.value) || 0,
      }))
      .filter((e: any) => e.id)
      .sort((a: any, b: any) => b.val - a.val);

    entries = entries.filter((e) => friendIds.has(e.id));

    const existing = new Set(entries.map((e) => e.id));
    const missing = [...friendIds].filter((id) => !existing.has(id));

    for (const id of missing) {
      entries.push({ id, val: 0 });
    }

    entries.sort((a, b) => b.val - a.val);

    const allIds = new Set(entries.map((e) => e.id));
    allIds.add(meId);

    const nameMap = new Map<string, string>();
    if (allIds.size > 0) {
      const { data: profiles, error: profilesErr } = await supabase
        .from("profiles")
        .select("id, username")
        .in("id", Array.from(allIds));
      if (profilesErr) return err("profiles_query_failed", 500, profilesErr.message);

      for (const row of profiles ?? []) {
        nameMap.set(
          String(row.id),
          row.username || "Unnamed",
        );
      }

      for (const id of allIds) {
        if (!nameMap.has(id)) nameMap.set(id, "Unnamed");
      }
    }

    const meRank = entries.findIndex((e) => e.id === meId) + 1;
    const list = entries;

    const resolveName = (id: string) => {
      if (nameMap.has(id)) return nameMap.get(id)!;
      const clean = String(id).startsWith("dev_") ? String(id).slice(4) : String(id);
      return clean.slice(0, 10);
    };

    const namedList = list.map((e) => ({
      ...e,
      name: e.id === meId ? "You" : resolveName(e.id),
    }));

    const meRow = meId
      ? {
          rank: meRank,
          id: meId,
          name: resolveName(meId),
          val: entries[meRank - 1]?.val ?? 0,
        }
      : null;
    return json({ entries: namedList, me: meRow });
  } catch (e) {
    return err("unhandled", 500, String(e));
  }
});
