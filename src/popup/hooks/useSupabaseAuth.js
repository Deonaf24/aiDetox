import { useCallback, useEffect, useMemo, useState } from "react";
import {
  supabase,
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
  ensureProfile,
} from "../../supabaseClient";
import { getStoredSession, storeSession, clearStoredSession } from "../../sessionStorage";

async function safeStoreSession(session) {
  try {
    await storeSession(session);
  } catch (err) {
    console.error("Failed to persist Supabase session", err);
  }
}

async function loadInitialSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw error;
  }

  let currentSession = data.session;
  if (currentSession?.access_token && currentSession?.refresh_token) {
    await safeStoreSession(currentSession);
    return currentSession;
  }

  const stored = await getStoredSession();
  if (!stored?.access_token || !stored?.refresh_token) {
    return null;
  }

  try {
    const { data: setData, error: setError } = await supabase.auth.setSession({
      access_token: stored.access_token,
      refresh_token: stored.refresh_token,
    });

    if (setError) {
      await clearStoredSession();
      return null;
    }

    const refreshed = setData?.session || null;
    if (refreshed?.access_token && refreshed?.refresh_token) {
      await safeStoreSession(refreshed);
    }
    return refreshed;
  } catch (err) {
    await clearStoredSession();
    return null;
  }
}

async function fetchProfile(userId) {
  if (!userId) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("username, full_name, avatar_url")
    .eq("id", userId)
    .maybeSingle();
  if (error) return null;
  return data || null;
}

export function useSupabaseAuth() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const initial = await loadInitialSession();
        if (!active) return;
        setSession(initial);
        if (initial?.user) {
          const p = await fetchProfile(initial.user.id);
          if (!active) return;
          setProfile(p);
        }
      } catch (err) {
        if (!active) return;
        setError(err.message || "Could not restore session");
      } finally {
        if (!active) return;
        setStatus("ready");
      }
    })();

    const { data } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!active) return;
      if (event === "INITIAL_SESSION") {
        if (newSession) {
          setSession(newSession);
          await safeStoreSession(newSession);
          if (newSession.user) {
            const p = await fetchProfile(newSession.user.id);
            if (!active) return;
            setProfile(p);
          }
        }
        setStatus("ready");
        return;
      }
      if (event === "SIGNED_OUT") {
        await clearStoredSession();
        setSession(null);
        setProfile(null);
        setMessage("Logged out");
        setStatus("ready");
        return;
      }

      if (newSession) {
        setSession(newSession);
        await safeStoreSession(newSession);
        if (newSession.user) {
          await ensureProfile(newSession.user);
          const p = await fetchProfile(newSession.user.id);
          if (!active) return;
          setProfile(p);
        }
        setStatus("ready");
      }
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const signUp = useCallback(
    async ({ email, password, username }) => {
      setError(null);
      setMessage(null);
      if (!email || !password || !username) {
        setError("Please fill all fields.");
        return { ok: false };
      }

      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username)
        .maybeSingle();
      if (existing) {
        setError("Username already taken.");
        return { ok: false };
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username } },
      });

      if (signUpError) {
        setError(`Sign up failed: ${signUpError.message}`);
        return { ok: false };
      }

      if (data?.user) {
        await ensureProfile(data.user);
      }

      setMessage("Confirmation email sent. Please check your inbox.");
      return { ok: true };
    },
    [],
  );

  const signIn = useCallback(async ({ email, password }) => {
    setError(null);
    setMessage(null);
    if (!email || !password) {
      setError("Enter email and password.");
      return { ok: false };
    }

    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(`Login failed: ${signInError.message}`);
      return { ok: false };
    }

    await ensureProfile(data.user);
    await safeStoreSession(data.session);
    setMessage("Logged in!");
    return { ok: true };
  }, []);

  const signOut = useCallback(async () => {
    setError(null);
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      setError(signOutError.message);
    } else {
      await clearStoredSession();
    }
  }, []);

  return useMemo(
    () => ({
      session,
      profile,
      status,
      error,
      message,
      setMessage,
      setError,
      signUp,
      signIn,
      signOut,
      supabase,
      supabaseUrl: SUPABASE_URL,
      supabaseAnonKey: SUPABASE_ANON_KEY,
    }),
    [session, profile, status, error, message, signUp, signIn, signOut],
  );
}
