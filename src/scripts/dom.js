//HELPERS
const $  = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));
const show = (el) => el && el.classList.remove("hidden");
const hide = (el) => el && el.classList.add("hidden");

//Logo Injection
const logoImg = $("#logo");
if (logoImg) logoImg.src = chrome.runtime.getURL("../icons/icon-128.png");

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