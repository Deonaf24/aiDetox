// Utility functions for storing auth sessions securely

const SESSION_KEY_NAME = 'aidetox_session';
const ENC_KEY_NAME = 'aidetox_enc_key';

const hasChromeStorage = typeof chrome !== 'undefined' && chrome?.storage;
const hasCrypto = typeof crypto !== 'undefined' && crypto?.subtle;

function getStorageArea(area) {
  if (!hasChromeStorage) return null;
  return chrome.storage?.[area] ?? null;
}

async function storageGet(area, key) {
  const store = getStorageArea(area);
  if (!store?.get) return {};
  return new Promise((resolve) => {
    try {
      store.get(key, (result) => {
        if (chrome.runtime?.lastError) {
          resolve({});
          return;
        }
        resolve(result || {});
      });
    } catch (err) {
      console.error('Failed to read chrome.storage', err);
      resolve({});
    }
  });
}

async function storageSet(area, value) {
  const store = getStorageArea(area);
  if (!store?.set) return;
  return new Promise((resolve) => {
    try {
      store.set(value, () => {
        if (chrome.runtime?.lastError) {
          console.error('Failed to write chrome.storage', chrome.runtime.lastError);
        }
        resolve();
      });
    } catch (err) {
      console.error('Failed to write chrome.storage', err);
      resolve();
    }
  });
}

async function storageRemove(area, key) {
  const store = getStorageArea(area);
  if (!store?.remove) return;
  return new Promise((resolve) => {
    try {
      store.remove(key, () => {
        if (chrome.runtime?.lastError) {
          console.error('Failed to remove chrome.storage', chrome.runtime.lastError);
        }
        resolve();
      });
    } catch (err) {
      console.error('Failed to remove chrome.storage', err);
      resolve();
    }
  });
}

async function getCryptoKey() {
  if (!hasCrypto) return null;

  let raw;
  if (hasChromeStorage) {
    const sessionValue = await storageGet('session', ENC_KEY_NAME);
    raw = sessionValue?.[ENC_KEY_NAME];
    if (!raw) {
      const localValue = await storageGet('local', ENC_KEY_NAME);
      raw = localValue?.[ENC_KEY_NAME];
    }
  }

  if (!raw) {
    raw = Array.from(crypto.getRandomValues(new Uint8Array(32)));
  }

  if (hasChromeStorage) {
    await storageSet('session', { [ENC_KEY_NAME]: raw });
    await storageSet('local', { [ENC_KEY_NAME]: raw });
  }

  try {
    return await crypto.subtle.importKey('raw', new Uint8Array(raw), 'AES-GCM', false, [
      'encrypt',
      'decrypt',
    ]);
  } catch (err) {
    console.error('Failed to import crypto key', err);
    return null;
  }
}

function serializeSession(session) {
  if (!session) return null;
  const { access_token, refresh_token, user } = session;
  if (!access_token || !refresh_token) return null;
  return { access_token, refresh_token, user };
}

export async function storeSession(session) {
  const payload = serializeSession(session);
  if (!payload) {
    await clearStoredSession();
    return;
  }

  if (!hasChromeStorage || !hasCrypto) {
    // Fallback to plain storage if crypto/storage is unavailable.
    await storageSet('local', { [SESSION_KEY_NAME]: { format: 'plain', value: payload } });
    return;
  }

  try {
    const key = await getCryptoKey();
    if (!key) throw new Error('missing crypto key');
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(payload));
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
    await storageSet('local', {
      [SESSION_KEY_NAME]: {
        format: 'encrypted',
        iv: Array.from(iv),
        data: Array.from(new Uint8Array(encrypted)),
      },
    });
  } catch (err) {
    console.error('Falling back to plain session storage', err);
    await storageSet('local', { [SESSION_KEY_NAME]: { format: 'plain', value: payload } });
  }
}

export async function getStoredSession() {
  if (!hasChromeStorage) return null;

  const container = await storageGet('local', SESSION_KEY_NAME);
  const stored = container?.[SESSION_KEY_NAME];
  if (!stored) return null;

  if (stored.format === 'plain' && stored.value) {
    return stored.value;
  }

  if (!hasCrypto || !stored.iv || !stored.data) {
    return null;
  }

  try {
    const key = await getCryptoKey();
    if (!key) throw new Error('missing crypto key');
    const iv = new Uint8Array(stored.iv);
    const data = new Uint8Array(stored.data);
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
    const decoded = new TextDecoder().decode(decrypted);
    return JSON.parse(decoded);
  } catch (err) {
    console.error('Failed to decrypt session, clearing stored value', err);
    await clearStoredSession();
    return null;
  }
}

export async function clearStoredSession() {
  if (!hasChromeStorage) return;
  await storageRemove('local', SESSION_KEY_NAME);
  await storageRemove('local', ENC_KEY_NAME);
  await storageRemove('session', ENC_KEY_NAME);
}

export { SESSION_KEY_NAME as SESSION_STORAGE_KEY };
