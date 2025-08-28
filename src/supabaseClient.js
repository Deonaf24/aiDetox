import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://ltjtjgdjllmbyknaygof.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0anRqZ2RqbGxtYnlrbmF5Z29mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxNDkxOTAsImV4cCI6MjA3MTcyNTE5MH0.tMfU0stBJZ52IKWOd7A0HGSWxXMhvXVqd9dyredUEHM';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function registerDevice(id) {
  if (!id) return;
  await supabase.from('devices').upsert({ id, last_seen: new Date().toISOString() });
}

export async function ensureProfile(user) {
  if (!user?.id) return;
  await supabase.from('profiles').upsert({
    id: user.id,
    display_name: user.user_metadata?.full_name || null
  });
}

export async function logEvent({ profile_id, device_id, domain, url, reason, unlock_delay_ms, event, at }) {
  if (!device_id || !event) return;
  await supabase.from('events').insert({
    profile_id,
    device_id,
    domain,
    url,
    reason,
    unlock_delay_ms,
    event,
    at: at || new Date().toISOString(),
  });
}

export async function addFriend(owner, friend) {
  if (!owner || !friend) return;
  await supabase.from('friends').insert({ owner, friend });
}
