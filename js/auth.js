// ======================= auth.js (updated) =======================
// MSAL + Chatlog modal + server-side auth (ID token → Authorization header)

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
let msIdToken = null;

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

async function getIdToken() {
  // Try cached token first
  if (msIdToken) return msIdToken;

  const accounts = msalInstance.getAllAccounts();
  if (!accounts.length) return null;

  try {
    const tokenResponse = await msalInstance.acquireTokenSilent({
      ...loginRequest,
      account: accounts[0]
    });
    msIdToken = tokenResponse.idToken || null;
    return msIdToken;
  } catch (e) {
    console.warn('❌ acquireTokenSilent for idToken failed:', e);
    return null;
  }
}

// ---------------------- Auth Flow ----------------------
async function initAuth() {
  try {
    const redirectResponse = await msalInstance.handleRedirectPromise();
    if (redirectResponse) {
      currentUser = redirectResponse.account || null;
      if (currentUser) {
        msalInstance.setActiveAccount(currentUser);
      }
      if (redirectResponse.idToken) {
        msIdToken = redirectResponse.idToken;
      }
      if (redirectResponse.state) {
        const returnUrl = decodeURIComponent(redirectResponse.state);
        if (returnUrl && returnUrl !== window.location.href) {
          window.location.replace(returnUrl);
          return true;
        }
      }
    }

    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0) {
      currentUser = accounts[0];
      msalInstance.setActiveAccount(currentUser);
      try {
        const tokenResponse = await msalInstance.acquireTokenSilent({
          ...loginRequest,
          account: currentUser
        });
        msIdToken = tokenResponse.idToken || msIdToken;
      } catch (e) {
        console.warn('⚠️ acquireTokenSilent during initAuth failed:', e);
      }
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
    console.error('❌ Auth init error:', error);
    return false;
  }
}

async function login() {
  try {
    const response = await msalInstance.loginPopup(loginRequest);
    currentUser = response.account;
    msalInstance.setActiveAccount(currentUser);
    msIdToken = response.idToken || msIdToken;
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
    console.error('❌ Login error:', error);
    alert('登入失敗，請稍後再試。');
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
    msIdToken = null;
  } catch (error) {
    console.error('❌ Logout error:', error);
  }
}

// ---------------------- Check Login State ----------------------
function isLoggedIn() {
  try {
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0) {
      const stored = localStorage.getItem('userInfo');
      if (stored) {
        const info = JSON.parse(stored);
        return !!(info && info.email);
      }
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

// ---------------------- Authorized Fetch Helper ----------------------
async function authorizedFetch(url, options = {}) {
  const token = await getIdToken();
  if (!token) {
    throw new Error('缺少登入資訊，請先登入。');
  }
  const headers = options.headers || {};
  return fetch(url, {
    ...options,
    headers: {
      ...headers,
      'Authorization': `Bearer ${token}`,
    },
  });
}

// ---------------------- UI Helpers ----------------------
function showLoginPrompt() {
  if (document.getElementById('login-prompt')) return;
  const el = document.createElement('div');
  el.id = 'login-prompt';
  el.innerHTML = `
    <div style="position:fixed;inset:0;background:rgba(0,0,0,.85);
                display:flex;align-items:center;justify-content:center;z-index:9999;">
      <div style="background:#fff;padding:2rem;border-radius:12px;text-align:center;max-width:360px;">
        <h2 style="margin-bottom:1rem;">請先使用學校帳號登入</h2>
        <p style="margin-bottom:1.5rem;font-size:.95rem;color:#555;">
          為了記錄你的挑戰題學習進度，請先登入 Microsoft 365 帳號。
        </p>
        <button id="login-btn"
          style="padding:.6rem 1.5rem;border:none;border-radius:999px;
                 background:#2563eb;color:#fff;font-weight:600;cursor:pointer;">
          使用學校帳號登入
        </button>
      </div>
    </div>`;
  document.body.appendChild(el);
  document.getElementById('login-btn').onclick = login;
}

function hideLoginPrompt() {
  const el = document.getElementById('login-prompt');
  if (el) el.remove();
}

function showWelcomeBanner() {
  const info = getUserInfo();
  if (!info) return;
  const existing = document.getElementById('welcome-banner');
  if (existing) existing.remove();

  const div = document.createElement('div');
  div.id = 'welcome-banner';
  div.className = 'welcome-banner';
  div.innerHTML = `
    <div class="wb-left">
      <div class="wb-title">歡迎回來，${escapeHtml(info.name || '學生')}</div>
      <div class="wb-sub">${escapeHtml(info.email || '')}</div>
    </div>
    <div class="wb-right">
      <button class="wb-btn" onclick="openChatLogModal()">查看學習紀錄</button>
      <button class="wb-link" onclick="logout()">登出</button>
    </div>`;
  document.body.prepend(div);
}

// ---------------------- Chatlog Modal ----------------------
function createChatLogModalIfNeeded() {
  if (document.getElementById('chatlog-modal')) return;
  const modal = document.createElement('div');
  modal.id = 'chatlog-modal';
  modal.className = 'chatlog-modal';
  modal.innerHTML = `
    <div class="cl-backdrop" onclick="closeChatLogModal()"></div>
    <div class="cl-panel">
      <div class="cl-header">
        <div class="cl-title">學習紀錄總覽</div>
        <div class="cl-tools">
          <select id="challenge-jump" class="cl-select"></select>
          <input id="cl-search" class="cl-search" placeholder="搜尋關鍵字...">
          <button class="cl-close" onclick="closeChatLogModal()">✕</button>
        </div>
      </div>
      <div id="chatlog-content" class="cl-body"></div>
    </div>`;
  document.body.appendChild(modal);
}

function closeChatLogModal() {
  const modal = document.getElementById('chatlog-modal');
  if (modal) modal.style.display = 'none';
}

async function openChatLogModal() {
  createChatLogModalIfNeeded();
  const modal = document.getElementById('chatlog-modal');
  const container = document.getElementById('chatlog-content');
  const jumpMenu = document.getElementById('challenge-jump');
  const searchBox = document.getElementById('cl-search');

  modal.style.display = 'block';
  container.innerHTML = `<div class="cl-chip">讀取中…</div>`;

  try {
    const token = await getIdToken();
    if (!token) {
      container.innerHTML = `<div class="cl-chip">請先登入以查看聊天紀錄。</div>`;
      showLoginPrompt();
      return;
    }

    const params = new URLSearchParams({
      documentTitle: document.title
    });
    const res = await fetch(`https://chatbot-api-250975721717.asia-east1.run.app/api/chat/logs?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
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

    jumpMenu.onchange = () => {
      const id = jumpMenu.value;
      if (!id) return;
      const el = document.getElementById(id);
      if (el) {
        el.open = true;
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    // search
    searchBox.oninput = () => {
      const q = searchBox.value.trim().toLowerCase();
      document.querySelectorAll('.cl-card').forEach(card => {
        const haystack = (card.dataset.search || '').toLowerCase();
        card.style.display = (!q || haystack.includes(q)) ? '' : 'none';
      });
    };

    // helpers
    function chip(text) { return `<span class="cl-chip">${escapeHtml(text)}</span>`; }

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
            <div class="cl-text">${text}</div>
          </div>
        </div>`;
    }

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
