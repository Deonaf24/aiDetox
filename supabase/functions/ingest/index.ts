import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST")    return new Response("Method Not Allowed", { status: 405, headers: cors });

  const supa = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  let p: any;
  try { p = await req.json(); } catch { return new Response("Bad JSON", { status: 400, headers: cors }); }

  const { device_id, event, at = new Date().toISOString(), domain = null, url = null, reason = null, unlock_delay_ms = null } = p || {};
  if (!device_id || !event || !["proceed","close"].includes(event)) {
    return new Response("device_id + valid event required", { status: 400, headers: cors });
  }

  await supa.from("devices").upsert({ id: device_id, last_seen: new Date().toISOString() }, { onConflict: "id" });

  const { error } = await supa.from("events").insert({ device_id, event, at, domain, url, reason, unlock_delay_ms });
  if (error) return new Response(error.message, { status: 500, headers: cors });

  return new Response(JSON.stringify({ ok: true }), { headers: { ...cors, "content-type": "application/json" } });
});
