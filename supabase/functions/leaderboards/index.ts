// supabase/functions/leaderboards/index.ts
// Leaderboards API -> wraps Postgres RPCs:
//   - lb_saves
//   - lb_noassist_streak
//   - lb_offgrid_streak

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type Scope = "global" | "friends";

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
    let scope: Scope;
    let meId = "";

    if (req.method === "GET") {
      const url = new URL(req.url);
      metric = url.searchParams.get("metric");
      scope = url.searchParams.get("scope") === "friends" ? "friends" : "global";
      meId = url.searchParams.get("device_id") || "";
    } else if (req.method === "POST") {
      const body = await req.json().catch(() => ({} as any));
      metric = body.metric ?? null;
      scope = body.scope === "friends" ? "friends" : "global";
      meId = body.device_id ?? "";
    } else {
      return new Response("Method Not Allowed", { status: 405, headers: CORS });
    }

    // Validate metric
    if (!["noai", "novisit", "saves"].includes(String(metric))) {
      return err("invalid_metric", 400, { metric });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Parse auth header for optional user context
    const authHeader =
      req.headers.get("authorization") ?? req.headers.get("Authorization") ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    let authUser: any = null;
    if (token) {
      const { data: { user }, error: userErr } = await supabase.auth.getUser(token);
      if (!userErr && user) {
        authUser = user;
        meId = user.id; // prefer auth user id over device_id
      }
    }

    // Collect friends if needed
    let friendIds: Set<string> | null = null;
    if (scope === "friends") {
      if (!authUser) return err("login_required", 401);

      const { data: friendRows, error: friendsErr } = await supabase
        .from("friends")
        .select("owner, friend")
        .or(`owner.eq.${meId},friend.eq.${meId}`);

      if (friendsErr) return err("friends_query_failed", 500, friendsErr.message);

      friendIds = new Set([meId]);
      for (const row of friendRows ?? []) {
        friendIds.add(row.owner === meId ? row.friend : row.owner);
      }
    }

    // 6-month window
    const since = new Date();
    since.setMonth(since.getMonth() - 6);

    // Map metric -> RPC
    const rpcName =
      metric === "saves"
        ? "lb_saves"
        : metric === "noai"
        ? "lb_noassist_streak"
        : "lb_offgrid_streak";

    const { data, error } = await supabase.rpc(rpcName, {
      p_since: since.toISOString(),
    });

    if (error) return err("rpc_failed", 500, error.message);

    // Shape + rank (names are resolved later)
    let entries = (data ?? [])
      .map((r: any) => ({
        id: String(r.identity),
        val: Number(r.value) || 0,
      }))
      .sort((a: any, b: any) => b.val - a.val);

    const nameMap = new Map<string, string>();

    if (scope === "friends" && friendIds) {
      entries = entries.filter((e) => friendIds!.has(e.id));

      const existing = new Set(entries.map((e) => e.id));
      const missing = [...friendIds].filter((id) => !existing.has(id));

      if (missing.length > 0) {
        const { data: profileRows } = await supabase
          .from("profiles")
          .select("id, username, display_name")
          .in("id", missing);

        for (const p of profileRows ?? []) {
          nameMap.set(String(p.id), p.username || p.display_name || "");
        }

        for (const id of missing) {
          entries.push({ id, val: 0 });
        }
      }

      entries.sort((a, b) => b.val - a.val);
    }

    let meRank = meId ? entries.findIndex((e) => e.id === meId) + 1 : 0;
    let top5 = entries.slice(0, 5);

    // If we have a user context but they aren't in the top list, insert a zero row
    if (meId && meRank === 0 && !top5.some((e) => e.id === meId)) {
      entries.push({ id: meId, val: 0 });
      entries.sort((a, b) => b.val - a.val);
      meRank = entries.findIndex((e) => e.id === meId) + 1;
      top5 = entries.slice(0, 5);
    }
    const idsToFetch = new Set(top5.map((e) => e.id));
    if (meId && meRank > 5) idsToFetch.add(meId);

    if (idsToFetch.size > 0) {
      const { data: profiles, error: profilesErr } = await supabase
        .from("profiles")
        .select("id, username, display_name")
        .in("id", Array.from(idsToFetch));
      if (profilesErr) return err("profiles_query_failed", 500, profilesErr.message);

      for (const row of profiles ?? []) {
        nameMap.set(row.id, row.username || row.display_name || "");
      }
    }

    const resolveName = (id: string) => {
      const known = nameMap.get(id);
      if (known) return known;
      const clean = String(id).startsWith("dev_") ? String(id).slice(4) : String(id);
      return clean.slice(0, 10);
    };

    top5 = top5.map((e) => ({ ...e, name: resolveName(e.id) }));

    const meRow = meId
      ? {
          rank: meRank,
          id: meId,
          name: resolveName(meId),
          val: entries[meRank - 1]?.val ?? 0,
        }
      : null;

    return json({ entries: top5, me: meRow });
  } catch (e) {
    return err("unhandled", 500, String(e));
  }
});
