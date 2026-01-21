/**
 * chatbot.js - Updated for Firebase Auth integration
 */

const CHAT_API_BASE_ENDPOINT = 'https://chatbot-api-250975721717.asia-east1.run.app/api/chat';
const CHAT_ENDPOINT = `${CHAT_API_BASE_ENDPOINT}/gemini`; 
const SUMMARY_ENDPOINT = `${CHAT_API_BASE_ENDPOINT}/summary`; 

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

  const container = document.getElementById('chatbot-container');  
  container.dataset.challengeTitle = "";
  container.dataset.challengeContent = "";
  container.dataset.challengeAnswer = "";
  container.dataset.challengeId = "";

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
	
    container.dataset.challengeTitle = challengeTitle;
    container.dataset.challengeContent = c.text;
    container.dataset.challengeAnswer = c.answer;
    container.dataset.challengeId = challengeId;

    generateWelcomeMessage(); // Auto-start the conversation
  } else {
    currentConversation = allConversations[challengeId];
  }
    
  // 4. Update UI state
  document.getElementById('chatbot-title').textContent = `🤖 Python 學長 - ${challengeTitle}`;
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
  const messagesToSend = currentConversation.messages.filter(msg => 
      msg.provider !== 'gemini-summary' && msg.isSummary !== true
  );
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
        messages: messagesToSend,
        challengeId: currentConversation.challengeId,
		docId: docIdFromTitle,
        challengeContent: currentConversation.challengeContent,
        documentTitle: document.title,
        challengeTitle: currentConversation.challengeTitle,
        answer: currentConversation.answer,
		isStarter: false
      })
    });
	
	if (!response.ok) {
		const text = await response.text(); // may not be JSON
		throw new Error(`你的帳號尚未啟用，請聯繫老師。`);
	}
	
    const data = await response.json();
    currentConversation.messages.push({ role: 'assistant', content: data.content });
  } catch (e) {
    console.error('❌ Error:', e);
    currentConversation.messages.push({ role: 'assistant', content: '' + e.message });
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
        isStarter: true
      })
    });

	if (!response.ok) {
		const text = await response.text(); // may not be JSON
		throw new Error(`你的帳號尚未啟用，請聯繫老師。`);
	}

    const data = await response.json();
    currentConversation.messages = [{ role: 'assistant', content: data.content }];
  } catch (e) {
	console.error('❌ Error:', e);
    currentConversation.messages = [{ role: 'assistant', content: '你好！我是 Python 學長。' + e.message }];
  } finally {
    toggleUIState(false);
    renderMessages();
  }
}

async function generateSummary() {
  const user = firebase.auth().currentUser;
  const docIdFromTitle = document.querySelector('title')?.getAttribute('docid') || "none";
  const userMessages = currentConversation.messages.filter(msg => msg.role === 'user');

  if (!user || userMessages.length === 0) return;

  const userInfo = {
      email: user.email,
	  displayName: document.getElementById('user-display-name')?.textContent || "",
      studentName: document.getElementById('user-student-name')?.textContent || "學生",
      studentId: document.getElementById('user-student-id')?.textContent || ""
  };

  toggleUIState(true); // Assuming you have a loading spinner  

  const container = document.getElementById('chatbot-container');
  const title = container.dataset.challengeTitle;
  const text = container.dataset.challengeContent;
  const ans = container.dataset.challengeAnswer;

  try {
    const response = await fetch(SUMMARY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: userMessages,
		challengeTitle: title,
		challengeContent: text,
		refAnswer: ans,
		userAnswer: userMessages.at(-1).content,
        userInfo: userInfo,
		docId: docIdFromTitle,                     
        challengeId: currentConversation.challengeId 
      })
    });
	
	if (!response.ok) {
		const text = await response.text(); // may not be JSON
		throw new Error(`你的帳號尚未啟用，請聯繫老師。`);
	}
	
    const data = await response.json();
    
    // Display the summary in the chat UI
    currentConversation.messages.push({ 
		role: 'assistant', 
		content: `${data.content}`,
		provider: 'gemini-summary',
        isSummary: true
	});
    renderMessages();
  } catch (e) {
	console.error('❌ Error:', e);
    currentConversation.messages.push({ role: 'assistant', content: '' + e.message, provider: 'gemini-summary', isSummary: true});
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
                <h2 style="margin-bottom: 0.5rem; color: #1f2937; font-size: 1.5rem;">找 Python 學長?</h2>
                <p style="color: #6b7280; margin-bottom: 2rem;">請先登入 Google 帳號。</p>
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

// 停止調整大小
function stopResize() {
  if (isResizing) {
    isResizing = false;
    
    document.removeEventListener('mousemove', resize);
    document.removeEventListener('mouseup', stopResize);
  }
}

// 跳轉到當前挑戰的位置
function jumpToChallenge() {
  if (!currentConversation.challengeId) {
    console.warn('⚠️  沒有當前挑戰 ID');
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

  // 高亮顯示挑戰(視覺回饋)
  highlightChallenge(challengeElement);
  
  console.log('✅ 跳轉到挑戰:', currentConversation.challengeId);
}

// 高亮顯示挑戰(視覺回饋)
function highlightChallenge(element) {
  console.log(element);
  // 儲存原始樣式
  const originalBackground = element.style.background;
  const originalTransition = element.style.transition;
  
  // 加入高亮效果
  element.style.transition = 'background 0.3s ease';
  element.style.background = 'rgba(102, 126, 234, 0.1)';
  
  // 1.5 秒後恢復
  setTimeout(() => {
    element.style.background = originalBackground;
    
    // 再過 0.3 秒後移除 transition
    setTimeout(() => {
      element.style.transition = originalTransition;
    }, 300);
  }, 1500);
}

// 切換停靠位置
function dockChatbot(position) {
  chatbotDockPosition = position;
  localStorage.setItem('chatbotDockPosition', position);
  applyChatbotDockPosition(position);
}

// 應用停靠位置
function applyChatbotDockPosition(position) {
  const container = document.getElementById('chatbot-container');
  const body = document.body;
  const dockRightBtn = document.getElementById('dock-right-btn');
  const dockBottomBtn = document.getElementById('dock-bottom-btn');
  
  // 移除所有停靠類別
  container.classList.remove('chatbot-docked-right', 'chatbot-docked-bottom', 'chatbot-docked-top');
  
  // 加入新的停靠類別
  container.classList.add(`chatbot-docked-${position}`);
  
  // --- 新增:設定 CSS 變數並加入 body 類別 ---
  body.classList.remove('chatbot-open-right', 'chatbot-open-bottom', 'chatbot-open-top', 'chatbot-open');
  body.classList.add('chatbot-open'); 
  
  // 重置所有偏移量
  body.style.setProperty('--chatbot-offset-right', '0px');
  body.style.setProperty('--chatbot-offset-bottom', '0px');
  body.style.setProperty('--chatbot-offset-top', '0px');
  
  // 應用儲存的大小
  if (position === 'right') {
    container.style.width = chatbotSize.right + 'px';
    container.style.height = '100vh';
	body.classList.add('chatbot-open-right');
    // 設定右側偏移量
    body.style.setProperty('--chatbot-offset-right', chatbotSize.right + 'px');
	
	// NEW: 停靠右側時,顯示底部按鈕,隱藏右側按鈕
    if (dockBottomBtn) dockBottomBtn.style.display = 'inline-block';
    if (dockRightBtn) dockRightBtn.style.display = 'none';
  } else if (position === 'bottom') {
    container.style.width = '100%';
    container.style.height = chatbotSize.bottom + 'px';
	body.classList.add('chatbot-open-bottom');
    // 設定底部偏移量 (供 main/sidebar 使用 margin/padding-bottom)
    body.style.setProperty('--chatbot-offset-bottom', chatbotSize.bottom + 'px');
	
	// NEW: 停靠底部時,顯示右側按鈕,隱藏底部按鈕
    if (dockRightBtn) dockRightBtn.style.display = 'inline-block';
    if (dockBottomBtn) dockBottomBtn.style.display = 'none';
  }
  
  // 儲存新的位置
  localStorage.setItem('chatbotDockPosition', position);
  chatbotDockPosition = position;
}
