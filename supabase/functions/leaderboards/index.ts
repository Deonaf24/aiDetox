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
  const meId   = url.searchParams.get("device_id") || "";
  if (!["noai","novisit","saves"].includes(String(metric))) {
    return new Response("invalid metric", { status: 400, headers: cors });
  }

  const supa = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const since = new Date(); since.setMonth(since.getMonth() - 6);

  const fn = metric === "saves"   ? "lb_saves"
           : metric === "noai"    ? "lb_noassist_streak"
           :                         "lb_offgrid_streak";

  const { data, error } = await supa.rpc(fn, { p_since: since.toISOString() });
  if (error) return new Response(error.message, { status: 500, headers: cors });

  // shape + ranking
  const entries = (data || [])
    .map((r: any) => ({ id: String(r.identity), name: r.identity.startsWith("dev_") ? r.identity.slice(4,10) : "User", val: Number(r.value)||0 }))
    .sort((a: any,b: any)=> b.val - a.val);

  let meRank = meId ? (entries.findIndex(e => e.id === meId) + 1) : 0;
  if (meId && meRank === 0) { entries.push({ id: meId, name: "You", val: 0 }); entries.sort((a,b)=>b.val-a.val); meRank = entries.findIndex(e=>e.id===meId)+1; }

  const top5 = entries.slice(0,5);
  const meRow = meId && meRank > 5 ? { rank: meRank, ...entries[meRank-1] } : (meId ? { rank: meRank, id: meId, name: "You", val: entries.find(e=>e.id===meId)?.val ?? 0 } : null);

  return new Response(JSON.stringify({ entries: top5, me: meRow }), { headers: { ...cors, "content-type": "application/json" } });
});
