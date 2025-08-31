// -------------------------
// Supabase (bundled SDK)
// -------------------------
import { supabase, SUPABASE_ANON_KEY, SUPABASE_URL, sendFriendRequest, getFriends, getFriendRequests, acceptFriendRequest, declineFriendRequest } from "./supabaseClient.js";
import { storeSession, getStoredSession } from "./sessionStorage.js";

const FN_LEADERBOARDS = `${SUPABASE_URL}/functions/v1/leaderboards`;

// -------------------------
// Helpers
// -------------------------
const $  = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));
const show = (el) => el && el.classList.remove("hidden");
const hide = (el) => el && el.classList.add("hidden");

// Keep track of leaderboard scope toggle
let LB_SCOPE = "global"; // "global" | "friends"

// Settings keys
const USES_BEFORE_PROMPT_KEY = "aidetox_uses_before_prompt";
const LIMIT_PERIOD_KEY = "aidetox_limit_period";
const ALWAYS_ASK_KEY = "aidetox_always_ask";
const UNLOCK_DELAY_KEY = "aidetox_unlock_delay";
const MIN_CHARS_KEY = "aidetox_min_chars";
const CHECK_REASON_KEY = "aidetox_check_reason";

function loadSettings() {
  chrome.storage.local.get([
    USES_BEFORE_PROMPT_KEY,
    LIMIT_PERIOD_KEY,
    ALWAYS_ASK_KEY,
    UNLOCK_DELAY_KEY,
    MIN_CHARS_KEY,
    CHECK_REASON_KEY,
  ], (res) => {
    const uses = res[USES_BEFORE_PROMPT_KEY] ?? 0;
    const period = res[LIMIT_PERIOD_KEY] || "hour";
    const alwaysAsk = !!res[ALWAYS_ASK_KEY];
    const unlock = res[UNLOCK_DELAY_KEY] ?? 10;
    const minChars = res[MIN_CHARS_KEY] ?? 10;
    const checkReason = !!res[CHECK_REASON_KEY];

    const usesEl = document.getElementById("set-uses-before");
    const periodEl = document.getElementById("set-limit-period");
    const alwaysAskEl = document.getElementById("set-always-ask");
    const unlockEl = document.getElementById("set-unlock");
    const minCharsEl = document.getElementById("set-minchars");
    const checkReasonEl = document.getElementById("set-check-reason");

    if (usesEl) usesEl.value = uses;
    if (periodEl) periodEl.value = period;
    if (alwaysAskEl) alwaysAskEl.checked = alwaysAsk;
    if (unlockEl) unlockEl.value = unlock;
    if (minCharsEl) minCharsEl.value = minChars;
    if (checkReasonEl) checkReasonEl.checked = checkReason;
  });
}

function saveSettings() {
  const usesEl = document.getElementById("set-uses-before");
  const periodEl = document.getElementById("set-limit-period");
  const alwaysAskEl = document.getElementById("set-always-ask");
  const unlockEl = document.getElementById("set-unlock");
  const minCharsEl = document.getElementById("set-minchars");
  const checkReasonEl = document.getElementById("set-check-reason");

  const uses = parseInt(usesEl?.value, 10) || 0;
  const period = periodEl?.value === "day" ? "day" : "hour";
  const alwaysAsk = !!alwaysAskEl?.checked;
  const unlock = parseInt(unlockEl?.value, 10) || 0;
  const minChars = parseInt(minCharsEl?.value, 10) || 0;
  const checkReason = !!checkReasonEl?.checked;

  chrome.storage.local.set({
    [USES_BEFORE_PROMPT_KEY]: uses,
    [LIMIT_PERIOD_KEY]: period,
    [ALWAYS_ASK_KEY]: alwaysAsk,
    [UNLOCK_DELAY_KEY]: unlock,
    [MIN_CHARS_KEY]: minChars,
    [CHECK_REASON_KEY]: checkReason,
  });
}

document.getElementById("set-uses-before")?.addEventListener("change", saveSettings);
document.getElementById("set-limit-period")?.addEventListener("change", saveSettings);
document.getElementById("set-always-ask")?.addEventListener("change", saveSettings);
document.getElementById("set-unlock")?.addEventListener("change", saveSettings);
document.getElementById("set-minchars")?.addEventListener("change", saveSettings);
document.getElementById("set-check-reason")?.addEventListener("change", saveSettings);

// -------------------------
// Device ID (for anon/global leaderboards, etc.)
// -------------------------
async function getDeviceId() {
  return new Promise((resolve) => {
    chrome.storage.local.get("aidetox_device_id", (res) => {
      resolve(res["aidetox_device_id"] || "");
    });
  });
}

// -------------------------
// Auth UI state
// -------------------------

// Restore a previously stored session into the Supabase client
async function restoreSession() {
  const s = await getStoredSession();
  if (s?.access_token && s?.refresh_token) {
    try {
      const { error } = await supabase.auth.setSession({
        access_token: s.access_token,
        refresh_token: s.refresh_token,
      });
      if (error) console.warn("Session restore failed:", error);
    } catch (err) {
      console.warn("Session restore failed:", err);
    }
  }
}

async function renderAuthState() {
  const status = $("#auth-status");
  const btnSignup = $("#btn-show-signup");
  const btnLogin  = $("#btn-show-login");
  const btnLogout = $("#btn-logout");
  const formSignup = $("#form-signup");
  const formLogin  = $("#form-login");

  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;

    if (session?.user) {
      let username = session.user.user_metadata?.username;
      if (!username) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", session.user.id)
          .maybeSingle();
        username = profile?.username || null;
      }
      status.textContent = `Logged in as ${username || session.user.email}`;
      hide(btnSignup); hide(btnLogin); show(btnLogout);
      hide(formSignup); hide(formLogin);
      // Store session so background script can authenticate
      storeSession(session);
      return;
    }
  } catch (err) {
    console.error("Session lookup failed:", err);
  }

  status.textContent = "Not logged in";
  show(btnSignup); show(btnLogin); hide(btnLogout);
  hide(formSignup); hide(formLogin);
  storeSession(null);
}

// Ensure a profile exists for the given auth user
async function ensureProfile(user) {
  if (!user?.id) return;
  const { error } = await supabase
    .from("profiles")
    .upsert({
      id: user.id,
      display_name: user.user_metadata?.full_name || null,
      username: user.user_metadata?.username || null,
    });
  if (error) {
    console.error("Profile upsert failed:", error.message);
  }
}

// React to auth state changes (e.g., token refresh or sign in/out)
// Registration moved after initial session restoration


// Toggle forms
$("#btn-show-signup")?.addEventListener("click", () => {
  hide($("#form-login"));
  show($("#form-signup"));
  $("#su-email")?.focus();
});
$("#btn-show-login")?.addEventListener("click", () => {
  hide($("#form-signup"));
  show($("#form-login"));
  $("#li-email")?.focus();
});

// -------------------------
// Sign up flow (email+password)
// -------------------------
$("#form-signup")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const msg = $("#su-msg");
  msg.textContent = "";

  const email    = $("#su-email").value.trim();
  const username = $("#su-username").value.trim();
  const password = $("#su-password").value;

  if (!email || !password || !username) {
    msg.textContent = "Please fill all fields.";
    return;
  }

  // Check if username is taken
  const { data: existing, error: lookupErr } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();
  if (lookupErr) {
    msg.textContent = "Could not verify username.";
    return;
  }
  if (existing) {
    msg.textContent = "Username already taken.";
    return;
  }

  const { data, error: signUpErr } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username } },
  });
  if (signUpErr) {
    msg.textContent = `Sign up failed: ${signUpErr.message}`;
    return;
  }

  if (data?.user) {
    await ensureProfile(data.user);
  }

  msg.textContent = "Account created! Check your email if verification is required.";
  await renderAuthState();
});

// -------------------------
// Log in
// -------------------------
$("#form-login")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const msg = $("#li-msg");
  msg.textContent = "";

  const email    = $("#li-email").value.trim();
  const password = $("#li-password").value;

  if (!email || !password) {
    msg.textContent = "Please enter email and password.";
    return;
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    msg.textContent = "Login failed: " + error.message;
  } else {
    msg.textContent = "Logged in!";
    await ensureProfile(data.user);
    await renderAuthState();
  }
});

// -------------------------
// Log out
// -------------------------
$("#btn-logout")?.addEventListener("click", async () => {
  await supabase.auth.signOut();
  await renderAuthState();
});

// -------------------------
// Activity Tab
// -------------------------
function fmtTable(ts) {
  try { return new Date(ts).toLocaleString(); } catch { return ""; }
}
function fmtISO(ts) {
  try { return new Date(ts).toISOString(); } catch { return ""; }
}
function escapeCsv(v) {
  if (v == null) return "";
  const s = String(v).replace(/"/g, '""');
  return /[",\n]/.test(s) ? `"${s}"` : s;
}

function updateStats(log = []) {
  const totalEl = document.getElementById("stat-total");
  const proceedEl = document.getElementById("stat-proceed");
  const closeEl = document.getElementById("stat-close");

  const total = log.length;
  let proceed = 0;
  let close = 0;
  for (const entry of log) {
    if (entry.event === "proceed") proceed++;
    else if (entry.event === "close") close++;
  }

  if (totalEl) totalEl.textContent = String(total);
  if (proceedEl) proceedEl.textContent = String(proceed);
  if (closeEl) closeEl.textContent = String(close);
}

function renderTable(log, filter = "all") {
  const wrap = $("#list");
  if (!wrap) return;

  const rows = filter === "all" ? log : log.filter(e => e.event === filter);

  wrap.innerHTML = "";

  if (!rows.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "No entries yet.";
    wrap.appendChild(empty);
    return;
  }

  rows.forEach((e) => {
    const card = document.createElement("div");
    card.className = `card ${e.event}`;

    const bar = document.createElement("div");
    bar.className = "bar";
    card.appendChild(bar);

    const main = document.createElement("div");

    const title = document.createElement("div");
    title.className = "title";
    title.textContent = e.domain || "Unknown domain";
    main.appendChild(title);

    const reason = document.createElement("p");
    reason.className = "reason";
    reason.textContent = e.reason ? e.reason : "—";
    main.appendChild(reason);

    const meta = document.createElement("div");
    meta.className = "meta";

    const spanTime = document.createElement("span");
    spanTime.textContent = fmtTable(e.at);
    meta.appendChild(spanTime);

    const spanDot = document.createElement("span");
    spanDot.className = "dot";
    meta.appendChild(spanDot);

    const spanHost = document.createElement("span");
    spanHost.className = "muted";
    spanHost.textContent = e.url ? new URL(e.url).hostname : "";
    meta.appendChild(spanHost);

    main.appendChild(meta);
    card.appendChild(main);

    const actions = document.createElement("div");
    actions.className = "card-actions";

    const link = document.createElement("a");
    link.className = "link";
    link.href = e.url || "#";
    link.target = "_blank";
    link.textContent = "Open";
    actions.appendChild(link);

    card.appendChild(actions);

    wrap.appendChild(card);
  });
}

function loadAndRender(filter = "all") {
  chrome.runtime.sendMessage({ type: "AIDETOX_GET_LOG" }, (res) => {
    if (!res?.ok) return;
    const log = res.log || [];
    updateStats(log);
    renderTable(log, filter);
  });
}

// Segmented filter buttons
$$(".seg-btn[data-filter]").forEach(btn => {
  btn.addEventListener("click", () => {
    $$(".seg-btn[data-filter]").forEach(b => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    loadAndRender(btn.dataset.filter);
  });
});

// Export / Clear
$("#clear")?.addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "AIDETOX_CLEAR_LOG" }, () => loadAndRender());
});
$("#export")?.addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "AIDETOX_GET_LOG" }, async (res) => {
    if (!res?.ok) return;
    const rows = res.log || [];
    const header = ["time","event","domain","url","reason","unlock_delay_ms"];
    const csv = [
      header.join(","),
      ...rows.map(e => [
        escapeCsv(fmtISO(e.at)),
        escapeCsv(e.event),
        escapeCsv(e.domain || ""),
        escapeCsv(e.url || ""),
        escapeCsv(e.reason || ""),
        escapeCsv(e.unlock_delay_ms || "")
      ].join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    if (chrome.downloads?.download) {
      chrome.downloads.download(
        { url, filename: `aidetox_log_${Date.now()}.csv`, saveAs: true },
        () => setTimeout(() => URL.revokeObjectURL(url), 5000)
      );
    } else {
      const a = document.createElement("a");
      a.href = url; a.download = `aidetox_log_${Date.now()}.csv`;
      document.body.appendChild(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 0);
    }
  });
});

// -------------------------
// Leaderboards
// -------------------------
async function getLeaderboard(metric, scope = LB_SCOPE) {
  const device_id = await getDeviceId();
  const { data: { session } } = await supabase.auth.getSession();

  // Require auth for friends scope
  if (scope === "friends" && !session?.access_token) {
    return { entries: [], me: null, error: "login_required" };
  }

  const url = new URL(FN_LEADERBOARDS);
  url.searchParams.set("metric", metric);      // "noai" | "novisit" | "saves"
  url.searchParams.set("scope", scope);        // "global" | "friends"
  if (device_id) url.searchParams.set("device_id", device_id);

  try {
    const headers = { apikey: SUPABASE_ANON_KEY };
    if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;

    const res = await fetch(url.toString(), { headers });
    let json = null;
    try { json = await res.json(); } catch (_) {}
    if (res.status === 401 && scope === "friends") {
      return { entries: [], me: null, error: json?.error || "login_required" };
    }
    if (!res.ok) throw new Error(json?.error || "request_failed");
    return json;
  } catch (err) {
    console.error("Leaderboard fetch failed:", err);
    return { entries: [], me: null, error: "network" };
  }
}

function renderRanklist(containerId, lb) {
  const wrap = document.getElementById(containerId);
  if (!wrap) return;

  if (lb?.error === "login_required") {
    wrap.innerHTML = `<div class="empty">Sign in to view your friends leaderboard.</div>`;
    return;
  }
  if (lb?.error === "network") {
    wrap.innerHTML = `<div class="empty">Couldn’t load leaderboard. Check your connection.</div>`;
    return;
  }
  if (!lb.entries?.length) {
    wrap.innerHTML = "<div class='empty'>No data yet</div>";
    return;
  }

  const rows = lb.entries.map((e, i) => `
    <div class="row ${lb.me && lb.me.id === e.id ? "me" : ""}">
      <span class="rank">${i + 1}</span>
      <span class="name">${e.name}</span>
      <span class="val">${e.val}</span>
    </div>
  `).join("");

  const meRow = lb.me && lb.me.rank > 5
    ? `<div class="row me"><span class="rank">${lb.me.rank}</span><span class="name">${lb.me.name}</span><span class="val">${lb.me.val}</span></div>`
    : "";

  wrap.innerHTML = rows + meRow;
}

async function renderLeaderboards() {
  const lb1 = await getLeaderboard("noai",    LB_SCOPE);
  const lb2 = await getLeaderboard("novisit", LB_SCOPE);
  const lb3 = await getLeaderboard("saves",   LB_SCOPE);
  renderRanklist("lb-noai-list", lb1);
  renderRanklist("lb-novisit-list", lb2);
  renderRanklist("lb-saves-list", lb3);
}

async function renderFriendsTab() {
  const listEl = $("#friends-list");
  const reqEl = $("#friend-requests");
  const msgEl = $("#add-friend-msg");
  if (msgEl) msgEl.textContent = "";

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    if (listEl) listEl.innerHTML = "<li class='empty'>Log in to see friends.</li>";
    if (reqEl) reqEl.innerHTML = "<li class='empty'>Log in to see requests.</li>";
    return;
  }

  const me = session.user.id;

  const friendRows = await getFriends(me);
  const friendIds = friendRows.map(r => r.owner === me ? r.friend : r.owner);
  if (friendIds.length) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username')
      .in('id', friendIds);
    listEl.innerHTML = friendIds.map(id => {
      const name = profiles?.find(p => p.id === id)?.username || id;
      return `<li>${name}</li>`;
    }).join('');
  } else {
    listEl.innerHTML = "<li class='empty'>No friends yet.</li>";
  }

  const reqRows = await getFriendRequests(me);
  if (reqRows.length) {
    const ids = reqRows.map(r => r.requester);
    const { data: rProfiles } = await supabase
      .from('profiles')
      .select('id, username')
      .in('id', ids);
    reqEl.innerHTML = reqRows.map(r => {
      const name = rProfiles?.find(p => p.id === r.requester)?.username || r.requester;
      return `<li data-id="${r.requester}"><span>${name}</span><span class="actions"><button class="btn btn-secondary btn-sm accept">Accept</button><button class="btn btn-danger btn-sm decline">Decline</button></span></li>`;
    }).join('');
  } else {
    reqEl.innerHTML = "<li class='empty'>No friend requests.</li>";
  }
}

// Friend actions
$("#add-friend-btn")?.addEventListener("click", async () => {
  const username = $("#add-friend-username")?.value.trim();
  const msg = $("#add-friend-msg");
  if (msg) msg.textContent = "";
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) { msg.textContent = "Log in first."; return; }
  const { error } = await sendFriendRequest(session.user.id, username);
  if (error === 'not_found') msg.textContent = "User not found.";
  else if (error === 'self') msg.textContent = "That's you!";
  else if (error) msg.textContent = "Could not send request.";
  else {
    msg.textContent = "Request sent!";
    const input = $("#add-friend-username");
    if (input) input.value = "";
  }
});

$("#friend-requests")?.addEventListener("click", async (e) => {
  const btn = e.target;
  const li = btn.closest("li");
  if (!li) return;
  const requester = li.dataset.id;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return;
  if (btn.classList.contains("accept")) {
    await acceptFriendRequest(requester, session.user.id);
  } else if (btn.classList.contains("decline")) {
    await declineFriendRequest(requester, session.user.id);
  } else {
    return;
  }
  await renderFriendsTab();
});

// Scope toggle (Global / Friends)
$$(".seg-scope").forEach(btn => {
  btn.addEventListener("click", async () => {
    $$(".seg-scope").forEach(b => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    LB_SCOPE = btn.dataset.scope || "global";
    const note = $("#lb-note");
    note.textContent = LB_SCOPE === "friends"
      ? "Friends leaderboard requires login."
      : "Showing global data.";
    await renderLeaderboards();
  });
});

// -------------------------
// Tabs
// -------------------------
$$(".tab").forEach(tabBtn => {
  tabBtn.addEventListener("click", () => {
    $$(".tab").forEach(b => b.classList.remove("is-active"));
    $$("section[id^='tab-']").forEach(sec => sec.classList.add("hidden"));

    tabBtn.classList.add("is-active");
    const target = "tab-" + tabBtn.dataset.tab;
    document.getElementById(target).classList.remove("hidden");

    if (target === "tab-leaderboards") renderLeaderboards();
    else if (target === "tab-activity") loadAndRender();
    else if (target === "tab-settings") {
      renderAuthState();
      loadSettings();
    } else if (target === "tab-friends") {
      renderFriendsTab();
    }
  });
});

// -------------------------
// Initial load
// -------------------------
loadAndRender();
loadSettings();

(async () => {
  await restoreSession();
  await renderAuthState();

  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === "INITIAL_SESSION") {
      return;
    }
    if (event === "TOKEN_REFRESHED") {
      storeSession(session);
    } else if (event === "SIGNED_OUT") {
      storeSession(null);
    } else if (event === "SIGNED_IN") {
      storeSession(session);
      await ensureProfile(session?.user);
    }
    await renderAuthState();
  });
})();
