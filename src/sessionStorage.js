// Utility functions for storing auth sessions securely

const SESSION_KEY_NAME = 'aidetox_session';
const ENC_KEY_NAME = 'aidetox_enc_key';

async function getCryptoKey() {
  const { [ENC_KEY_NAME]: key } = await chrome.storage.session.get(ENC_KEY_NAME);
  let raw = key;
  if (!raw) {
    raw = Array.from(crypto.getRandomValues(new Uint8Array(32)));
    await chrome.storage.session.set({ [ENC_KEY_NAME]: raw });
  }
  return crypto.subtle.importKey('raw', new Uint8Array(raw), 'AES-GCM', false, ['encrypt', 'decrypt']);
}

export async function storeSession(session) {
  if (session?.access_token) {
    const key = await getCryptoKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      user: session.user,
    }));
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
    await chrome.storage.local.set({
      [SESSION_KEY_NAME]: {
        iv: Array.from(iv),
        data: Array.from(new Uint8Array(encrypted)),
      },
    });
  } else {
    await clearStoredSession();
  }
}

export async function getStoredSession() {
  const { [SESSION_KEY_NAME]: stored } = await chrome.storage.local.get(SESSION_KEY_NAME);
  if (!stored?.iv || !stored?.data) return null;
  try {
    const key = await getCryptoKey();
    const iv = new Uint8Array(stored.iv);
    const data = new Uint8Array(stored.data);
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
    const decoded = new TextDecoder().decode(decrypted);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export async function clearStoredSession() {
  await chrome.storage.local.remove(SESSION_KEY_NAME);
  await chrome.storage.session.remove(ENC_KEY_NAME);
}

export { SESSION_KEY_NAME as SESSION_STORAGE_KEY };
