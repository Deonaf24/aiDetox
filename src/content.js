(async function () {
    const LLM_DOMAINS = [
      'chatgpt.com', 'chat.openai.com', 'claude.ai', 'gemini.google.com',
      'perplexity.ai', 'copilot.microsoft.com', 'poe.com',
      'character.ai', 'huggingface.co', 'openrouter.ai'
    ];
    if (!LLM_DOMAINS.some(d => location.hostname.endsWith(d))) return;

    // API detection (prevents errors if pasted into console)
    const api = (typeof chrome !== 'undefined' && chrome.runtime)
      ? chrome
      : (typeof browser !== 'undefined' && browser.runtime ? browser : null);
  
    const DOMAIN = location.hostname.replace(/^www\./, '');
    const KEY_VERSION = 'v2';
    const ALLOW_KEY = `aidetox_${KEY_VERSION}_allow_until_${DOMAIN}`;
    const REASONS_KEY = `aidetox_${KEY_VERSION}_reasons_${DOMAIN}`;
  
    const TTL = 30 * 1000;           // re-prompt after 30s
    const MIN_CHARS = 10;            // min reason length
    const UNLOCK_DELAY = 10 * 1000;  // 10 seconds lock

    const LIMIT_COUNT_KEY = 'aidetox_limit_count';
    const LIMIT_PERIOD_KEY = 'aidetox_limit_period';
    const LOG_KEY = 'aidetox_log';
    const settings = await new Promise(resolve => {
      chrome.storage.local.get([LIMIT_COUNT_KEY, LIMIT_PERIOD_KEY, LOG_KEY], resolve);
    });
    const limitCount = settings[LIMIT_COUNT_KEY] ?? 0;
    const limitPeriod = settings[LIMIT_PERIOD_KEY] || 'day';
    const log = settings[LOG_KEY] || [];
    const periodMs = limitPeriod === 'hour'
      ? 60 * 60 * 1000
      : limitPeriod === 'week'
        ? 7 * 24 * 60 * 60 * 1000
        : 24 * 60 * 60 * 1000;
    const now = Date.now();
    const used = (log || []).filter(e => e.event === 'proceed' && now - e.at < periodMs).length;
    if (limitCount > 0 && used >= limitCount) {
      const block = document.createElement('div');
      block.id = 'aidetox-overlay';
      block.innerHTML = `
        <div class="aidetox-card" role="dialog" aria-modal="true">
          <h1 class="aidetox-title">AI usage limit reached</h1>
          <p class="aidetox-text">You've hit your ${limitCount} uses per ${limitPeriod}. Take a break.</p>
          <div class="aidetox-actions">
            <button class="aidetox-btn" id="aidetox-no">Close this</button>
          </div>
        </div>`;
      const lock = document.createElement('style');
      lock.textContent = `html, body { overflow: hidden !important; }`;
      document.documentElement.appendChild(lock);
      document.documentElement.appendChild(block);
      block.querySelector('#aidetox-no')?.addEventListener('click', () => {
        try {
          api?.runtime?.sendMessage?.({
            type: 'AIDETOX_LOG',
            event: 'close',
            domain: DOMAIN,
            url: location.href,
            unlock_delay_ms: 0,
          });
        } catch {}
        setTimeout(() => {
          if (api && api.runtime && api.runtime.sendMessage) {
            api.runtime.sendMessage({ type: 'AIDETOX_CLOSE_TAB' });
          } else {
            try { window.close(); } catch {}
            try { location.replace('about:blank'); } catch {}
          }
        }, 80);
      });
      return;
    }
  
    // Respect prior short allow
    let until = 0;
    try { until = Number(localStorage.getItem(ALLOW_KEY) || '0'); } catch {}
    if (until - Date.now() > TTL) {
      until = 0;
      try { localStorage.setItem(ALLOW_KEY, '0'); } catch {}
    }
    if (Date.now() < until) return;
  
    // Overlay
    const overlay = document.createElement('div');
    overlay.id = 'aidetox-overlay';
    overlay.innerHTML = `
      <div class="aidetox-card" role="dialog" aria-modal="true" aria-labelledby="aidetox-title">
        <h1 id="aidetox-title" class="aidetox-title">Are you sure you need AI for this?</h1>
        <p class="aidetox-text">Take a breath. Try to do it without AI first. If you still want to proceed, give a reason:</p>
  
        <textarea class="aidetox-input" id="aidetox-reason" placeholder="Why do you need AI right now?"></textarea>
        <div class="aidetox-hint" id="aidetox-hint">
          Minimum ${MIN_CHARS} characters.
        </div>
  
        <div class="aidetox-actions">
          <span class="aidetox-error" id="aidetox-error">Please add a bit more detail.</span>
          <button class="aidetox-btn" id="aidetox-no">No, close this</button>
          <button class="aidetox-btn aidetox-btn-primary" id="aidetox-yes" disabled>
            <span class="aidetox-lockwrap">
              <svg class="aidetox-ring" viewBox="0 0 24 24" aria-hidden="true">
                <circle class="progress" cx="12" cy="12" r="11"></circle>
              </svg>
              <svg class="aidetox-lock" viewBox="0 0 24 24" aria-hidden="true">
                <path class="lock-shackle" d="M7 10V7a5 5 0 0 1 10 0v3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <rect class="lock-body" x="6" y="10" width="12" height="10" rx="2" ry="2" fill="currentColor"/>
              </svg>
            </span>
            <span id="aidetox-yes-label">Proceed in 10</span>
          </button>
        </div>
      </div>
    `;
  
    // Lock scroll
    const lock = document.createElement('style');
    lock.textContent = `html, body { overflow: hidden !important; }`;
    document.documentElement.appendChild(lock);
    document.documentElement.appendChild(overlay);
  
    const textarea = overlay.querySelector('#aidetox-reason');
    const errorEl = overlay.querySelector('#aidetox-error');
    const yesBtn = overlay.querySelector('#aidetox-yes');
    const yesLabel = overlay.querySelector('#aidetox-yes-label');
    const arc = overlay.querySelector('.aidetox-ring .progress');
    const ringSvg = overlay.querySelector('.aidetox-ring');
  
    setTimeout(() => textarea?.focus(), 0);
  
    // Close tab on "No" — also log the action
    overlay.querySelector('#aidetox-no')?.addEventListener('click', () => {
      // log a "close" event
      try {
        api?.runtime?.sendMessage?.({
          type: 'AIDETOX_LOG',
          event: 'close',
          domain: DOMAIN,
          url: location.href,
          unlock_delay_ms: UNLOCK_DELAY
        });
      } catch {}
      // small delay to help ensure the log is sent before the tab closes
      setTimeout(() => {
        if (api && api.runtime && api.runtime.sendMessage) {
          api.runtime.sendMessage({ type: 'AIDETOX_CLOSE_TAB' });
        } else {
          try { window.close(); } catch {}
          try { location.replace('about:blank'); } catch {}
        }
      }, 80);
    });
  
    // ---- Init arc + countdown ----
    yesBtn?.style.setProperty('--unlock-ms', `${UNLOCK_DELAY}ms`);
    let circumference = null;
    if (arc) {
      const r = Number(arc.getAttribute('r') || 11);
      circumference = 2 * Math.PI * r;
      arc.setAttribute('stroke-dasharray', `${circumference} ${circumference}`); // full circle
      arc.setAttribute('stroke-dashoffset', '0');                                // fixed start
      yesBtn?.style.setProperty('--circumference', `${circumference}`);
    }
    yesBtn?.classList.add('aidetox-counting');
  
    let remaining = UNLOCK_DELAY / 1000;
    const updateLabel = () => { if (yesLabel) yesLabel.textContent = `Proceed in ${remaining}`; };
    updateLabel();
  
    const interval = setInterval(() => {
      remaining -= 1;
      if (remaining > 0) {
        updateLabel();
      } else {
        clearInterval(interval);
        // freeze zero-length arc, then remove ring
        if (arc && circumference != null) {
          arc.setAttribute('stroke-dasharray', `0 ${circumference}`);
        }
        ringSvg?.remove();
  
        if (yesBtn) {
          yesBtn.removeAttribute('disabled');
          if (yesLabel) yesLabel.textContent = 'Proceed';
          yesBtn.classList.remove('aidetox-counting');
          yesBtn.classList.add('aidetox-unlocking');
        }
      }
    }, 1000);
  
    // Validate + proceed — also log the "proceed" with reason
    function proceedIfValid() {
      if (yesBtn?.hasAttribute('disabled')) return;
      const reason = (textarea?.value || '').trim();
      if (reason.length < MIN_CHARS) {
        if (errorEl) errorEl.style.display = 'inline';
        return;
      }
  
      // per-domain local log (optional, keep if you like)
      try {
        const entry = { at: new Date().toISOString(), reason };
        const arr = JSON.parse(localStorage.getItem(REASONS_KEY) || '[]');
        arr.push(entry);
        localStorage.setItem(REASONS_KEY, JSON.stringify(arr));
      } catch {}
  
      // central log in chrome.storage
      try {
        api?.runtime?.sendMessage?.({
          type: 'AIDETOX_LOG',
          event: 'proceed',
          domain: DOMAIN,
          url: location.href,
          reason,
          unlock_delay_ms: UNLOCK_DELAY
        });
      } catch {}
  
      // short allow buffer
      try { localStorage.setItem(ALLOW_KEY, String(Date.now() + TTL)); } catch {}
  
      try { clearInterval(interval); } catch {}
      overlay.remove();
      lock.remove();
    }
  
    yesBtn?.addEventListener('click', proceedIfValid);
    textarea?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        proceedIfValid();
      }
    });
  })();
  