import { useCallback, useEffect, useMemo, useState } from "react";
import { calculateTotals, calculateUsageStats } from "../lib/activity";
import { hasChrome } from "../lib/utils";

function fetchLog() {
  if (!hasChrome || !chrome.runtime?.sendMessage) {
    return Promise.resolve({ ok: false, log: [] });
  }
  return new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage({ type: "AIDETOX_GET_LOG" }, (res) => {
        if (chrome.runtime?.lastError) {
          resolve({ ok: false, log: [] });
          return;
        }
        resolve(res || { ok: false, log: [] });
      });
    } catch (err) {
      resolve({ ok: false, log: [] });
    }
  });
}

export function useActivity() {
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const result = await fetchLog();
    if (result?.ok && Array.isArray(result.log)) {
      setLog(result.log);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const totals = useMemo(() => calculateTotals(log), [log]);
  const usage = useMemo(() => calculateUsageStats(log), [log]);

  return { log, totals, usage, loading, refresh };
}
