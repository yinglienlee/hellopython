// ======================= auth.js =======================
// Server-side auth integration (Microsoft 365 via server.py)
// - No MSAL in browser
// - Uses /api/auth/* endpoints
// - Exposes: initAuth, isLoggedIn, getUserInfo, login, logout, openChatLogModal

const API_BASE = 'https://chatbot-api-250975721717.asia-east1.run.app/api';

let currentUser = null;
let authInitialized = false;

// ---------------------- Utility ----------------------
function escapeHtml(s) {
  return String(s || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function getUserInfo() {
  return currentUser;
}

function isLoggedIn() {
  return !!(currentUser && currentUser.email);
}

// ---------------------- Auth Flow (server-side) ----------------------
async function initAuth() {
  try {
    const res = await fetch(`${API_BASE}/auth/status`, {
      method: 'GET',
      credentials: 'include'
    });
    if (res.ok) {
      const data = await res.json();
      if (data.authenticated && data.user) {
        currentUser = data.user;
        document.body.classList.add('user-logged-in');
        showWelcomeBanner();
      }
    }
  } catch (err) {
    console.error('❌ initAuth failed:', err);
  } finally {
    authInitialized = true;
  }
}

function login() {
  const redirectUri = encodeURIComponent(window.location.href.split('#')[0]);
  window.location.href = `${API_BASE}/auth/login?redirect_uri=${redirectUri}`;
}

async function logout() {
  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    });
  } catch (err) {
    console.error('❌ Logout error:', err);
  } finally {
    currentUser = null;
    document.body.classList.remove('user-logged-in');
    const banner = document.getElementById('welcome-banner');
    if (banner) banner.remove();
    window.location.reload();
  }
}

// ---------------------- UI Helpers ----------------------
function showLoginPrompt() {
  if (document.getElementById('login-prompt')) return;
  const el = document.createElement('div');
  el.id = 'login-prompt';
  el.innerHTML = `
    <div style="position:fixed;inset:0;background:rgba(0,0,0,.85);
                display:flex;align-items:center;justify-content:center;z-index:9999;">
      <div style="background:#fff;padding:2rem;border-radius:12px;text-align:center;max-width:420px;">
        <h2>Python 學習平台</h2>
        <p style="color:#555;margin-bottom:1rem;">請使用 Microsoft 365 帳號登入以開始學習</p>
        <button id="login-confirm-btn" style="padding:.8rem 1.2rem;background:#0ea5e9;color:#fff;border:none;border-radius:8px;cursor:pointer;">🔐 登入</button>
      </div>
    </div>`;
  document.body.appendChild(el);
  document.getElementById('login-confirm-btn').onclick = () => {
    hideLoginPrompt();
    login();
  };
}

function hideLoginPrompt() {
  const el = document.getElementById('login-prompt');
  if (el) el.remove();
}

function showWelcomeBanner() {
  const old = document.getElementById('welcome-banner');
  if (old) old.remove();

  const userInfo = getUserInfo() || { name: '學生' };
  const banner = document.createElement('div');
  banner.id = 'welcome-banner';
  banner.style.cssText = `position:fixed; top:15px; right:15px; z-index:900; font-size: 0.85rem;`;
  banner.innerHTML = `
    <div style="background:#fff;padding:.6rem 1rem;border-radius:10px;
                box-shadow:0 3px 10px rgba(0,0,0,.1);display:flex;align-items:center;gap:.6rem;">
      <span>👋 你好，<strong style="color:#0891b2;">${escapeHtml(userInfo.name || '學生')}</strong></span>
      <a href="#" onclick="logout();return false;" style="color:#0891b2;font-size:.82rem;">登出</a>
      <button onclick="openChatLogModal()" style="padding:.3rem .6rem;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:8px;font-size:.8rem;">📓 我的紀錄</button>
    </div>`;
  document.body.appendChild(banner);
  createChatLogModalIfNeeded();
}

// ---------------------- Chat Log Modal ----------------------
function createChatLogModalIfNeeded() {
  if (document.getElementById('chatlog-modal')) return;
  const wrap = document.createElement('div');
  wrap.id = 'chatlog-modal';
  wrap.className = 'cl-modal-backdrop';
  wrap.innerHTML = `
    <div class="cl-modal">
      <div class="cl-header">
        <div class="cl-title">📓 我的聊天紀錄</div>
        <div class="cl-tools">
          <input id="cl-search" class="cl-search" type="search" placeholder="搜尋訊息或標題…">
          <select id="challenge-jump" class="cl-select"><option value="">跳至挑戰題...</option></select>
          <button class="cl-close" onclick="closeChatLogModal()">×</button>
        </div>
      </div>
      <div id="chatlog-content" class="cl-content"></div>
    </div>`;
  document.body.appendChild(wrap);
}

function closeChatLogModal() {
  const m = document.getElementById('chatlog-modal');
  if (m) m.style.display = 'none';
}

// ---------------------- Render Helpers ----------------------
function avatar(ch) {
  const c = (ch || 'A').trim()[0] || 'A';
  return `<div class="cl-avatar">${escapeHtml(c.toUpperCase())}</div>`;
}

function msgBubble(msg) {
  const isUser = msg.role === 'user';
  const kind = msg.kind === 'summary' ? 'summary' : (isUser ? 'user' : 'assistant');
  const text = escapeHtml((msg.text || '').trim());
  return `
    <div class="cl-msg ${isUser ? 'user' : 'assistant'}">
      ${isUser ? '' : avatar('A')}
      <div class="cl-bubble ${kind}">
        <div class="cl-meta">
          <span>${new Date(msg.timestamp).toLocaleString()}</span>
          ${msg.kind === 'summary' ? '<span class="cl-tag">總結</span>' : ''}
        </div>
        <div class="cl-msg-text">${text}</div>
      </div>
      ${isUser ? avatar((getUserInfo()?.name || '你')[0]) : ''}
    </div>`;
}

// ---------------------- Fetch & Render Chat Logs ----------------------
async function openChatLogModal() {
  if (!isLoggedIn()) {
    showLoginPrompt();
    return;
  }

  createChatLogModalIfNeeded();
  const modal = document.getElementById('chatlog-modal');
  const container = document.getElementById('chatlog-content');
  const jumpMenu = document.getElementById('challenge-jump');
  const searchBox = document.getElementById('cl-search');

  modal.style.display = 'block';
  container.innerHTML = `<div class="cl-chip">讀取中…</div>`;

  try {
    const params = new URLSearchParams({
      documentTitle: document.title
    });
    const res = await fetch(`${API_BASE}/chat/logs?${params.toString()}`, {
      method: 'GET',
      credentials: 'include'
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const challenges = (data && data.challenges) || [];

    if (!challenges.length) {
      container.innerHTML = `<div class="cl-chip">尚無紀錄。</div>`;
      return;
    }

    jumpMenu.innerHTML = '<option value="">跳至挑戰題...</option>' +
      challenges.map((c, i) => {
        const label = c.question || c.title || c.challenge_key;
        return `<option value="clg-${i}">${escapeHtml(label)}</option>`;
      }).join('');

    jumpMenu.onchange = (e) => {
      const id = e.target.value;
      if (!id) return;
      const el = document.getElementById(id);
      if (el) { el.open = true; el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      e.target.value = '';
    };

    if (searchBox) {
      searchBox.oninput = () => {
        const q = searchBox.value.trim().toLowerCase();
        [...container.querySelectorAll('.cl-card')].forEach(card => {
          const text = (card.getAttribute('data-search') || '').toLowerCase();
          card.style.display = text.includes(q) ? '' : 'none';
        });
      };
    }

    function chip(text) { return `<span class="cl-chip">${escapeHtml(text)}</span>`; }

    container.innerHTML = challenges.map((c, i) => {
      const latest = c.latest_completion ?? null;
      const best = c.best_completion ?? null;
      const chips = [latest != null ? `目前 ${latest}%` : null, best != null ? `最佳 ${best}%` : null]
        .filter(Boolean).map(chip).join('');
      const title = c.question || c.title || c.challenge_key;
      const body = c.interactions.map(msgBubble).join('');
      const searchBlob = (title + ' ' + c.interactions.map(m => m.text).join(' ')).toLowerCase();

      return `
        <details id="clg-${i}" class="cl-card" data-search="${escapeHtml(searchBlob)}">
          <summary>
            <div class="cl-card-hd">
              <div class="cl-card-title">${escapeHtml(title)}</div>
              <div class="cl-chips">${chips || chip('尚無完成度')}</div>
            </div>
          </summary>
          <div class="cl-card-bd">${body}</div>
        </details>`;
    }).join('');
  } catch (err) {
    console.error(err);
    container.innerHTML = `<div class="cl-chip">讀取失敗，請稍後再試。</div>`;
  }
}

// ---------------------- Init & Expose ----------------------
window.addEventListener('DOMContentLoaded', () => {
  initAuth();
});

window.isLoggedIn = isLoggedIn;
window.getUserInfo = getUserInfo;
window.login = login;
window.logout = logout;
window.openChatLogModal = openChatLogModal;
window.closeChatLogModal = closeChatLogModal;
