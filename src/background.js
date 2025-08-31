// background.js

import { supabase, registerDevice, SUPABASE_URL } from "./supabaseClient.js";
import { getStoredSession, clearStoredSession } from "./sessionStorage.js";

const LOG_KEY = 'aidetox_log';
const MAX_LOG = 1000;
const DEVICE_KEY = 'aidetox_device_id';
const PENDING_KEY = 'aidetox_pending_log';
const FN_INGEST = `${SUPABASE_URL}/functions/v1/ingest`;

// --- Helpers ---
async function getDeviceId() {
  return new Promise((resolve) => {
    chrome.storage.local.get(DEVICE_KEY, (res) => {
      let id = res[DEVICE_KEY];
      if (!id) {
        id = 'dev_' + Math.random().toString(36).slice(2, 10);
        chrome.storage.local.set({ [DEVICE_KEY]: id }, () => resolve(id));
      } else {
        resolve(id);
      }
    });
  });
}

async function queueEvent(evt) {
  const { [PENDING_KEY]: q = [] } = await chrome.storage.local.get(PENDING_KEY);
  q.push(evt);
  await chrome.storage.local.set({ [PENDING_KEY]: q });
}

async function flushQueuedEvents(session) {
  const { [PENDING_KEY]: q = [] } = await chrome.storage.local.get(PENDING_KEY);
  if (!q.length) return;
  const remaining = [];
  for (const e of q) {
    try {
      const res = await fetch(FN_INGEST, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(e),
      });
      if (!res.ok) {
        const text = await res.text();
        console.error('Supabase log failed:', res.status, text);
        remaining.push(e);
      }
    } catch (err) {
      console.error('Supabase log failed:', err);
      remaining.push(e);
    }
  }
  if (remaining.length) {
    await chrome.storage.local.set({ [PENDING_KEY]: remaining });
  } else {
    await chrome.storage.local.remove(PENDING_KEY);
  }
}

// Clear any stored session when the extension is installed, started, or unloaded.
chrome.runtime.onInstalled?.addListener(() => { clearStoredSession(); });
chrome.runtime.onStartup?.addListener(() => { clearStoredSession(); });
chrome.runtime.onSuspend?.addListener(() => { clearStoredSession(); });

// --- Supabase logging ---
async function logEventToSupabase(evt) {
  const session = await getStoredSession();
  const device_id = await getDeviceId();
  const payload = { device_id, profile_id: session?.user?.id || null, ...evt };
  try {
    if (!session?.access_token || !session?.refresh_token) {
      await queueEvent(payload);
      chrome.runtime.sendMessage?.({ type: 'AIDETOX_LOGIN_REQUIRED' });
      return;
    }
    await supabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });
    await registerDevice(device_id);
    await flushQueuedEvents(session);
    const res = await fetch(FN_INGEST, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error('Supabase log failed:', res.status, text);
      await queueEvent(payload);
    }
  } catch (err) {
    console.error('Supabase log failed:', err);
    await queueEvent(payload);
  }
}

// Restrict messages to our own extension contexts
function isTrustedSender(sender) {
  const extensionOrigin = `chrome-extension://${chrome.runtime.id}`;
  if (sender?.id === chrome.runtime.id) return true;
  if (sender?.origin === extensionOrigin) return true;
  return false;
}

// --- Message handler ---
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    if (!isTrustedSender(sender)) {
      sendResponse({ ok: false, error: 'unauthorized_sender' });
      return;
    }

    if (msg?.type === 'AIDETOX_CLOSE_TAB' && sender?.tab?.id) {
      try { await chrome.tabs.remove(sender.tab.id); } catch {}
      sendResponse({ ok: true });
      return;
    }

    if (msg?.type === 'AIDETOX_LOG') {
      // 1) append locally
      const { [LOG_KEY]: log = [] } = await chrome.storage.local.get(LOG_KEY);
      const entry = {
        at: Date.now(),
        event: msg.event,   // 'proceed' | 'close'
        domain: msg.domain || null,
        url: msg.url || null,
        reason: msg.reason || null,
        unlock_delay_ms: msg.unlock_delay_ms || null,
      };
      log.push(entry);
      if (log.length > MAX_LOG) log.splice(0, log.length - MAX_LOG);
      await chrome.storage.local.set({ [LOG_KEY]: log });

      // 2) forward to Supabase
      logEventToSupabase({
        at: new Date(entry.at).toISOString(),
        event: entry.event,
        domain: entry.domain,
        url: entry.url,
        reason: entry.reason,
        unlock_delay_ms: entry.unlock_delay_ms,
      });

      sendResponse({ ok: true });
      return;
    }

    if (msg?.type === 'AIDETOX_GET_LOG') {
      const { [LOG_KEY]: log = [] } = await chrome.storage.local.get(LOG_KEY);
      log.sort((a, b) => b.at - a.at);
      sendResponse({ ok: true, log });
      return;
    }

    if (msg?.type === 'AIDETOX_CLEAR_LOG') {
      await chrome.storage.local.set({ [LOG_KEY]: [] });
      sendResponse({ ok: true });
      return;
    }

    sendResponse({ ok: false, error: 'unknown_message' });
  })();
  return true; // keep async channel open
});
