import { DEFAULT_DAILY_GOAL } from "../constants";

export function calculateTotals(log = []) {
  return log.reduce(
    (acc, entry) => {
      acc.total += 1;
      if (entry.event === "proceed") acc.proceed += 1;
      if (entry.event === "close") acc.close += 1;
      return acc;
    },
    { total: 0, proceed: 0, close: 0 },
  );
}

export function calculateUsageStats(log = []) {
  const msDay = 24 * 60 * 60 * 1000;
  const today = new Date();
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const todayStart = startOfDay(today);
  const weekStart = new Date(todayStart - 6 * msDay);
  const monthStart = new Date(todayStart - 29 * msDay);

  let dayCount = 0;
  let weekCount = 0;
  let monthCount = 0;
  const days = [];

  for (const entry of log) {
    if (entry.event !== "proceed") continue;
    const at = new Date(entry.at);
    if (Number.isNaN(at.getTime())) continue;
    if (at >= todayStart) dayCount += 1;
    if (at >= weekStart) weekCount += 1;
    if (at >= monthStart) monthCount += 1;
    days.push(startOfDay(at));
  }

  days.sort((a, b) => a - b);
  let longest = 0;
  for (let i = 1; i < days.length; i += 1) {
    const gap = Math.floor((days[i] - days[i - 1]) / msDay) - 1;
    if (gap > longest) longest = gap;
  }
  if (days.length) {
    const gap = Math.floor((todayStart - days[days.length - 1]) / msDay) - 1;
    if (gap > longest) longest = gap;
  }

  return {
    today: dayCount,
    week: weekCount,
    month: monthCount,
    longest: Math.max(longest, 0),
  };
}

export function progressColor(p) {
  const progress = Math.min(Math.max(p, 0), 1);
  let hue;
  if (progress <= 0.5) {
    hue = 120 - (progress / 0.5) * 60;
  } else {
    hue = 60 - ((progress - 0.5) / 0.5) * 60;
  }
  return `hsl(${hue}, 95%, 50%)`;
}

export function downloadLogCsv(log = []) {
  const header = ["timestamp", "event", "domain", "url", "reason", "unlock_delay_ms"];
  const rows = log.map((entry) => [
    new Date(entry.at).toISOString(),
    entry.event || "",
    entry.domain || "",
    entry.url || "",
    entry.reason || "",
    entry.unlock_delay_ms ?? "",
  ]);

  const csv = [
    header.join(","),
    ...rows.map((row) => row.map((v) => `"${String(v).replaceAll("\"", "\"\"")}"`).join(",")),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "aidetox-log.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function resolveDailyGoal(value) {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_DAILY_GOAL;
}
