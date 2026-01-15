/**
 * chatbot.js - Updated for Firebase Auth integration
 */

const API_BASE_ENDPOINT = 'https://chatbot-api-250975721717.asia-east1.run.app/api/chat';
const CHAT_ENDPOINT = `${API_BASE_ENDPOINT}/gemini`; 
const SUMMARY_ENDPOINT = `${API_BASE_ENDPOINT}/summary`; 

// State Management
let chatbotDockPosition = localStorage.getItem('chatbotDockPosition') || 'right';
let chatbotSize = {
  right: parseInt(localStorage.getItem('chatbotSizeRight')) || 400,
  bottom: parseInt(localStorage.getItem('chatbotSizeBottom')) || 350
};
let isResizing = false;
let startX = 0, startY = 0, startSize = 0;
let allConversations = {};
let currentConversation = {
  challengeId: null,
  challengeTitle: null,
  messages: [],
  isLoading: false,
  challengeContent: null
};

// GLOBAL: Track which button was clicked for the auto-resume feature
window.pendingChatbotButton = null;

/**
 * --- CORE FUNCTIONS ---
 */

function openChatbot(buttonElement) {
  // 1. Firebase Auth Check
  const user = firebase.auth().currentUser;
  
  if (!user) {
    window.pendingChatbotButton = buttonElement; // Save reference for auth.js
    showLoginPromptForChatbot();
    return;
  }

  // 2. Extract Challenge Context
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

  // 3. Handle Conversation History
  if (!allConversations[challengeId]) {
    const c = extractChallengeContent(challengeElement);
    allConversations[challengeId] = {
      challengeId: challengeId,
      challengeTitle: challengeTitle,
      messages: [],
      isLoading: false,
      challengeContent: c.text,
      answer: c.answer
    };
    currentConversation = allConversations[challengeId];
    generateWelcomeMessage(); // Auto-start the conversation
  } else {
    currentConversation = allConversations[challengeId];
  }
  
  // 4. Update UI state
  document.getElementById('chatbot-title').textContent = `🤖 Python 學習助手 - ${challengeTitle}`;
  document.getElementById('chatbot-container').style.display = 'block';
  applyChatbotDockPosition(chatbotDockPosition);
  initializeResizer();  
  renderMessages();
  
  setTimeout(() => {
    const input = document.getElementById('chatbot-input');
    input.focus();
    input.addEventListener('input', (e) => autoResizeTextarea(e.target));
  }, 100);
}

/**
 * Extracts text and code answers from the HTML
 */
function extractChallengeContent(challengeElement) {
  if (!challengeElement) return null;
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
  return { text: text, answer: answerText };
}

/**
 * Messaging logic using Firebase Identity
 */
async function sendMessage() {
  // 1. Define user to avoid ReferenceError
  const user = firebase.auth().currentUser;
  const input = document.getElementById('chatbot-input');
  const message = input.value.trim();
  const docIdFromTitle = document.querySelector('title')?.getAttribute('docid') || "none";

  if (!message || currentConversation.isLoading || !user) return;

  // 2. Consolidate student information from the UI
  const userInfo = {
      email: user.email,
	  displayName: document.getElementById('user-display-name')?.textContent || "",
      studentName: document.getElementById('user-student-name')?.textContent || "學生",
      studentId: document.getElementById('user-student-id')?.textContent || ""
  };

  currentConversation.messages.push({ role: 'user', content: message });
  input.value = '';
  resetTextareaHeight();
  
  toggleUIState(true);
  renderMessages();
  
  try {
    const response = await fetch(CHAT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userInfo: userInfo, // Sending consolidated info
        messages: currentConversation.messages,
        challengeId: currentConversation.challengeId,
		docId: docIdFromTitle,
        challengeContent: currentConversation.challengeContent,
        documentTitle: document.title,
        challengeTitle: currentConversation.challengeTitle,
        answer: currentConversation.answer
      })
    });
    const data = await response.json();
    currentConversation.messages.push({ role: 'assistant', content: data.content });
  } catch (error) {
    console.error('❌ Error:', error);
    currentConversation.messages.push({ role: 'assistant', content: '抱歉，發生了錯誤。' });
  } finally {
    toggleUIState(false);
    renderMessages();
    document.getElementById('chatbot-input').focus();
  }
}

async function generateWelcomeMessage() {
  const user = firebase.auth().currentUser; // Define user
  const docIdFromTitle = document.querySelector('title')?.getAttribute('docid') || "none";

  if (!user) return;

  const userInfo = {
      email: user.email,
	  displayName: document.getElementById('user-display-name')?.textContent || "",
      studentName: document.getElementById('user-student-name')?.textContent || "學生",
      studentId: document.getElementById('user-student-id')?.textContent || ""
  };

  toggleUIState(true);
  try {
    const response = await fetch(CHAT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userInfo: userInfo,
        messages: [{ role: 'user', content: '請用友善、鼓勵的語氣介紹這個挑戰，並提出第一個問題。' }],
        challengeId: currentConversation.challengeId,
		docId: docIdFromTitle,
        documentTitle: document.title,		
        challengeContent: currentConversation.challengeContent,
        isWelcome: true
      })
    });
    const data = await response.json();
    currentConversation.messages = [{ role: 'assistant', content: data.content }];
  } catch (e) {
    currentConversation.messages = [{ role: 'assistant', content: '你好！我是 Python 學習助手 😊' }];
  } finally {
    toggleUIState(false);
    renderMessages();
  }
}

async function generateSummary() {
  const user = firebase.auth().currentUser;
  if (!user || currentConversation.messages.length === 0) return;

  const userInfo = {
      email: user.email,
	  displayName: document.getElementById('user-display-name')?.textContent || "",
      studentName: document.getElementById('user-student-name')?.textContent || "學生",
      studentId: document.getElementById('user-student-id')?.textContent || ""
  };

  toggleUIState(true); // Assuming you have a loading spinner
  try {
    const response = await fetch(SUMMARY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: currentConversation.messages,
        userInfo: userInfo
      })
    });
    const data = await response.json();
    
    // Display the summary in the chat UI
    currentConversation.messages.push({ role: 'assistant', content: `### 學習小結\n${data.content}` });
    renderMessages();
  } catch (error) {
    console.error('❌ Summary Error:', error);
  } finally {
	toggleUIState(false);
    renderMessages();
  }
}

// Always add this if using inline HTML onclick
window.generateSummary = generateSummary;

// UI Helpers
function toggleUIState(isLoading) {
  currentConversation.isLoading = isLoading;
  ['chatbot-input', 'chatbot-send-btn', 'chatbot-summary-btn'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.disabled = isLoading;
  });
}

function showLoginPromptForChatbot() {
    if (document.getElementById('login-prompt')) return;
    const loginPrompt = document.createElement('div');
    loginPrompt.id = 'login-prompt';
    loginPrompt.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.85); display: flex; align-items: center; justify-content: center; z-index: 9999; backdrop-filter: blur(4px);">
            <div style="background: white; padding: 3rem 2.5rem; border-radius: 16px; text-align: center; max-width: 420px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);">
                <div style="font-size: 3rem; margin-bottom: 1rem;">🤖</div>
                <h2 style="margin-bottom: 0.5rem; color: #1f2937; font-size: 1.5rem;">使用學習助手</h2>
                <p style="color: #6b7280; margin-bottom: 2rem;">請先登入 Google 帳號以開始學習。</p>
                <button onclick="loginWithFirebase()" style="width: 100%; padding: 1rem 2rem; background: #1a73e8; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; margin-bottom: 0.75rem;">🔐 使用 Google 登入</button>
                <button onclick="document.getElementById('login-prompt').remove()" style="width: 100%; padding: 0.75rem 1.5rem; background: transparent; color: #6b7280; border: 1px solid #d1d5db; border-radius: 8px; cursor: pointer;">稍後再說</button>
            </div>
        </div>`;
    document.body.appendChild(loginPrompt);
}

// Rendering, Docking, Resizing (Existing Logic Kept)
function renderMessages() {
  const container = document.getElementById('chatbot-messages');
  container.innerHTML = currentConversation.messages.map(msg => {
    const className = msg.role === 'user' ? 'user-message' : 'assistant-message';
    let content = msg.content
      .replace(/```(\w+)?\n([\s\S]*?)```/g, (m, l, code) => `<pre><code class="code-block">${escapeHtml(code.trim())}</code></pre>`)
      .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
    return `<div class="message ${className}">${content}</div>`;
  }).join('');
  if (currentConversation.isLoading) {
    container.innerHTML += `<div class="message assistant-message loading"><span class="dot">&nbsp;</span><span class="dot">&nbsp;</span><span class="dot">&nbsp;</span></div>`;
  }
  container.scrollTop = container.scrollHeight;
}

function escapeHtml(t) { const d = document.createElement('div'); d.textContent = t; return d.innerHTML; }

function closeChatbot() {
  document.getElementById('chatbot-container').style.display = 'none';
  document.body.classList.remove('chatbot-open');
  document.body.style.setProperty('--chatbot-offset-right', '0px');
  document.body.style.setProperty('--chatbot-offset-bottom', '0px');
}

function handleKeyPress(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }
function autoResizeTextarea(t) { t.style.height = 'auto'; t.style.height = Math.min(200, t.scrollHeight) + 'px'; }
function resetTextareaHeight() { const t = document.getElementById('chatbot-input'); if (t) t.style.height = '52px'; }

function applyChatbotDockPosition(pos) {
  const container = document.getElementById('chatbot-container');
  const body = document.body;
  container.classList.remove('chatbot-docked-right', 'chatbot-docked-bottom');
  container.classList.add(`chatbot-docked-${pos}`);
  body.classList.add('chatbot-open');
  if (pos === 'right') {
    container.style.width = chatbotSize.right + 'px';
    container.style.height = '100vh';
    body.style.setProperty('--chatbot-offset-right', chatbotSize.right + 'px');
  } else {
    container.style.width = '100%';
    container.style.height = chatbotSize.bottom + 'px';
    body.style.setProperty('--chatbot-offset-bottom', chatbotSize.bottom + 'px');
  }
}

function initializeResizer() {
  const resizer = document.getElementById('chatbot-resizer');
  if (resizer) resizer.onmousedown = startResize;
}

function startResize(e) {
  isResizing = true; startX = e.clientX; startY = e.clientY;
  const container = document.getElementById('chatbot-container');
  startSize = (chatbotDockPosition === 'right') ? container.offsetWidth : container.offsetHeight;
  document.onmousemove = resize; document.onmouseup = stopResize;
  e.preventDefault();
}

function resize(e) {
  if (!isResizing) return;
  const container = document.getElementById('chatbot-container');
  if (chatbotDockPosition === 'right') {
    let newSize = Math.max(300, startSize + (startX - e.clientX));
    container.style.width = newSize + 'px';
    chatbotSize.right = newSize;
    document.body.style.setProperty('--chatbot-offset-right', newSize + 'px');
    localStorage.setItem('chatbotSizeRight', newSize);
  } else {
    let newSize = Math.max(200, startSize + (startY - e.clientY));
    container.style.height = newSize + 'px';
    chatbotSize.bottom = newSize;
    document.body.style.setProperty('--chatbot-offset-bottom', newSize + 'px');
    localStorage.setItem('chatbotSizeBottom', newSize);
  }
}
function stopResize() { isResizing = false; document.onmousemove = null; }