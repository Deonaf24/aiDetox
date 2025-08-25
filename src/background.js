// background.js

import { createClient } from "@supabase/supabase-js";

const LOG_KEY = 'aidetox_log';
const MAX_LOG = 1000;

const SUPABASE_URL = "https://ltjtjgdjllmbyknaygof.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0anRqZ2RqbGxtYnlrbmF5Z29mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxNDkxOTAsImV4cCI6MjA3MTcyNTE5MH0.tMfU0stBJZ52IKWOd7A0HGSWxXMhvXVqd9dyredUEHM";
const FN_INGEST = `${SUPABASE_URL}/functions/v1/ingest`;
const DEVICE_KEY = 'aidetox_device_id';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- Helpers ---
async function getStoredToken() {
  return new Promise((resolve) => {
    chrome.storage.local.get("aidetox_token", (res) => {
      resolve(res["aidetox_token"] || null);
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

// --- Supabase ingest ---
async function ingestToSupabase(evt) {
  try {
    const device_id = await getDeviceId();
    const token = await getStoredToken();

    const headers = {
      "content-type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    await fetch(FN_INGEST, {
      method: "POST",
      headers,
      body: JSON.stringify({ device_id, ...evt }),
    });
  } catch (err) {
    console.warn("Supabase ingest failed:", err);
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
      ingestToSupabase({
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
