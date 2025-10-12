import { useCallback, useEffect, useMemo, useState } from "react";
import { DEFAULT_SETTINGS, STORAGE_KEYS } from "../constants";
import { resolveDailyGoal } from "../lib/activity";
import { hasChrome } from "../lib/utils";

const STORAGE_KEY_ENTRIES = Object.entries(STORAGE_KEYS);

function applySettings(raw) {
  const merged = { ...DEFAULT_SETTINGS };
  merged.usesBeforePrompt = parseInt(raw[STORAGE_KEYS.usesBeforePrompt], 10) || 0;
  merged.limitPeriod = raw[STORAGE_KEYS.limitPeriod] === "day" ? "day" : "hour";
  merged.alwaysAsk = Boolean(raw[STORAGE_KEYS.alwaysAsk]);
  merged.unlockDelay = parseInt(raw[STORAGE_KEYS.unlockDelay], 10) || 0;
  merged.minChars = parseInt(raw[STORAGE_KEYS.minChars], 10) || 0;
  merged.checkReason = Boolean(raw[STORAGE_KEYS.checkReason]);
  merged.dailyGoal = resolveDailyGoal(raw[STORAGE_KEYS.dailyGoal]);
  return merged;
}

function mapUpdates(partial) {
  const payload = {};
  for (const [name, key] of STORAGE_KEY_ENTRIES) {
    if (partial[name] === undefined) continue;
    payload[key] = partial[name];
  }
  return payload;
}

async function readSettingsFromStorage() {
  if (!hasChrome || !chrome.storage?.local) {
    return DEFAULT_SETTINGS;
  }
  return new Promise((resolve) => {
    chrome.storage.local.get(
      STORAGE_KEY_ENTRIES.map(([, key]) => key),
      (values) => {
        if (chrome.runtime?.lastError) {
          resolve(DEFAULT_SETTINGS);
          return;
        }
        resolve(applySettings(values || {}));
      },
    );
  });
}

export function useSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let active = true;
    readSettingsFromStorage().then((loaded) => {
      if (!active) return;
      setSettings(loaded);
      setStatus("ready");
    });
    return () => {
      active = false;
    };
  }, []);

  const updateSettings = useCallback((partial) => {
    setSettings((prev) => ({ ...prev, ...partial }));
    if (hasChrome && chrome.storage?.local) {
      chrome.storage.local.set(mapUpdates(partial));
    }
  }, []);

  const reset = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    if (hasChrome && chrome.storage?.local) {
      chrome.storage.local.set(mapUpdates(DEFAULT_SETTINGS));
    }
  }, []);

  return useMemo(
    () => ({ settings, status, updateSettings, reset }),
    [settings, status, updateSettings, reset],
  );
}
