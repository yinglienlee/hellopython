// 本地伺服器 API 端點
// const API_BASE_ENDPOINT = 'http://localhost:5000/api/chat';
const API_BASE_ENDPOINT = 'https://chatbot-api-250975721717.asia-east1.run.app/api/chat';
const CHAT_ENDPOINT = `${API_BASE_ENDPOINT}/gemini`; // 實際聊天使用的
const SUMMARY_ENDPOINT = `${API_BASE_ENDPOINT}/summary`; // 總結使用的
// const CHAT_ENDPOINT = `${API_BASE_ENDPOINT}/claude`;

// 聊天機器人停靠位置和大小設定
let chatbotDockPosition = localStorage.getItem('chatbotDockPosition') || 'right';
let chatbotSize = {
  right: parseInt(localStorage.getItem('chatbotSizeRight')) || 400,
  bottom: parseInt(localStorage.getItem('chatbotSizeBottom')) || 350,
  top: parseInt(localStorage.getItem('chatbotSizeTop')) || 350
};

// 調整大小相關變數
let isResizing = false;
let startX = 0;
let startY = 0;
let startSize = 0;

let allConversations = {};

// 當前對話狀態
let currentConversation = {
  challengeId: null,
  challengeTitle: null,
  messages: [],
  isLoading: false,
  challengeContent: null
};

// 從頁面提取特定挑戰的內容
function extractChallengeContent(challengeElement) {
  if (!challengeElement) {
    console.error('❌ 找不到挑戰元素');
    return null;
  }
  
  // 複製節點避免修改原始內容
  const clone = challengeElement.cloneNode(true);
  
  // 移除聊天機器人按鈕
  clone.querySelectorAll('.chatbot-toggle-btn').forEach(btn => btn.remove());
  
  
  const answerElement = clone.querySelector('.answer');
  let answerText = ''; // 初始化一個變數來儲存文本

  if (answerElement) {
    answerText = answerElement.textContent;
	answerElement.remove();
  }

  // 取得文字內容
  let text = clone.innerText || clone.textContent;
  
  // 基本清理:移除過多的換行
  text = text.replace(/\n{3,}/g, '\n\n').trim();
  
  console.log('✅ 挑戰內容已提取:', text.length, '字元');
  
  return { text: text, answer: answerText };
}

// 為聊天機器人顯示登入提示(更友善的版本)
function showLoginPromptForChatbot() {
    // 檢查是否已經有登入提示
    if (document.getElementById('login-prompt')) {
        return;
    }
    
    const loginPrompt = document.createElement('div');
    loginPrompt.id = 'login-prompt';
    loginPrompt.innerHTML = `
        <div style="
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
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
                <button onclick="loginAndOpenChatbot()" style="
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
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        </style>
    `;
    document.body.appendChild(loginPrompt);
}

// 登入並記住要開啟的聊天機器人
let pendingChatbotButton = null;

function loginAndOpenChatbot() {
    // 記住當前按鈕
    pendingChatbotButton = event.target || document.querySelector('.chatbot-toggle-btn');
    
    // 關閉提示
    closeLoginPrompt();
    
    // 執行登入
    login().then(success => {
        if (success && pendingChatbotButton) {
            // 登入成功後,自動開啟聊天機器人
            setTimeout(() => {
                if (pendingChatbotButton && typeof openChatbot === 'function') {
                    openChatbot(pendingChatbotButton);
                }
                pendingChatbotButton = null;
            }, 500);
        }
    });
}

// 關閉登入提示
function closeLoginPrompt() {
    const loginPrompt = document.getElementById('login-prompt');
    if (loginPrompt) {
        loginPrompt.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => loginPrompt.remove(), 300);
    }
}

// 打開聊天機器人
function openChatbot(buttonElement) {
	
  // 檢查登入狀態
  if (!isLoggedIn()) {
    pendingChatbotButton = buttonElement;
    showLoginPromptForChatbot();
    return;
  }
	
  // 從按鈕的父元素取得挑戰資訊
  const challengeElement = buttonElement.closest('.challenge-item');
  const challengeId = challengeElement.id;  // 直接使用 id 屬性
  
  // 從 h3.caption 取得挑戰標題
  const captionElement = challengeElement.querySelector('h3.caption');
  let challengeTitle = challengeId; // 預設值
  if (captionElement) {
    // 移除 icon span 後取得純文字標題
    const clonedCaption = captionElement.cloneNode(true);
    const iconSpan = clonedCaption.querySelector('.icon');
    if (iconSpan) iconSpan.remove();
    challengeTitle = clonedCaption.textContent.trim();
  }
  
  console.log('🎯 打開挑戰:', challengeId);
  console.log('📝 挑戰標題:', challengeTitle);
  

  /*
  // 如果是新的挑戰,重置對話
  if (currentConversation.challengeId !== challengeId) {
	const c = extractChallengeContent(challengeElement);
    currentConversation = {
      challengeId: challengeId,
      challengeTitle: challengeTitle,
      messages: [],
      isLoading: false,
      challengeContent: c.text,
	  answer: c.answer
    };
    */
	
	// 檢查是否為新的挑戰 ID
    if (!allConversations[challengeId]) {
		// 如果是新的挑戰，則初始化並儲存到 allConversations
		const c = extractChallengeContent(challengeElement);
		allConversations[challengeId] = {
		  challengeId: challengeId,
		  challengeTitle: challengeTitle,
		  messages: [], // 新挑戰，訊息為空
		  isLoading: false,
		  challengeContent: c.text,
		  answer: c.answer
		};
    
		// 設置為當前對話並生成歡迎訊息
		currentConversation = allConversations[challengeId];
		generateWelcomeMessage();
	} else {
		// 如果挑戰已存在，則從 allConversations 恢復對話
		currentConversation = allConversations[challengeId];
		console.log('🔄 恢復挑戰對話:', challengeId, currentConversation.messages.length, '條訊息');
	}
  
  // 更新標題
  document.getElementById('chatbot-title').textContent = 
    `🤖 Python 學習助手 - ${challengeTitle}`;
  
  // 顯示並設定停靠位置
  const container = document.getElementById('chatbot-container');
  container.style.display = 'block';
  applyChatbotDockPosition(chatbotDockPosition);
  
  // 初始化調整大小功能
  initializeResizer();  

  // 渲染訊息
  renderMessages();
  
  if (typeof adjustBannerPosition === 'function') {
	adjustBannerPosition();
  }
  
  // 聚焦輸入框
  setTimeout(() => {
    const input = document.getElementById('chatbot-input');
    input.focus();
    
    // 加入 input 事件監聽(即時調整高度)
    input.addEventListener('input', function(e) {
      autoResizeTextarea(e.target);
    });
  }, 100);
}

// 切換停靠位置
function dockChatbot(position) {
  chatbotDockPosition = position;
  localStorage.setItem('chatbotDockPosition', position);
  applyChatbotDockPosition(position);
  
  if (typeof adjustBannerPosition === 'function') {
	adjustBannerPosition();
  }

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

// 初始化調整大小功能
function initializeResizer() {
  const resizer = document.getElementById('chatbot-resizer');
  if (!resizer) return;
  
  // 移除舊的監聽器(如果有)
  resizer.replaceWith(resizer.cloneNode(true));
  const newResizer = document.getElementById('chatbot-resizer');
  
  newResizer.addEventListener('mousedown', startResize);
}

// 開始調整大小
function startResize(e) {
  isResizing = true;
  startX = e.clientX;
  startY = e.clientY;
  
  const container = document.getElementById('chatbot-container');
  
  if (chatbotDockPosition === 'right') {
    startSize = container.offsetWidth;
  } else {
    startSize = container.offsetHeight;
  }
  
  document.addEventListener('mousemove', resize);
  document.addEventListener('mouseup', stopResize);
  
  // 防止選取文字
  e.preventDefault();
}

// 調整大小
function resize(e) {
  if (!isResizing) return;
  
  const container = document.getElementById('chatbot-container');
  const body = document.body;
  let newSize;
  
  if (chatbotDockPosition === 'right') {
    // 右側停靠:往左拖曳增加寬度
    const deltaX = startX - e.clientX;
    newSize = Math.max(300, Math.min(startSize + deltaX, window.innerWidth - 100));
    container.style.width = newSize + 'px';
    chatbotSize.right = newSize;
    // 更新右側偏移量
    body.style.setProperty('--chatbot-offset-right', newSize + 'px'); 
	localStorage.setItem('chatbotSizeRight', newSize);
  } else if (chatbotDockPosition === 'bottom') {
    // 底部停靠:往上拖曳增加高度
    const deltaY = startY - e.clientY;
    newSize = Math.max(200, Math.min(startSize + deltaY, window.innerHeight - 100));
    container.style.height = newSize + 'px';
    chatbotSize.bottom = newSize;
    // 更新底部偏移量
    body.style.setProperty('--chatbot-offset-bottom', newSize + 'px');  
	localStorage.setItem('chatbotSizeBottom', newSize);
  }
  
  if (typeof adjustBannerPosition === 'function') {
	adjustBannerPosition();
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

// 新增:生成歡迎訊息的函數
async function generateWelcomeMessage() {
  currentConversation.isLoading = true;
  document.getElementById('chatbot-input').disabled = true;
  document.getElementById('chatbot-send-btn').disabled = true;
  document.getElementById('chatbot-summary-btn').disabled = true;

  renderMessages();
  
  try {
    const response = await fetch(CHAT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
		userInfo: getUserInfo(),
        messages: [
          {
            role: 'user',
            content: '請用友善、鼓勵的語氣向我介紹這個挑戰,並提出第一個引導問題。'
          }
        ],
        challengeId: currentConversation.challengeId,
        challengeContent: currentConversation.challengeContent,
        documentTitle: document.title,  // 傳送文件標題
		challengeTitle: currentConversation.challengeTitle,
        isWelcome: true
      })
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    // 移除 user 訊息(不顯示給學生)
    currentConversation.messages = [];
    
    // 只加入 AI 的歡迎訊息
    currentConversation.messages.push({
      role: 'assistant',
      content: data.content
    });
    
  } catch (error) {
    console.error('❌ Error generating welcome:', error);
    // 失敗時使用備用歡迎訊息
    currentConversation.messages.push({
      role: 'assistant',
      content: '你好!我是你的 Python 學習助手 😊 準備好開始學習了嗎?'
    });
  } finally {
    currentConversation.isLoading = false;
	document.getElementById('chatbot-input').disabled = false;
    document.getElementById('chatbot-send-btn').disabled = false;
	document.getElementById('chatbot-summary-btn').disabled = false;

    renderMessages();
  }
}


// 發送訊息
async function generateSummary() {
  const input = document.getElementById('chatbot-input');
  const message = input.value.trim();
  const sendButton = document.getElementById('chatbot-send-btn');
  const summarizeButton = document.getElementById('chatbot-summary-btn');
  
  if (currentConversation.isLoading) return;
  if (!currentConversation.challengeId) {
    alert('請先選擇一個挑戰來開啟對話');
    return;
  }
  
  // 檢查登入
  if (!isLoggedIn()) {
    alert('登入已過期,請重新登入');
    showLoginPrompt();
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
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
		userInfo: getUserInfo(),
        messages: currentConversation.messages,
        challengeId: currentConversation.challengeId,
        challengeContent: currentConversation.challengeContent,
		documentTitle: document.title,  // 傳送文件標題
		challengeTitle: currentConversation.challengeTitle
      })
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    // 加入助手回應
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
    
    // 重新聚焦輸入框
    document.getElementById('chatbot-input').focus();
  }
}

// 關閉聊天機器人
function closeChatbot() {
  document.getElementById('chatbot-container').style.display = 'none';
  const body = document.body;
  
  // 移除 body 類別
  body.classList.remove('chatbot-open', 'chatbot-open-right', 'chatbot-open-bottom'); 
  
  // 重設 CSS 變數,恢復頁面佈局
  body.style.setProperty('--chatbot-offset-right', '0px');
  body.style.setProperty('--chatbot-offset-bottom', '0px');
  
  if (typeof adjustBannerPosition === 'function') {
    adjustBannerPosition();
  }
}

// 渲染訊息
function renderMessages() {
  const messagesContainer = document.getElementById('chatbot-messages');
  
  messagesContainer.innerHTML = currentConversation.messages.map(msg => {
    const className = msg.role === 'user' ? 'user-message' : 'assistant-message';
    
    // 處理 markdown 格式
    let content = msg.content;
    
    // ====== 重要:處理順序很關鍵! ======
    
    // 1. 程式碼區塊
    content = content.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
      return `<pre><code class="code-block">${escapeHtml(code.trim())}</code></pre>`;
    });
    
    // 2. 行內程式碼
    content = content.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
    
    // 3. 粗體
    content = content.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    // 4. 斜體 - 使用底線代替星號(更安全)
    // 只處理 _text_ 格式的斜體,不處理 *text*
    content = content.replace(/_([^_]+)_/g, '<em>$1</em>');
    
    // 5. 列表(只處理行首的 - 符號,不處理 * 符號)
    content = content.replace(/^-\s+(.+)$/gm, '<li>$1</li>');
    content = content.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    
    // 6. 換行
    content = content.replace(/\n/g, '<br>');
    
    return `<div class="message ${className}">${content}</div>`;
  }).join('');
  
  // 載入動畫
  if (currentConversation.isLoading) {
    messagesContainer.innerHTML += `
      <div class="message assistant-message loading">
        <span class="dot">&nbsp;</span><span class="dot">&nbsp;</span><span class="dot">&nbsp;</span>
      </div>
    `;
  }
  
  // 自動捲動到底部
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  
  // 輔助函數:轉義 HTML 特殊字元(用於程式碼區塊)
  function escapeHtml(text) {
	const div = document.createElement('div');
	div.textContent = text;
	return div.innerHTML;
  }
}

// 發送訊息
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
  
  // 檢查登入
  if (!isLoggedIn()) {
    alert('登入已過期,請重新登入');
    showLoginPrompt();
    return;
  }
  
  // 加入用戶訊息
  currentConversation.messages.push({
    role: 'user',
    content: message
  });
  
  input.value = '';
  // 重置 textarea 高度
  resetTextareaHeight();
  input.disabled = true;
  sendButton.disabled = true;
  summarizeButton.disabled = true;
  currentConversation.isLoading = true;
  renderMessages();
  
  try {
    const response = await fetch(CHAT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
		userInfo: getUserInfo(),
        messages: currentConversation.messages,
        challengeId: currentConversation.challengeId,
        challengeContent: currentConversation.challengeContent,
		documentTitle: document.title,  // 傳送文件標題
		challengeTitle: currentConversation.challengeTitle
      })
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    // 加入助手回應
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
    
    // 重新聚焦輸入框
    document.getElementById('chatbot-input').focus();
  }
}

// 處理鍵盤事件
function handleKeyPress(event) {
  const textarea = event.target;
  
  // Enter 發送,Shift+Enter 換行
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
    return;
  }
  
  // 自動調整高度(在下一個事件循環中執行)
  setTimeout(() => {
    autoResizeTextarea(textarea);
  }, 0);
}

// 自動調整 textarea 高度
function autoResizeTextarea(textarea) {
  // 儲存當前捲動位置
  const currentScrollTop = textarea.scrollTop;
  
  // 重置高度
  textarea.style.height = 'auto';
  
  // 計算需要的高度(最小 52px,最大 200px)
  const minHeight = 52;
  const maxHeight = 200;
  const newHeight = Math.max(minHeight, Math.min(textarea.scrollHeight, maxHeight));
  
  // 設定新高度
  textarea.style.height = newHeight + 'px';
  
  // 如果達到最大高度,恢復捲動位置
  if (textarea.scrollHeight > maxHeight) {
    textarea.scrollTop = currentScrollTop;
  }
}

// 重置 textarea 高度
function resetTextareaHeight() {
  const textarea = document.getElementById('chatbot-input');
  if (textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = '52px'; // 重置為最小高度
  }
}

// 點擊遮罩關閉
document.addEventListener('DOMContentLoaded', function() {
  const overlay = document.getElementById('chatbot-overlay');
  if (overlay) {
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) {
        closeChatbot();
      }
    });
  }
});