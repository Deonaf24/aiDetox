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
        "relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand via-emerald-600 to-emerald-700 p-6 text-white shadow-mockup",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
            {logoUrl ? (
              <img src={logoUrl} alt="Stop LLMs" className="h-10 w-10" />
            ) : (
              <span className="text-2xl font-semibold">SL</span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Stop LLMs</h1>
            <p className="text-sm text-white/80">Your mindful AI usage companion</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 text-right text-sm font-medium">
          <Stat label="Total" value={totals.total} icon={Activity} />
          <Stat label="Proceed" value={totals.proceed} icon={CheckCircle2} />
          <Stat label="Closed" value={totals.close} icon={XCircle} />
        </div>
      </div>
      <div className="absolute -right-6 top-4 h-24 w-24 rounded-full bg-white/10 blur-3xl" />
    </header>
  );
}

function Stat({ label, value, icon: Icon }) {
  return (
    <div className="flex flex-col items-end gap-1">
      <span className="flex items-center gap-1 text-xs uppercase tracking-wide text-white/70">
        <Icon className="h-3.5 w-3.5" aria-hidden />
        {label}
      </span>
      <span className="text-lg font-semibold">{value}</span>
    </div>
  );
}
