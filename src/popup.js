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

// Basic HTML escaping to prevent injection when building strings
function escapeHtml(str = "") {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;");
}

// Leaderboard now only supports friends scope

// Daily usage goal for ring progress
const DEFAULT_DAILY_GOAL = 10;
let DAILY_GOAL = DEFAULT_DAILY_GOAL;

// Settings keys
const USES_BEFORE_PROMPT_KEY = "aidetox_uses_before_prompt";
const LIMIT_PERIOD_KEY = "aidetox_limit_period";
const ALWAYS_ASK_KEY = "aidetox_always_ask";
const UNLOCK_DELAY_KEY = "aidetox_unlock_delay";
const MIN_CHARS_KEY = "aidetox_min_chars";
const CHECK_REASON_KEY = "aidetox_check_reason";
const DAILY_GOAL_KEY = "aidetox_daily_goal";

function loadSettings() {
  chrome.storage.local.get([
    USES_BEFORE_PROMPT_KEY,
    LIMIT_PERIOD_KEY,
    ALWAYS_ASK_KEY,
    UNLOCK_DELAY_KEY,
    MIN_CHARS_KEY,
    CHECK_REASON_KEY,
    DAILY_GOAL_KEY,
  ], (res) => {
    const uses = res[USES_BEFORE_PROMPT_KEY] ?? 0;
    const period = res[LIMIT_PERIOD_KEY] || "hour";
    const alwaysAsk = !!res[ALWAYS_ASK_KEY];
    const unlock = res[UNLOCK_DELAY_KEY] ?? 10;
    const minChars = res[MIN_CHARS_KEY] ?? 10;
    const checkReason = !!res[CHECK_REASON_KEY];
    const dailyGoal = res[DAILY_GOAL_KEY] ?? DEFAULT_DAILY_GOAL;
    DAILY_GOAL = dailyGoal;

    const usesEl = document.getElementById("set-uses-before");
    const periodEl = document.getElementById("set-limit-period");
    const alwaysAskEl = document.getElementById("set-always-ask");
    const unlockEl = document.getElementById("set-unlock");
    const minCharsEl = document.getElementById("set-minchars");
    const checkReasonEl = document.getElementById("set-check-reason");
    const dailyGoalEl = document.getElementById("set-daily-goal");

    if (usesEl) usesEl.value = uses;
    if (periodEl) periodEl.value = period;
    if (alwaysAskEl) alwaysAskEl.checked = alwaysAsk;
    if (unlockEl) unlockEl.value = unlock;
    if (minCharsEl) minCharsEl.value = minChars;
    if (checkReasonEl) checkReasonEl.checked = checkReason;
    if (dailyGoalEl) dailyGoalEl.value = dailyGoal;
  });
}

function saveSettings() {
  const usesEl = document.getElementById("set-uses-before");
  const periodEl = document.getElementById("set-limit-period");
  const alwaysAskEl = document.getElementById("set-always-ask");
  const unlockEl = document.getElementById("set-unlock");
  const minCharsEl = document.getElementById("set-minchars");
  const checkReasonEl = document.getElementById("set-check-reason");
  const dailyGoalEl = document.getElementById("set-daily-goal");

  const uses = parseInt(usesEl?.value, 10) || 0;
  const period = periodEl?.value === "day" ? "day" : "hour";
  const alwaysAsk = !!alwaysAskEl?.checked;
  const unlock = parseInt(unlockEl?.value, 10) || 0;
  const minChars = parseInt(minCharsEl?.value, 10) || 0;
  const checkReason = !!checkReasonEl?.checked;
  const dailyGoal = parseInt(dailyGoalEl?.value, 10) || DEFAULT_DAILY_GOAL;

  chrome.storage.local.set({
    [USES_BEFORE_PROMPT_KEY]: uses,
    [LIMIT_PERIOD_KEY]: period,
    [ALWAYS_ASK_KEY]: alwaysAsk,
    [UNLOCK_DELAY_KEY]: unlock,
    [MIN_CHARS_KEY]: minChars,
    [CHECK_REASON_KEY]: checkReason,
    [DAILY_GOAL_KEY]: dailyGoal,
  });
}

document.getElementById("set-uses-before")?.addEventListener("change", saveSettings);
document.getElementById("set-limit-period")?.addEventListener("change", saveSettings);
document.getElementById("set-always-ask")?.addEventListener("change", saveSettings);
document.getElementById("set-unlock")?.addEventListener("change", saveSettings);
document.getElementById("set-minchars")?.addEventListener("change", saveSettings);
document.getElementById("set-check-reason")?.addEventListener("change", saveSettings);
document.getElementById("set-daily-goal")?.addEventListener("change", saveSettings);

// -------------------------
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

async function renderAuthState(sessionOverride, loggedOutMessage) {
  const status = $("#auth-status");
  const btnSignup = $("#btn-show-signup");
  const btnLogin  = $("#btn-show-login");
  const btnLogout = $("#btn-logout");
  const formSignup = $("#form-signup");
  const formLogin  = $("#form-login");

  try {
    let session = sessionOverride;
    if (session === undefined) {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      session = data.session;
    }

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

  status.textContent = loggedOutMessage || "Not logged in";
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
  hide($("#btn-show-signup"));
  hide($("#btn-show-login"));
  hide($("#form-login"));
  show($("#form-signup"));
  $("#su-email")?.focus();
});
$("#btn-show-login")?.addEventListener("click", () => {
  hide($("#btn-show-signup"));
  hide($("#btn-show-login"));
  hide($("#form-signup"));
  show($("#form-login"));
  $("#li-email")?.focus();
});

$("#btn-cancel-signup")?.addEventListener("click", () => {
  show($("#btn-show-signup"));
  show($("#btn-show-login"));
  hide($("#form-signup"));
  $("#su-msg").textContent = "";
});
$("#btn-cancel-login")?.addEventListener("click", () => {
  show($("#btn-show-signup"));
  show($("#btn-show-login"));
  hide($("#form-login"));
  $("#li-msg").textContent = "";
});
$("#link-show-login")?.addEventListener("click", (e) => {
  e.preventDefault();
  hide($("#form-signup"));
  show($("#form-login"));
  $("#li-email")?.focus();
});
$("#link-show-signup")?.addEventListener("click", (e) => {
  e.preventDefault();
  hide($("#form-login"));
  show($("#form-signup"));
  $("#su-email")?.focus();
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
  // Notify the user that a confirmation email has been sent
  msg.textContent = "";
  alert("Confirmation email sent. Please check your inbox.");
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
  const status = $("#auth-status");
  if (status) status.textContent = "Logging out...";
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("Sign out failed:", error.message);
    return;
  }
  // Clear the stored session and immediately reflect logged-out state
  storeSession(null);
  await renderAuthState(null, "Logged out");
});

// -------------------------
// Activity Tab
// -------------------------

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

// NEW BRANCH: gradient ring + color progression
function progressColor(p) {
  p = Math.min(Math.max(p, 0), 1);
  let h;
  if (p <= 0.5) h = 120 - (p / 0.5) * 60; // 120 -> 60
  else h = 60 - ((p - 0.5) / 0.5) * 60;   // 60 -> 0
  return `hsl(${h},95%,50%)`;
}

function renderDailyUsageRing(currentUses, dailyGoal = DAILY_GOAL, size = 120, strokeWidth = 8) {
  const wrap = document.getElementById("daily-ring");
  if (!wrap) return;

  if (dailyGoal <= 0) dailyGoal = 1;
  const progress = Math.min(Math.max(currentUses / dailyGoal, 0), 1);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let svg = wrap.querySelector("svg");
  let arc;
  if (!svg) {
    svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", size);
    svg.setAttribute("height", size);

    const track = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    track.setAttribute("cx", size / 2);
    track.setAttribute("cy", size / 2);
    track.setAttribute("r", radius);
    track.setAttribute("stroke", "#000");
    track.setAttribute("stroke-opacity", "0.1");
    track.setAttribute("stroke-width", strokeWidth);
    track.setAttribute("fill", "none");

    arc = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    arc.classList.add("arc");
    arc.setAttribute("cx", size / 2);
    arc.setAttribute("cy", size / 2);
    arc.setAttribute("r", radius);
    arc.setAttribute("fill", "none");
    arc.setAttribute("stroke-width", strokeWidth);
    arc.setAttribute("stroke-linecap", "round");
    arc.setAttribute("transform", `rotate(-90 ${size / 2} ${size / 2})`);
    arc.setAttribute("stroke-dasharray", String(circumference));
    arc.setAttribute("stroke-dashoffset", String(circumference));
    arc.style.transition = "stroke-dashoffset .5s ease, stroke .5s ease";

    svg.appendChild(track);
    svg.appendChild(arc);
    wrap.appendChild(svg);
  } else {
    arc = svg.querySelector(".arc");
  }

  const offset = circumference * (1 - progress);
  arc.setAttribute("stroke-dashoffset", String(offset));
  arc.setAttribute("stroke", progressColor(progress));

  const label = `Used ${currentUses} of ${dailyGoal} today (${Math.round(progress * 100)}%)`;
  wrap.setAttribute("aria-label", label);

  const numEl = document.getElementById("uses-today");
  if (numEl) numEl.textContent = String(currentUses);
}

function calcUsageStats(log = []) {
  const msDay = 24 * 60 * 60 * 1000;
  const today = new Date();
  const startOfDay = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const todayStart = startOfDay(today);
  const weekStart = new Date(todayStart - 6 * msDay);
  const monthStart = new Date(todayStart - 29 * msDay);

  let dayCount = 0, weekCount = 0, monthCount = 0;
  const days = [];
  for (const entry of log) {
    if (entry.event !== "proceed") continue;
    const at = new Date(entry.at);
    if (at >= todayStart) dayCount++;
    if (at >= weekStart) weekCount++;
    if (at >= monthStart) monthCount++;
    days.push(startOfDay(at));
  }
  days.sort((a,b) => a - b);
  let longest = 0;
  for (let i = 1; i < days.length; i++) {
    const gap = Math.floor((days[i] - days[i-1]) / msDay) - 1;
    if (gap > longest) longest = gap;
  }
  if (days.length) {
    const gap = Math.floor((todayStart - days[days.length-1]) / msDay) - 1;
    if (gap > longest) longest = gap;
  }
  return { today: dayCount, week: weekCount, month: monthCount, longest: Math.max(longest,0) };
}

function renderActivitySummary(log = []) {
  const { today, week, month, longest } = calcUsageStats(log);
  renderDailyUsageRing(today, DAILY_GOAL);
  const weekEl = document.getElementById("uses-week");
  const monthEl = document.getElementById("uses-month");
  const streakEl = document.getElementById("longest-streak");
  if (weekEl) weekEl.textContent = String(week);
  if (monthEl) monthEl.textContent = String(month);
  if (streakEl) streakEl.textContent = String(longest);
}

function loadAndRender() {
  chrome.storage.local.get([DAILY_GOAL_KEY], (cfg) => {
    DAILY_GOAL = parseInt(cfg[DAILY_GOAL_KEY], 10) || DEFAULT_DAILY_GOAL;
    chrome.runtime.sendMessage({ type: "AIDETOX_GET_LOG" }, (res) => {
      if (!res?.ok) return;
      const log = res.log || [];
      updateStats(log);
      renderActivitySummary(log);
    });
  });
}

// -------------------------
// Leaderboard
// -------------------------
async function getLeaderboard(metric) {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return { entries: [], me: null, error: "login_required" };
  }

  const url = new URL(FN_LEADERBOARDS);
  url.searchParams.set("metric", metric); // "novisit"
  url.searchParams.set("scope", "friends");

  try {
    const headers = {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${session.access_token}`,
    };

    const res = await fetch(url.toString(), { headers });
    let json = null;
    try { json = await res.json(); } catch (_) {}
    if (res.status === 401) {
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
      <span class="name">${escapeHtml(e.name || "Unnamed")}</span>
      <span class="val">${e.val}</span>
    </div>
  `).join("");

  const meInList = lb.me && lb.entries.some((e) => e.id === lb.me.id);
  const meRow = !meInList && lb.me
    ? `<div class="row me"><span class="rank">${lb.me.rank}</span>` +
      `<span class="name">${lb.me.name || "Unnamed"}</span><span class="val">${lb.me.val}</span></div>`
    : "";

  wrap.innerHTML = rows + meRow;
}

async function renderOffGridLeaderboard() {
  const lb = await getLeaderboard("novisit");
  renderRanklist("lb-novisit-list", lb);
}

async function renderFriendsTab() {
  await renderOffGridLeaderboard();

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
  const countEl = $("#req-count");
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
    if (countEl) { countEl.textContent = reqRows.length; show(countEl); }
  } else {
    reqEl.innerHTML = "<li class='empty'>No friend requests.</li>";
    if (countEl) hide(countEl);
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

$("#toggle-add-friend")?.addEventListener("click", () => {
  const card = $("#add-friend-card");
  const reqCard = $("#friend-requests-card");
  if (reqCard) hide(reqCard);
  card?.classList.toggle("hidden");
});

$("#toggle-requests")?.addEventListener("click", () => {
  const card = $("#friend-requests-card");
  const addCard = $("#add-friend-card");
  if (addCard) hide(addCard);
  card?.classList.toggle("hidden");
  const badge = $("#req-count");
  if (badge) hide(badge);
});

// Leaderboard always shows friends; scope toggle removed

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

    if (target === "tab-activity") loadAndRender();
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
      await renderAuthState(session);
      return;
    } else if (event === "SIGNED_OUT") {
      storeSession(null);
      await renderAuthState(null, "Logged out");
      return;
    } else if (event === "SIGNED_IN") {
      storeSession(session);
      await ensureProfile(session?.user);
    }
    await renderAuthState(session);
  });
})();
