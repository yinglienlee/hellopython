// ======================= auth.js (plain text version) =======================
// MSAL + Chatlog modal (compact, pretty, safe, no markdown)

// ---------------------- Microsoft 365 Auth Setup ----------------------
const msalConfig = {
  auth: {
    clientId: 'ed80079f-7763-4181-84fa-b3a775f69355',
    authority: 'https://login.microsoftonline.com/organizations',
    redirectUri: window.location.origin,
    navigateToLoginRequestUrl: false
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false
  }
};

const loginRequest = { scopes: ['User.Read', 'User.ReadBasic.All'] };
const msalInstance = new msal.PublicClientApplication(msalConfig);
let currentUser = null;

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
  const stored = localStorage.getItem('userInfo');
  if (stored) return JSON.parse(stored);
  if (currentUser) {
    return {
      name: currentUser.displayName || currentUser.name || '學生',
      email: currentUser.email || '',
      organization: currentUser.organization || ''
    };
  }
  return null;
}

// ---------------------- Auth Flow ----------------------
async function initAuth() {
  try {
    const redirectResponse = await msalInstance.handleRedirectPromise();
    if (redirectResponse && redirectResponse.state) {
      const returnUrl = decodeURIComponent(redirectResponse.state);
      if (returnUrl && returnUrl !== window.location.href) {
        window.location.replace(returnUrl);
        return true;
      }
    }

    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0) {
      currentUser = accounts[0];
      msalInstance.setActiveAccount(currentUser);
      await getUserDetails();
      localStorage.setItem('userInfo', JSON.stringify({
        name: currentUser.displayName,
        email: currentUser.email,
        organization: currentUser.organization
      }));
      showWelcomeBanner();
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Auth error:', error);
    return false;
  }
}

async function login() {
  try {
    const response = await msalInstance.loginPopup(loginRequest);
    currentUser = response.account;
    msalInstance.setActiveAccount(currentUser);
    await getUserDetails();
    localStorage.setItem('userInfo', JSON.stringify({
      name: currentUser.displayName,
      email: currentUser.email,
      organization: currentUser.organization
    }));
    hideLoginPrompt();
    showWelcomeBanner();
    document.body.classList.add('user-logged-in');
    return true;
  } catch (error) {
    console.error('❌ Login failed:', error);
    alert('登入失敗，請重試');
    return false;
  }
}

async function logout() {
  try {
    localStorage.removeItem('userInfo');
    await msalInstance.logoutRedirect({
      account: msalInstance.getActiveAccount() || currentUser || undefined,
      postLogoutRedirectUri: window.location.href.split('#')[0]
    });
    currentUser = null;
  } catch (error) {
    console.error('❌ Logout error:', error);
  }
}

// ---------------------- Check Login State ----------------------
function isLoggedIn() {
  try {
    // Use MSAL to check if there’s at least one active account
    const accounts = msalInstance.getAllAccounts();
    if (accounts && accounts.length > 0) return true;

    // Fallback: check if userInfo is cached locally
    const stored = localStorage.getItem('userInfo');
    if (stored) {
      const info = JSON.parse(stored);
      return !!(info && info.email);
    }

    return false;
  } catch (err) {
    console.warn('⚠️ isLoggedIn check failed:', err);
    return false;
  }
}

async function getUserDetails() {
  try {
    const tokenResponse = await msalInstance.acquireTokenSilent({
      ...loginRequest,
      account: currentUser
    });
    const response = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { 'Authorization': `Bearer ${tokenResponse.accessToken}` }
    });
    if (response.ok) {
      const userDetails = await response.json();
      currentUser.displayName = userDetails.displayName || currentUser.name;
      currentUser.email = userDetails.mail || userDetails.userPrincipalName;
      currentUser.jobTitle = userDetails.jobTitle || '';
    }
  } catch (error) {
    console.error('❌ Get user details failed:', error);
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
        <button onclick="login()" style="padding:.8rem 1.2rem;background:#0ea5e9;color:#fff;border:none;border-radius:8px;cursor:pointer;">🔐 登入</button>
      </div>
    </div>`;
  document.body.appendChild(el);
}
function hideLoginPrompt() {
  const el = document.getElementById('login-prompt');
  if (el) el.remove();
}

// ---------------------- Welcome Banner ----------------------
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
      <span>👋 你好，<strong style="color:#0891b2;">${escapeHtml(userInfo.name)}</strong></span>
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
  createChatLogModalIfNeeded();
  const modal = document.getElementById('chatlog-modal');
  const container = document.getElementById('chatlog-content');
  const jumpMenu = document.getElementById('challenge-jump');
  const searchBox = document.getElementById('cl-search');

  modal.style.display = 'block';
  container.innerHTML = `<div class="cl-chip">讀取中…</div>`;

  try {
    const user = getUserInfo() || {};
    const params = new URLSearchParams({
      email: (user.email || '').toLowerCase(),
      documentTitle: document.title
    });
    const res = await fetch(`https://chatbot-api-250975721717.asia-east1.run.app/api/chat/logs?${params.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const challenges = (data && data.challenges) || [];

    if (!challenges.length) {
      container.innerHTML = `<div class="cl-chip">尚無紀錄。</div>`;
      return;
    }

    // dropdown
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

    // search filter
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

    // render
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

// ---------------------- Init ----------------------
window.addEventListener('DOMContentLoaded', async () => {
  await initAuth();
});
window.openChatLogModal = openChatLogModal;
window.closeChatLogModal = closeChatLogModal;
