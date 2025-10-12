import React, { useMemo, useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";

const LIMIT_OPTIONS = [
  { value: "hour", label: "per hour" },
  { value: "day", label: "per day" },
];

export function SettingsTab({ auth, settingsState, onExport, onClear }) {
  const { settings, updateSettings, status: settingsStatus } = settingsState;
  const [formMode, setFormMode] = useState("none");
  const [signup, setSignup] = useState({ email: "", username: "", password: "" });
  const [login, setLogin] = useState({ email: "", password: "" });

  const isLoggedIn = Boolean(auth.session?.user);
  const displayName = useMemo(() => {
    if (auth.profile?.username) return auth.profile.username;
    return auth.session?.user?.email || "Not logged in";
  }, [auth.profile, auth.session]);

  const showSignup = formMode === "signup";
  const showLogin = formMode === "login";

  const handleSignup = async (event) => {
    event.preventDefault();
    const result = await auth.signUp(signup);
    if (result.ok) {
      setFormMode("none");
      setSignup({ email: "", username: "", password: "" });
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    const result = await auth.signIn(login);
    if (result.ok) {
      setFormMode("none");
      setLogin({ email: "", password: "" });
    }
  };

  const resetFeedback = () => {
    auth.setError(null);
    auth.setMessage(null);
  };

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>
            {auth.status === "loading" ? "Checking session…" : `Status: ${isLoggedIn ? "Signed in" : "Signed out"}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="rounded-full bg-muted px-3 py-1 text-muted-foreground">{displayName}</span>
            {auth.message ? <span className="text-emerald-600">{auth.message}</span> : null}
            {auth.error ? <span className="text-destructive">{auth.error}</span> : null}
          </div>

          {!isLoggedIn ? (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  resetFeedback();
                  setFormMode(formMode === "signup" ? "none" : "signup");
                }}
              >
                {showSignup ? "Close" : "Sign up"}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  resetFeedback();
                  setFormMode(formMode === "login" ? "none" : "login");
                }}
              >
                {showLogin ? "Close" : "Log in"}
              </Button>
            </div>
          ) : (
            <Button variant="destructive" onClick={auth.signOut}>
              Log out
            </Button>
          )}

          {showSignup ? (
            <form onSubmit={handleSignup} className="grid gap-3 rounded-2xl border border-border/70 bg-muted/40 p-4">
              <FormField label="Email">
                <Input
                  type="email"
                  required
                  value={signup.email}
                  onChange={(event) => setSignup((prev) => ({ ...prev, email: event.target.value }))}
                />
              </FormField>
              <FormField label="Username">
                <Input
                  required
                  value={signup.username}
                  onChange={(event) => setSignup((prev) => ({ ...prev, username: event.target.value }))}
                />
              </FormField>
              <FormField label="Password">
                <Input
                  type="password"
                  required
                  value={signup.password}
                  onChange={(event) => setSignup((prev) => ({ ...prev, password: event.target.value }))}
                />
              </FormField>
              <div className="flex gap-2">
                <Button type="submit">Create account</Button>
                <Button type="button" variant="ghost" onClick={() => setFormMode("none")}>Cancel</Button>
              </div>
            </form>
          ) : null}

          {showLogin ? (
            <form onSubmit={handleLogin} className="grid gap-3 rounded-2xl border border-border/70 bg-muted/40 p-4">
              <FormField label="Email">
                <Input
                  type="email"
                  required
                  value={login.email}
                  onChange={(event) => setLogin((prev) => ({ ...prev, email: event.target.value }))}
                />
              </FormField>
              <FormField label="Password">
                <Input
                  type="password"
                  required
                  value={login.password}
                  onChange={(event) => setLogin((prev) => ({ ...prev, password: event.target.value }))}
                />
              </FormField>
              <div className="flex gap-2">
                <Button type="submit">Log in</Button>
                <Button type="button" variant="ghost" onClick={() => setFormMode("none")}>Cancel</Button>
              </div>
            </form>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Behavior</CardTitle>
          <CardDescription>Fine tune how the extension prompts you before using AI tools.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <PreferenceRow
            title="Always prompt"
            description="Ask on every visit without the initial delay."
            control={
              <Switch
                checked={settings.alwaysAsk}
                onCheckedChange={(checked) => updateSettings({ alwaysAsk: checked })}
              />
            }
          />
          <PreferenceRow
            title="Reason quality check"
            description="Warn if your reason is vague before allowing proceed."
            control={
              <Switch
                checked={settings.checkReason}
                onCheckedChange={(checked) => updateSettings({ checkReason: checked })}
              />
            }
          />
          <NumberRow
            label="Proceed button delay"
            description="Seconds before Proceed unlocks."
            value={settings.unlockDelay}
            onChange={(value) => updateSettings({ unlockDelay: value })}
          />
          <NumberRow
            label="Minimum reason length"
            description="Characters required before you can proceed."
            value={settings.minChars}
            onChange={(value) => updateSettings({ minChars: value })}
          />
          <NumberRow
            label="Daily usage goal"
            description="Target number of AI visits per day."
            value={settings.dailyGoal}
            min={1}
            onChange={(value) => updateSettings({ dailyGoal: value })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Prompt frequency</CardTitle>
          <CardDescription>Allow a certain number of automatic proceeds per interval.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-[auto,auto,1fr] sm:items-end">
          <FormField label="Allow">
            <Input
              type="number"
              min={0}
              step={1}
              value={settings.usesBeforePrompt}
              onChange={(event) => updateSettings({ usesBeforePrompt: parseInt(event.target.value, 10) || 0 })}
            />
          </FormField>
          <FormField label="Interval">
            <select
              className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={settings.limitPeriod}
              onChange={(event) => updateSettings({ limitPeriod: event.target.value === "day" ? "day" : "hour" })}
            >
              {LIMIT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>
          <p className="text-sm text-muted-foreground">
            Set to 0 to prompt on every visit. The counter resets each selected interval.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data</CardTitle>
          <CardDescription>Manage your local browsing log.</CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={onExport} disabled={settingsStatus === "loading"}>
            Export CSV
          </Button>
          <Button variant="destructive" onClick={onClear}>
            Clear all
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <div className="grid gap-1">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function PreferenceRow({ title, description, control }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}

function NumberRow({ label, description, value, onChange, min = 0 }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Input
        type="number"
        min={min}
        step={1}
        value={value}
        onChange={(event) => {
          const next = parseInt(event.target.value, 10);
          onChange(Number.isFinite(next) ? Math.max(min, next) : min);
        }}
        className="w-32"
      />
    </div>
  );
}
