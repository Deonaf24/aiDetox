import React, { useCallback, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { DashboardHeader } from "./components/DashboardHeader";
import { ActivityTab } from "./components/ActivityTab";
import { FriendsTab } from "./components/FriendsTab";
import { SettingsTab } from "./components/SettingsTab";
import { useActivity } from "./hooks/useActivity";
import { useSupabaseAuth } from "./hooks/useSupabaseAuth";
import { useSettings } from "./hooks/useSettings";
import { downloadLogCsv } from "./lib/activity";
import { hasChrome } from "./lib/utils";

export default function App() {
  const auth = useSupabaseAuth();
  const settingsState = useSettings();
  const activity = useActivity();

  const dailyGoal = settingsState.settings.dailyGoal;

  const handleExport = useCallback(async () => {
    if (!activity.log.length) {
      const res = hasChrome
        ? await new Promise((resolve) => {
            try {
              chrome.runtime.sendMessage({ type: "AIDETOX_GET_LOG" }, (response) => {
                if (chrome.runtime?.lastError) {
                  resolve({ ok: false, log: [] });
                  return;
                }
                resolve(response || { ok: false, log: [] });
              });
            } catch {
              resolve({ ok: false, log: [] });
            }
          })
        : { ok: false, log: [] };
      if (res.ok) {
        downloadLogCsv(res.log || []);
      }
      return;
    }
    downloadLogCsv(activity.log);
  }, [activity.log]);

  const handleClear = useCallback(async () => {
    if (!hasChrome || !chrome.runtime?.sendMessage) return;
    await new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage({ type: "AIDETOX_CLEAR_LOG" }, () => resolve());
      } catch {
        resolve();
      }
    });
    activity.refresh();
  }, [activity]);

  const contentClass = useMemo(
    () =>
      "mt-4 grid gap-4 rounded-2xl bg-card/70 p-4 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/80",
    [],
  );

  return (
    <div className="flex flex-col gap-4 bg-gradient-to-br from-background via-background to-accent/30 p-4">
      <DashboardHeader totals={activity.totals} />
      <Tabs defaultValue="activity" className="space-y-4">
        <TabsList>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="friends">Friends</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="activity" className={contentClass}>
          <ActivityTab
            usage={activity.usage}
            dailyGoal={dailyGoal}
            loading={activity.loading}
            onRefresh={activity.refresh}
          />
        </TabsContent>
        <TabsContent value="friends" className={contentClass}>
          <FriendsTab session={auth.session} />
        </TabsContent>
        <TabsContent value="settings" className={contentClass}>
          <SettingsTab auth={auth} settingsState={settingsState} onExport={handleExport} onClear={handleClear} />
        </TabsContent>
      </Tabs>
      <footer className="pt-1 text-center text-[0.65rem] text-muted-foreground">
        Stay present. Every mindful choice counts.
      </footer>
    </div>
  );
}
