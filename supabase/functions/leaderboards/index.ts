import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS"
};
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "GET")     return new Response("Method Not Allowed", { status: 405, headers: cors });

  const url = new URL(req.url);
  const metric = url.searchParams.get("metric");     // 'noai' | 'novisit' | 'saves'
  const scope  = url.searchParams.get("scope") === "friends" ? "friends" : "global";
  let   meId   = url.searchParams.get("device_id") || "";
  if (!["noai","novisit","saves"].includes(String(metric))) {
    return new Response(JSON.stringify({ error: "invalid_metric" }), { status: 400, headers: { ...cors, "content-type": "application/json" } });
  }

  const supa = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  // Authenticate and collect friend IDs if needed
  let friendIds: Set<string> | null = null;
  if (scope === "friends") {
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!token) {
      return new Response(JSON.stringify({ error: "login_required" }), { status: 401, headers: { ...cors, "content-type": "application/json" } });
    }

    const { data: { user }, error: userErr } = await supa.auth.getUser(token);
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "login_required" }), { status: 401, headers: { ...cors, "content-type": "application/json" } });
    }
    meId = user.id;

    const { data: friendRows, error: friendsErr } = await supa
      .from("friends")
      .select("owner, friend")
      .or(`owner.eq.${meId},friend.eq.${meId}`);
    if (friendsErr) {
      return new Response(friendsErr.message, { status: 500, headers: cors });
    }
    friendIds = new Set([meId]);
    for (const row of friendRows || []) {
      friendIds.add(row.owner === meId ? row.friend : row.owner);
    }
  }
  const since = new Date(); since.setMonth(since.getMonth() - 6);

  const fn = metric === "saves"   ? "lb_saves"
           : metric === "noai"    ? "lb_noassist_streak"
           :                         "lb_offgrid_streak";

  const { data, error } = await supa.rpc(fn, { p_since: since.toISOString() });
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...cors, "content-type": "application/json" } });
  }

  // shape + ranking
  let entries = (data || [])
    .map((r: any) => ({ id: String(r.identity), name: r.identity.startsWith("dev_") ? r.identity.slice(4,10) : "User", val: Number(r.value)||0 }))
    .sort((a: any,b: any)=> b.val - a.val);

  if (scope === "friends" && friendIds) {
    entries = entries.filter(e => friendIds!.has(e.id));
  }

  let meRank = meId ? (entries.findIndex(e => e.id === meId) + 1) : 0;
  if (meId && meRank === 0) { entries.push({ id: meId, name: "You", val: 0 }); entries.sort((a,b)=>b.val-a.val); meRank = entries.findIndex(e=>e.id===meId)+1; }

  const top5 = entries.slice(0,5);
  const meRow = meId && meRank > 5 ? { rank: meRank, ...entries[meRank-1] } : (meId ? { rank: meRank, id: meId, name: "You", val: entries.find(e=>e.id===meId)?.val ?? 0 } : null);

  return new Response(JSON.stringify({ entries: top5, me: meRow }), { headers: { ...cors, "content-type": "application/json" } });
});
