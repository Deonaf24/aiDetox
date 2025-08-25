// -------------------------
// Supabase (bundled SDK)
// -------------------------
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ltjtjgdjllmbyknaygof.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0anRqZ2RqbGxtYnlrbmF5Z29mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxNDkxOTAsImV4cCI6MjA3MTcyNTE5MH0.tMfU0stBJZ52IKWOd7A0HGSWxXMhvXVqd9dyredUEHM";
const FN_LEADERBOARDS = `${SUPABASE_URL}/functions/v1/leaderboards`;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// -------------------------
// Helpers
// -------------------------
const $  = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));
const show = (el) => el && el.classList.remove("hidden");
const hide = (el) => el && el.classList.add("hidden");

// Keep track of leaderboard scope toggle
let LB_SCOPE = "global"; // "global" | "friends"

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
async function renderAuthState() {
  const { data: { session } } = await supabase.auth.getSession();

  const status = $("#auth-status");
  const btnSignup = $("#btn-show-signup");
  const btnLogin  = $("#btn-show-login");
  const btnLogout = $("#btn-logout");
  const formSignup = $("#form-signup");
  const formLogin  = $("#form-login");

  if (session?.user) {
    status.textContent = `Logged in as ${session.user.email}`;
    hide(btnSignup); hide(btnLogin); show(btnLogout);
    hide(formSignup); hide(formLogin);
    // Store the token for background to send along if you want
    chrome.storage.local.set({ aidetox_token: session.access_token || "" });
  } else {
    status.textContent = "Not logged in";
    show(btnSignup); show(btnLogin); hide(btnLogout);
    hide(formSignup); hide(formLogin);
    chrome.storage.local.remove("aidetox_token");
  }
}

// Toggle forms
$("#btn-show-signup")?.addEventListener("click", () => {
  hide($("#form-login"));
  show($("#form-signup"));
  $("#su-username")?.focus();
});
$("#btn-show-login")?.addEventListener("click", () => {
  hide($("#form-signup"));
  show($("#form-login"));
  $("#li-email")?.focus();
});

// -------------------------
// Sign up flow (email+password+username)
// Username must be unique & permanent.
// -------------------------
$("#form-signup")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const msg = $("#su-msg");
  msg.textContent = "";

  const username = $("#su-username").value.trim();
  const email    = $("#su-email").value.trim();
  const password = $("#su-password").value;

  if (!username || !email || !password) {
    msg.textContent = "Please fill all fields.";
    return;
  }

  // 0) Pre-check username availability (requires RLS select allowed to anon)
  const { data: takenRow, error: checkErr } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (checkErr) {
    msg.textContent = "Could not verify username availability.";
    return;
  }
  if (takenRow) {
    msg.textContent = "Username is taken. Try another.";
    return;
  }

  // 1) Create the auth user
  const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({ email, password });
  if (signUpErr) {
    msg.textContent = `Sign up failed: ${signUpErr.message}`;
    return;
  }

  // 2) Insert profile row with unique username (permanent)
  const userId = signUpData.user?.id;
  if (!userId) {
    msg.textContent = "Unable to create profile. Try logging in.";
    return;
  }

  const { error: profErr } = await supabase
    .from("profiles")
    .insert({ id: userId, username });

  if (profErr) {
    // Unique violation race fallback
    if (profErr.code === "23505") {
      msg.textContent = "Username just got taken—please pick another.";
    } else {
      msg.textContent = "Could not save profile.";
    }
    return;
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

function renderTable(log, filter = "all") {
  const wrap = $("#list");
  const rows = filter === "all" ? log : log.filter(e => e.event === filter);

  if (!rows.length) {
    wrap.innerHTML = `<div class="empty">No entries yet.</div>`;
    return;
  }

  const html = rows.map((e) => `
    <div class="card ${e.event}">
      <div class="bar"></div>
      <div>
        <div class="title">${e.domain || "Unknown domain"}</div>
        <p class="reason">${e.reason ? e.reason : "—"}</p>
        <div class="meta">
          <span>${fmtTable(e.at)}</span>
          <span class="dot"></span>
          <span class="muted">${e.url ? new URL(e.url).hostname : ""}</span>
        </div>
      </div>
      <div class="card-actions">
        <a class="link" href="${e.url || "#"}" target="_blank">Open</a>
      </div>
    </div>
  `).join("");

  wrap.innerHTML = html;
}

function loadAndRender(filter = "all") {
  chrome.runtime.sendMessage({ type: "AIDETOX_GET_LOG" }, (res) => {
    if (!res?.ok) return;
    renderTable(res.log || [], filter);
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
    if (res.status === 401 && scope === "friends") {
      return { entries: [], me: null, error: "login_required" };
    }
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
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
    else if (target === "tab-settings") renderAuthState();
  });
});

// -------------------------
// Initial load
// -------------------------
loadAndRender();
renderAuthState();
