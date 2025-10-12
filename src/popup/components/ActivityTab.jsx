import React from "react";
import { DailyUsageRing } from "./DailyUsageRing";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

export function ActivityTab({ usage, dailyGoal, loading, onRefresh }) {
  return (
    <div className="grid gap-4">
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-start sm:justify-between sm:text-left">
          <div className="flex flex-col items-center gap-2 sm:items-start">
            <CardTitle className="text-xl">Today&apos;s focus</CardTitle>
            <CardDescription className="max-w-md">
              Track how often you visited AI tools today and keep an eye on your streaks.
            </CardDescription>
          </div>
          <Button variant="secondary" onClick={onRefresh} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-8 sm:grid-cols-[auto,1fr] sm:items-center">
            <div className="flex flex-col items-center gap-2">
              <DailyUsageRing today={usage.today} dailyGoal={dailyGoal} />
              <span className="daily-ring-label">Uses today</span>
              <Badge variant="outline">Goal: {dailyGoal}</Badge>
            </div>
            <div className="grid gap-4">
              <SummaryRow label="This week" value={usage.week} sublabel="proceed decisions" />
              <SummaryRow label="This month" value={usage.month} sublabel="proceed decisions" />
              <SummaryRow label="Longest break" value={usage.longest} sublabel="days without AI" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryRow({ label, value, sublabel }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border bg-muted/40 px-4 py-3">
      <div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-xs text-muted-foreground/80">{sublabel}</p>
      </div>
      <span className="text-2xl font-semibold text-foreground">{value}</span>
    </div>
  );
}
