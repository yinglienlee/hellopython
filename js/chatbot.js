// 本地伺服器 API 端點
// const API_BASE_ENDPOINT = 'http://localhost:5000/api/chat';
const API_BASE_ENDPOINT = 'https://chatbot-api-250975721717.asia-east1.run.app/api/chat';
const CHAT_ENDPOINT = `${API_BASE_ENDPOINT}/gemini`;   // /api/chat/gemini
const SUMMARY_ENDPOINT = `${API_BASE_ENDPOINT}/summary`; // /api/chat/summary
// const CHAT_ENDPOINT = `${API_BASE_ENDPOINT}/claude`;

// 聊天機器人停靠位置和大小設定
let chatbotDockPosition = localStorage.getItem('chatbotDockPosition') || 'right';
let chatbotSize = {
  right: parseInt(localStorage.getItem('chatbotSizeRight')) || 400,
  bottom: parseInt(localStorage.getItem('chatbotSizeBottom')) || 350,
  top: parseInt(localStorage.getItem('chatbotSizeTop')) || 350
};

let isResizing = false;
let startX = 0;
let startY = 0;
let startSize = 0;

let allConversations = {};

let currentConversation = {
  challengeId: null,
  challengeTitle: null,
  messages: [],
  isLoading: false,
  challengeContent: null
};

// --------------- Challenge Content ---------------
function extractChallengeContent(challengeElement) {
  if (!challengeElement) {
    console.error('❌ 找不到挑戰元素');
    return null;
  }

  const clone = challengeElement.cloneNode(true);
  clone.querySelectorAll('.chatbot-toggle-btn').forEach(btn => btn.remove());

  const answerElement = clone.querySelector('.answer');
  let answerText = '';
  if (answerElement) {
    answerText = answerElement.textContent;
    answerElement.remove();
  }

  let text = clone.innerText || clone.textContent;
  text = text.replace(/\n{3,}/g, '\n\n').trim();

  console.log('✅ 挑戰內容已提取:', text.length, '字元');
  return { text, answer: answerText };
}

// --------------- Login Prompt for Chatbot ---------------
function showLoginPromptForChatbot() {
  if (document.getElementById('login-prompt')) return;

  const loginPrompt = document.createElement('div');
  loginPrompt.id = 'login-prompt';
  loginPrompt.innerHTML = `
    <div style="
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.85);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      backdrop-filter: blur(4px);
    ">
      <div style="
        background: white;
        padding: 3rem 2.5rem;
        border-radius: 16px;
        text-align: center;
        max-width: 420px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
        animation: slideIn 0.4s ease;
      ">
        <div style="font-size: 3rem; margin-bottom: 1rem;">🤖</div>
        <h2 style="margin-bottom: 0.5rem; color: #1f2937; font-size: 1.5rem;">使用學習助手</h2>
        <p style="color: #6b7280; margin-bottom: 2rem; line-height: 1.6;">
          要使用 AI 學習助手,需要先登入<br>
          以便為你提供個人化的學習體驗
        </p>
        <button id="login-ms-btn" style="
          width: 100%;
          padding: 1rem 2rem;
          background: linear-gradient(135deg, #0891b2 0%, #0e7490 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(8, 145, 178, 0.3);
          transition: all 0.3s;
          margin-bottom: 0.75rem;
        ">
          🔐 使用 Microsoft 365 登入
        </button>
        <button onclick="closeLoginPrompt()" style="
          width: 100%;
          padding: 0.75rem 1.5rem;
          background: transparent;
          color: #6b7280;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.3s;
        ">
          稍後再說,繼續瀏覽教材
        </button>
      </div>
    </div>
    <style>
      @keyframes slideIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
    </style>
  `;
  document.body.appendChild(loginPrompt);

  const loginBtn = document.getElementById('login-ms-btn');
  if (loginBtn) {
    loginBtn.onclick = function () {
      closeLoginPrompt();
      if (typeof login === 'function') login();
    };
  }
}

function closeLoginPrompt() {
  const loginPrompt = document.getElementById('login-prompt');
  if (loginPrompt) {
    loginPrompt.style.animation = 'fadeOut 0.3s ease';
    setTimeout(() => loginPrompt.remove(), 300);
  }
}

// --------------- Open Chatbot (requires login) ---------------
function openChatbot(buttonElement) {
  if (!isLoggedIn()) {
    showLoginPromptForChatbot();
    return;
  }

  const challengeElement = buttonElement.closest('.challenge-item');
  const challengeId = challengeElement.id;

  const captionElement = challengeElement.querySelector('h3.caption');
  let challengeTitle = challengeId;
  if (captionElement) {
    const clonedCaption = captionElement.cloneNode(true);
    const iconSpan = clonedCaption.querySelector('.icon');
    if (iconSpan) iconSpan.remove();
    challengeTitle = clonedCaption.textContent.trim();
  }

  console.log('🎯 打開挑戰:', challengeId);
  console.log('📝 挑戰標題:', challengeTitle);

  if (!allConversations[challengeId]) {
    const c = extractChallengeContent(challengeElement);
    allConversations[challengeId] = {
      challengeId,
      challengeTitle,
      messages: [],
      isLoading: false,
      challengeContent: c.text,
      answer: c.answer
    };
    currentConversation = allConversations[challengeId];
    generateWelcomeMessage();
  } else {
    currentConversation = allConversations[challengeId];
    console.log('🔄 恢復挑戰對話:', challengeId, currentConversation.messages.length, '條訊息');
  }

  document.getElementById('chatbot-title').textContent =
    `🤖 Python 學習助手 - ${challengeTitle}`;

  const container = document.getElementById('chatbot-container');
  container.style.display = 'block';
  applyChatbotDockPosition(chatbotDockPosition);
  initializeResizer();
  renderMessages();

  if (typeof adjustBannerPosition === 'function') {
    adjustBannerPosition();
  }

  setTimeout(() => {
    const input = document.getElementById('chatbot-input');
    input.focus();
    input.addEventListener('input', e => autoResizeTextarea(e.target));
  }, 100);
}

// --------------- Docking & Resizing ---------------
function dockChatbot(position) {
  chatbotDockPosition = position;
  localStorage.setItem('chatbotDockPosition', position);
  applyChatbotDockPosition(position);

  if (typeof adjustBannerPosition === 'function') {
    adjustBannerPosition();
  }
}

function applyChatbotDockPosition(position) {
  const container = document.getElementById('chatbot-container');
  const body = document.body;
  const dockRightBtn = document.getElementById('dock-right-btn');
  const dockBottomBtn = document.getElementById('dock-bottom-btn');

  container.classList.remove(
    'chatbot-docked-right',
    'chatbot-docked-bottom',
    'chatbot-docked-top'
  );
  container.classList.add(`chatbot-docked-${position}`);

  body.classList.remove(
    'chatbot-open-right',
    'chatbot-open-bottom',
    'chatbot-open-top',
    'chatbot-open'
  );
  body.classList.add('chatbot-open');

  body.style.setProperty('--chatbot-offset-right', '0px');
  body.style.setProperty('--chatbot-offset-bottom', '0px');
  body.style.setProperty('--chatbot-offset-top', '0px');

  if (position === 'right') {
    container.style.width = chatbotSize.right + 'px';
    container.style.height = '100vh';
    body.classList.add('chatbot-open-right');
    body.style.setProperty('--chatbot-offset-right', chatbotSize.right + 'px');

    if (dockBottomBtn) dockBottomBtn.style.display = 'inline-block';
    if (dockRightBtn) dockRightBtn.style.display = 'none';
  } else if (position === 'bottom') {
    container.style.width = '100%';
    container.style.height = chatbotSize.bottom + 'px';
    body.classList.add('chatbot-open-bottom');
    body.style.setProperty('--chatbot-offset-bottom', chatbotSize.bottom + 'px');

    if (dockRightBtn) dockRightBtn.style.display = 'inline-block';
    if (dockBottomBtn) dockBottomBtn.style.display = 'none';
  }

  localStorage.setItem('chatbotDockPosition', position);
  chatbotDockPosition = position;
}

function initializeResizer() {
  const resizer = document.getElementById('chatbot-resizer');
  if (!resizer) return;

  resizer.replaceWith(resizer.cloneNode(true));
  const newResizer = document.getElementById('chatbot-resizer');
  newResizer.addEventListener('mousedown', startResize);
}

function startResize(e) {
  isResizing = true;
  startX = e.clientX;
  startY = e.clientY;

  const container = document.getElementById('chatbot-container');
  startSize = (chatbotDockPosition === 'right')
    ? container.offsetWidth
    : container.offsetHeight;

  document.addEventListener('mousemove', resize);
  document.addEventListener('mouseup', stopResize);
  e.preventDefault();
}

function resize(e) {
  if (!isResizing) return;

  const container = document.getElementById('chatbot-container');
  const body = document.body;
  let newSize;

  if (chatbotDockPosition === 'right') {
    const deltaX = startX - e.clientX;
    newSize = Math.max(300, Math.min(startSize + deltaX, window.innerWidth - 100));
    container.style.width = newSize + 'px';
    chatbotSize.right = newSize;
    body.style.setProperty('--chatbot-offset-right', newSize + 'px');
    localStorage.setItem('chatbotSizeRight', newSize);
  } else if (chatbotDockPosition === 'bottom') {
    const deltaY = startY - e.clientY;
    newSize = Math.max(200, Math.min(startSize + deltaY, window.innerHeight - 100));
    container.style.height = newSize + 'px';
    chatbotSize.bottom = newSize;
    body.style.setProperty('--chatbot-offset-bottom', newSize + 'px');
    localStorage.setItem('chatbotSizeBottom', newSize);
  }

  if (typeof adjustBannerPosition === 'function') {
    adjustBannerPosition();
  }
}

function stopResize() {
  if (!isResizing) return;
  isResizing = false;
  document.removeEventListener('mousemove', resize);
  document.removeEventListener('mouseup', stopResize);
}

// --------------- Navigation helpers ---------------
function jumpToChallenge() {
  if (!currentConversation.challengeId) {
    console.warn('⚠️ 沒有當前挑戰 ID');
    return;
  }

  const challengeElement = document.getElementById(currentConversation.challengeId);
  if (!challengeElement) {
    console.error('❌ 找不到挑戰元素:', currentConversation.challengeId);
    alert('找不到挑戰位置');
    return;
  }

  challengeElement.scrollIntoView({
    behavior: 'smooth',
    block: 'center',
    inline: 'nearest'
  });

  highlightChallenge(challengeElement);
}

function highlightChallenge(element) {
  const originalBackground = element.style.background;
  const originalTransition = element.style.transition;

  element.style.transition = 'background 0.3s ease';
  element.style.background = 'rgba(102, 126, 234, 0.1)';

  setTimeout(() => {
    element.style.background = originalBackground;
    setTimeout(() => {
      element.style.transition = originalTransition;
    }, 300);
  }, 1500);
}

// --------------- Welcome message (protected) ---------------
async function generateWelcomeMessage() {
  currentConversation.isLoading = true;
  document.getElementById('chatbot-input').disabled = true;
  document.getElementById('chatbot-send-btn').disabled = true;
  document.getElementById('chatbot-summary-btn').disabled = true;
  renderMessages();

  try {
    const response = await fetch(CHAT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        userInfo: getUserInfo(),
        messages: [{
          role: 'user',
          content: '請用友善、鼓勵的語氣向我介紹這個挑戰,並提出第一個引導問題。'
        }],
        challengeId: currentConversation.challengeId,
        challengeContent: currentConversation.challengeContent,
        documentTitle: document.title,
        challengeTitle: currentConversation.challengeTitle,
        isWelcome: true
      })
    });

    if (!response.ok) throw new Error(`API request failed: ${response.status}`);

    const data = await response.json();

    currentConversation.messages = [{
      role: 'assistant',
      content: data.content
    }];
  } catch (error) {
    console.error('❌ Error generating welcome:', error);
    currentConversation.messages = [{
      role: 'assistant',
      content: '你好!我是你的 Python 學習助手 😊 準備好開始學習了嗎?'
    }];
  } finally {
    currentConversation.isLoading = false;
    document.getElementById('chatbot-input').disabled = false;
    document.getElementById('chatbot-send-btn').disabled = false;
    document.getElementById('chatbot-summary-btn').disabled = false;
    renderMessages();
  }
}

// --------------- Summary (protected) ---------------
async function generateSummary() {
  const input = document.getElementById('chatbot-input');
  const sendButton = document.getElementById('chatbot-send-btn');
  const summarizeButton = document.getElementById('chatbot-summary-btn');

  if (currentConversation.isLoading) return;
  if (!currentConversation.challengeId) {
    alert('請先選擇一個挑戰來開啟對話');
    return;
  }
  if (!isLoggedIn()) {
    alert('登入已過期,請重新登入');
    showLoginPromptForChatbot();
    return;
  }

  input.disabled = true;
  sendButton.disabled = true;
  summarizeButton.disabled = true;
  currentConversation.isLoading = true;
  renderMessages();

  try {
    const response = await fetch(SUMMARY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        userInfo: getUserInfo(),
        messages: currentConversation.messages,
        challengeId: currentConversation.challengeId,
        challengeContent: currentConversation.challengeContent,
        documentTitle: document.title,
        challengeTitle: currentConversation.challengeTitle
      })
    });

    if (!response.ok) throw new Error(`API request failed: ${response.status}`);

    const data = await response.json();
    currentConversation.messages.push({
      role: 'assistant',
      content: data.content
    });
  } catch (error) {
    console.error('❌ Error:', error);
    currentConversation.messages.push({
      role: 'assistant',
      content: '抱歉,發生了一些錯誤 😢 請確認伺服器是否正在運行,或稍後再試。'
    });
  } finally {
    currentConversation.isLoading = false;
    input.disabled = false;
    sendButton.disabled = false;
    summarizeButton.disabled = false;
    renderMessages();
    document.getElementById('chatbot-input').focus();
  }
}

// --------------- Close & Render ---------------
function closeChatbot() {
  document.getElementById('chatbot-container').style.display = 'none';
  const body = document.body;

  body.classList.remove('chatbot-open', 'chatbot-open-right', 'chatbot-open-bottom');
  body.style.setProperty('--chatbot-offset-right', '0px');
  body.style.setProperty('--chatbot-offset-bottom', '0px');

  if (typeof adjustBannerPosition === 'function') {
    adjustBannerPosition();
  }
}

function renderMessages() {
  const messagesContainer = document.getElementById('chatbot-messages');

  messagesContainer.innerHTML = currentConversation.messages.map(msg => {
    const className = msg.role === 'user' ? 'user-message' : 'assistant-message';
    let content = msg.content || '';

    content = content.replace(/```(\w+)?\n([\s\S]*?)```/g, (m, lang, code) =>
      `<pre><code class="code-block">${escapeHtml(code.trim())}</code></pre>`
    );
    content = content.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
    content = content.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    content = content.replace(/_([^_]+)_/g, '<em>$1</em>');
    content = content.replace(/^-\s+(.+)$/gm, '<li>$1</li>');
    content = content.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    content = content.replace(/\n/g, '<br>');

    return `<div class="message ${className}">${content}</div>`;
  }).join('');

  if (currentConversation.isLoading) {
    messagesContainer.innerHTML += `
      <div class="message assistant-message loading">
        <span class="dot">&nbsp;</span><span class="dot">&nbsp;</span><span class="dot">&nbsp;</span>
      </div>`;
  }

  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// --------------- Send Message (protected) ---------------
async function sendMessage() {
  const input = document.getElementById('chatbot-input');
  const message = input.value.trim();
  const sendButton = document.getElementById('chatbot-send-btn');
  const summarizeButton = document.getElementById('chatbot-summary-btn');

  if (!message || currentConversation.isLoading) return;
  if (!currentConversation.challengeId) {
    alert('請先選擇一個挑戰來開啟對話');
    return;
  }
  if (!isLoggedIn()) {
    alert('登入已過期,請重新登入');
    showLoginPromptForChatbot();
    return;
  }

  currentConversation.messages.push({ role: 'user', content: message });

  input.value = '';
  resetTextareaHeight();
  input.disabled = true;
  sendButton.disabled = true;
  summarizeButton.disabled = true;
  currentConversation.isLoading = true;
  renderMessages();

  try {
    const response = await fetch(CHAT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        userInfo: getUserInfo(),
        messages: currentConversation.messages,
        challengeId: currentConversation.challengeId,
        challengeContent: currentConversation.challengeContent,
        documentTitle: document.title,
        challengeTitle: currentConversation.challengeTitle
      })
    });

    if (!response.ok) throw new Error(`API request failed: ${response.status}`);

    const data = await response.json();
    currentConversation.messages.push({
      role: 'assistant',
      content: data.content
    });
  } catch (error) {
    console.error('❌ Error:', error);
    currentConversation.messages.push({
      role: 'assistant',
      content: '抱歉,發生了一些錯誤 😢 請確認伺服器是否正在運行,或稍後再試。'
    });
  } finally {
    currentConversation.isLoading = false;
    input.disabled = false;
    sendButton.disabled = false;
    summarizeButton.disabled = false;
    renderMessages();
    document.getElementById('chatbot-input').focus();
  }
}

// --------------- Input Helpers ---------------
function handleKeyPress(event) {
  const textarea = event.target;
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
    return;
  }
  setTimeout(() => autoResizeTextarea(textarea), 0);
}

function autoResizeTextarea(textarea) {
  const currentScrollTop = textarea.scrollTop;
  textarea.style.height = 'auto';
  const minHeight = 52;
  const maxHeight = 200;
  const newHeight = Math.max(minHeight, Math.min(textarea.scrollHeight, maxHeight));
  textarea.style.height = newHeight + 'px';
  if (textarea.scrollHeight > maxHeight) {
    textarea.scrollTop = currentScrollTop;
  }
}

function resetTextareaHeight() {
  const textarea = document.getElementById('chatbot-input');
  if (textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = '52px';
  }
}

// --------------- Overlay click ---------------
document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('chatbot-overlay');
  if (overlay) {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) closeChatbot();
    });
  }
});

// --------------- Export to window ---------------
window.openChatbot = openChatbot;
window.closeChatbot = closeChatbot;
window.dockChatbot = dockChatbot;
window.handleKeyPress = handleKeyPress;
window.generateSummary = generateSummary;
