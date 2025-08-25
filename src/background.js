// background.js

import { supabase, registerDevice, logEvent } from "./supabaseClient.js";

const LOG_KEY = 'aidetox_log';
const MAX_LOG = 1000;
const DEVICE_KEY = 'aidetox_device_id';

// --- Helpers ---
async function getStoredSession() {
  return new Promise((resolve) => {
    chrome.storage.local.get("aidetox_session", (res) => {
      resolve(res["aidetox_session"] || null);
    });
  });
}

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

// --- Supabase logging ---
async function logEventToSupabase(evt) {
  try {
    const session = await getStoredSession();
    if (session?.access_token && session?.refresh_token) {
      await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });
    }
    const device_id = await getDeviceId();
    await registerDevice(device_id);
    await logEvent({ device_id, profile_id: session?.user?.id || null, ...evt });
  } catch (err) {
    console.warn("Supabase log failed:", err);
  }
}

// --- Message handler ---
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
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
