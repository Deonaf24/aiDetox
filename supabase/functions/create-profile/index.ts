import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST")    return new Response("Method Not Allowed", { status: 405, headers: cors });

  let body: any;
  try { body = await req.json(); } catch (_) {
    return new Response("Bad JSON", { status: 400, headers: cors });
  }

  const { userId, display_name } = body || {};
  if (!userId) {
    return new Response("userId required", { status: 400, headers: cors });
  }

  const supa = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  const { error } = await supa.from("profiles").upsert({ id: userId, display_name });
  if (error) return new Response(error.message, { status: 500, headers: cors });

  return new Response(JSON.stringify({ ok: true }), { headers: { ...cors, "content-type": "application/json" } });
});
