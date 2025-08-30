import { createClient } from '@supabase/supabase-js';

// Load credentials from environment variables injected at build time
export const SUPABASE_URL = process.env.SUPABASE_URL;
export const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

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

// Create a pending friend request instead of inserting directly into friends
export async function addFriend(owner, friend) {
  if (!owner || !friend) return;
  await supabase.from('friend_requests').insert({
    sender: owner,
    receiver: friend,
    status: 'pending'
  });
}

// Accept a pending friend request
export async function acceptFriendRequest(sender, receiver) {
  if (!sender || !receiver) return;
  const { error: insertErr } = await supabase
    .from('friends')
    .insert({ owner: sender, friend: receiver });
  if (insertErr) return;
  await supabase
    .from('friend_requests')
    .update({ status: 'accepted' })
    .eq('sender', sender)
    .eq('receiver', receiver);
}

// Decline a pending friend request
export async function declineFriendRequest(sender, receiver) {
  if (!sender || !receiver) return;
  await supabase
    .from('friend_requests')
    .update({ status: 'declined' })
    .eq('sender', sender)
    .eq('receiver', receiver);
}
