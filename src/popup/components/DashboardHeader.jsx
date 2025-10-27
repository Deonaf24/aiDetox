import React, { useEffect, useState } from "react";
import { Activity, CheckCircle2, XCircle } from "lucide-react";
import { cn, hasChrome } from "../lib/utils";

export function DashboardHeader({ totals }) {
  const [logoUrl, setLogoUrl] = useState(null);

  useEffect(() => {
    if (hasChrome && chrome.runtime?.getURL) {
      setLogoUrl(chrome.runtime.getURL("icons/icon-128.png"));
    }
  }, []);

  return (
    <header
      className={cn(
        "relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-brand via-emerald-600 to-emerald-700 p-4 text-white shadow-sm",
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full min-w-0 items-center gap-3 sm:w-auto">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
            {logoUrl ? (
              <img src={logoUrl} alt="Stop LLMs" className="h-9 w-9 object-contain" />
            ) : (
              <span className="text-2xl font-semibold">SL</span>
            )}
          </div>
          <div className="flex min-w-0 flex-col gap-1 text-left">
            <h1 className="text-xl font-semibold leading-tight tracking-tight">Stop LLMs</h1>
            <p className="text-xs text-white/80">Your mindful AI usage companion</p>
          </div>
        </div>
        <div className="grid w-full grid-cols-3 gap-3 text-xs font-medium sm:w-auto sm:text-right">
          <Stat label="Total" value={totals.total} icon={Activity} />
          <Stat label="Proceed" value={totals.proceed} icon={CheckCircle2} />
          <Stat label="Closed" value={totals.close} icon={XCircle} />
        </div>
      </div>
      <div className="absolute -right-6 top-3 h-16 w-16 rounded-full bg-white/10 blur-3xl" />
    </header>
  );
}

function Stat({ label, value, icon: Icon }) {
  return (
    <div className="flex flex-col items-end gap-0.5">
      <span className="flex items-center gap-1 text-[0.65rem] uppercase tracking-wide text-white/70">
        <Icon className="h-3 w-3" aria-hidden />
        {label}
      </span>
      <span className="text-base font-semibold">{value}</span>
    </div>
  );
}
