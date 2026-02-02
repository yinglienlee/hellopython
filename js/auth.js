const AUTH_API_BASE_ENDPOINT = 'https://chatbot-api-250975721717.asia-east1.run.app/api';
const REGISTER_ENDPOINT = `${AUTH_API_BASE_ENDPOINT}/student/register`; 

// Function to inject the Auth UI into the header
function injectAuthUI() {
    const header = document.querySelector('header');
    if (!header) return;

    // Ensure header is relative so the absolute auth-section anchors correctly
    // header.style.position = 'relative';

    const authHTML = `
        <div id="auth-section" style="position: absolute; top: 15px; right: 20px; z-index: 1000; font-family: 'Google Sans', Roboto, Arial, sans-serif; display: flex; align-items: center; justify-content: flex-end; min-width: 350px;">
            
            <button id="login-btn" onclick="loginWithFirebase()" 
                style="display: flex; align-items: center; background: #fff; color: #3c4043; border: 1px solid #dadce0; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: 500; font-size: 14px; transition: background 0.2s;">
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="18" height="18" style="margin-right: 10px;">
                使用 Google 帳戶登入
            </button>
            
            <div id="user-info-area" style="display: none; align-items: center; gap: 12px; background: #fff; padding: 8px 16px; border-radius: 4px; border: 1px solid #dadce0; box-shadow: 0 1px 2px rgba(60,64,67,0.3);">
                <div style="font-size: 0.95rem; color: #3c4043; white-space: nowrap;">
                    <span id="user-display-name" style="font-weight: 500;"></span>
                    <span style="margin: 0 8px; color: #dadce0;">|</span>
                    <span id="user-student-id" style="color: #5f6368;"></span>
                    <span id="user-student-name" style="color: #5f6368;"></span>
                </div>
				<div class="tool-group">
					<button onclick="openPythonLab()" class="group-btn" title="Python 實驗室">
						<i class="fa-solid fa-flask"></i>
					</button>
					<button onclick="toggleCourseMap()" class="group-btn" title="挑戰地圖">
						<i class="fa-regular fa-map"></i>
					</button>
				</div>
				
                <button onclick="logoutFromFirebase()" style="background: none; border: none; color: #1a73e8; font-size: 0.95rem; cursor: pointer; font-weight: 500; padding: 0; margin-left: 4px;">登出</button>
            </div>
			
            <div id="student-id-prompt" style="display: none; position: absolute; top: 55px; right: 0; width: 240px; background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #e0e0e0; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                <div style="font-size: 14px; margin-bottom: 12px; color: #202124; text-align: left; font-weight: 600;">請完成資料設定</div>
                <input type="text" id="student-class-input" placeholder="輸入班級" style="width: 100%; padding: 10px; margin-bottom: 10px; border: 1px solid #dadce0; border-radius: 4px; font-size: 14px; box-sizing: border-box;">
				<input type="text" id="student-id-input" placeholder="輸入學號" 
                    style="width: 100%; padding: 10px; margin-bottom: 10px; border: 1px solid #dadce0; border-radius: 4px; font-size: 14px; box-sizing: border-box;">
                <input type="text" id="student-name-input" placeholder="輸入姓名" 
                    style="width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #dadce0; border-radius: 4px; font-size: 14px; box-sizing: border-box;">
                <button onclick="saveStudentId()" 
                    style="width: 100%; background: #1a73e8; color: #fff; border: none; padding: 10px; border-radius: 4px; cursor: pointer; font-weight: 500; font-size: 14px;">
                    確認儲存
                </button>
            </div>
        </div>
    `;

    header.insertAdjacentHTML('beforeend', authHTML);
	
	const modalHTML = `
		<div id="course-map-modal" style="display: none !important; 
			position: fixed; 
			top: 0; 
			left: 0; 
			width: 100vw; 
			height: 100vh; 
			background: rgba(0,0,0,0.8); 
			z-index: 999999 !important; 
			display: flex; 
			align-items: center; 
			justify-content: center; 
			backdrop-filter: blur(5px);
			box-sizing: border-box;">
			
			<div style="background: #ffffff !important; 
				width: 95%; 
				max-width: 1000px; 
				height: 85vh; 
				border-radius: 16px; 
				display: flex; 
				flex-direction: column; 
				position: relative; 
				box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); 
				border: 1px solid #e2e8f0;
				overflow: hidden;">
				
				<div style="flex-shrink: 0; padding: 30px; border-bottom: 2px solid #f1f5f9; position: relative; background: white; z-index: 100;">
					<button onclick="toggleCourseMap()" style="position: absolute; top: 20px; right: 20px; border: none; background: #f1f5f9; width: 36px; height: 36px; border-radius: 50%; cursor: pointer; color: #475569; display: flex; align-items: center; justify-content: center; transition: all 0.2s; z-index: 101;">&times;</button>
					
					<div style="text-align: center;">
						<h2 style="margin: 0; color: #0f172a !important; font-size: 24px; font-weight: 800; font-family: system-ui, -apple-system, sans-serif;">📖 挑戰進度總覽</h2>
						<p style="margin: 5px 0 0 0; color: #64748b; font-size: 15px;">各關卡與對應的挑戰歷程</p>
					</div>
				</div>

				<div id="course-table-container" style="flex: 1; overflow-y: auto; margin: 30px 30px 30px 30px; color: #1e293b !important; position: relative; text-align: center;">
					<span style="font-size: 12px;">正在載入課程資料...</span>
				</div>
			</div>
		</div>
	`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
	
	const summaryModalHTML = `
		<div id="summary-list-modal" style="display: none !important; 
			position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; 
			background: rgba(0,0,0,0.85); z-index: 1000001; 
			align-items: center; justify-content: center; backdrop-filter: blur(8px);">
			
			<div style="background: #ffffff; width: 90%; max-width: 600px; height: 70vh; border-radius: 20px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);">
				<div style="padding: 20px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; background: #f8fafc;">
					<h3 id="summary-modal-title" style="margin: 0; color: #1e293b; font-size: 18px;">🏆 學習評量紀錄</h3>
					
					<button onclick="closeSummaryModal()" style="
						border: none; 
						background: #e2e8f0; 
						width: 32px; 
						height: 32px; 
						border-radius: 50%; 
						cursor: pointer; 
						color: #64748b; 
						font-size: 24px; 
						/* 🎯 The Centering Logic */
						display: flex;
						align-items: center;
						justify-content: center;
						line-height: 1;        /* Normalizes the text box height */
						padding: 0;            /* Removes browser defaults */
						margin: 0;
						/* 🛠 Optical adjustment: moves the character down slightly */
						transform: translateY(1px); 
						transition: background 0.2s, color 0.2s;
					" onmouseover="this.style.background='#cbd5e1';this.style.color='#1e293b';" 
					   onmouseout="this.style.background='#e2e8f0';this.style.color='#64748b';">
						&times;
					</button>
				</div>
				<div id="summary-list-content" style="flex: 1; overflow-y: auto; padding: 20px;"></div>
			</div>
		</div>
	`;
	document.body.insertAdjacentHTML('beforeend', summaryModalHTML);
	
	const chatLogModalHTML = `
		<div id="chat-log-modal" style="display: none !important; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.8); z-index: 1000002 !important; align-items: center; justify-content: center; backdrop-filter: blur(4px);">
			<div style="background: #f0f2f5; width: 95%; max-width: 500px; height: 80vh; border-radius: 20px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.2);">
				<div style="padding: 15px 20px; background: white; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
					<h3 id="chat-log-title" style="margin: 0; font-size: 18px; color: #1f2937;">💬 對話紀錄回顧</h3>
					<button onclick="closeChatLogModal()" style="
						border: none; 
						background: #e2e8f0; 
						width: 32px; 
						height: 32px; 
						border-radius: 50%; 
						cursor: pointer; 
						color: #64748b; 
						font-size: 24px; 
						/* 🎯 The Centering Logic */
						display: flex;
						align-items: center;
						justify-content: center;
						line-height: 1;        /* Normalizes the text box height */
						padding: 0;            /* Removes browser defaults */
						margin: 0;
						/* 🛠 Optical adjustment: moves the character down slightly */
						transform: translateY(1px); 
						transition: background 0.2s, color 0.2s;
					" onmouseover="this.style.background='#cbd5e1';this.style.color='#1e293b';" 
					   onmouseout="this.style.background='#e2e8f0';this.style.color='#64748b';">
						&times;
					</button>
				</div>
				<div id="chat-log-content" style="flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 12px;">
					</div>
			</div>
		</div>
	`;
	document.body.insertAdjacentHTML('beforeend', chatLogModalHTML);
}

// Run the injection immediately when auth.js loads or after DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectAuthUI);
} else {
    injectAuthUI();
}

// --- Firebase Config ---
const firebaseConfig = {
	apiKey: "AIzaSyBUEg6mNdDRS4jZaf63AAWKL3QA1MDlgzc",
	authDomain: "gen-lang-client-0377749294.firebaseapp.com",
	projectId: "gen-lang-client-0377749294",
	storageBucket: "gen-lang-client-0377749294.firebasestorage.app",
	messagingSenderId: "250975721717",
	appId: "1:250975721717:web:d93379f882b33066124dbc",
	measurementId: "G-FMDNG5FQTH"
};

// Initialize
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
// Access the named database "accounts"
const db = firebase.app().firestore();

let currentOwnerUid = null;

// --- Auth State Logic ---
// 1. Initialize Redirect Check immediately
auth.getRedirectResult()
    .then((result) => {
        if (result.user) {
            console.log("Redirect Login Successful:", result.user.displayName);
        }
    })
    .catch((error) => {
        console.error("Redirect Error:", error.code, error.message);
        // If there's a specific error, you might want to alert the user here
    });

// --- Global Auth State Observer ---
auth.onAuthStateChanged(async (user) => {
    const loginBtn = document.getElementById('login-btn');
    const userInfoArea = document.getElementById('user-info-area');
    const nameEl = document.getElementById('user-display-name');
    const studentNameEl = document.getElementById('user-student-name');
    const idEl = document.getElementById('user-student-id');
    const promptEl = document.getElementById('student-id-prompt');

    if (user) {
		includeHTML(null); 
        includeHomeNav(null);
		
        // UI: Show logged-in state
        if (loginBtn) loginBtn.style.display = 'none';
        if (userInfoArea) userInfoArea.style.display = 'flex';
        if (nameEl) nameEl.textContent = user.displayName;

        try {
            // 1. Fetch User Profile from Firestore
            const userQuery = await db.collection("users")
                .where("ownerUid", "==", user.uid)
                .limit(1)
                .get();

            if (!userQuery.empty) {
                const userData = userQuery.docs[0].data();
				currentOwnerUid = userData.ownerUid;
                
				await checkPageVisibility(userData);
				
                // Update Student Info UI
                if (studentNameEl) studentNameEl.textContent = userData.studentName;
                if (idEl) idEl.textContent = userData.studentId;
                if (promptEl) promptEl.style.display = 'none';

                // 2. Calculate Visibility Map based on the user's studentClass
                const visibilityMap = await getDocVisibility(userData);
                console.log("Access Map Generated:", visibilityMap);

                // 3. Render Navigation Menus with the specific visibility map
                await includeHTML(visibilityMap); 
                await includeHomeNav(visibilityMap);
                
                // 4. Page-level Security Check
                if (typeof checkPageVisibility === 'function') {
                    checkPageVisibility(userData);
                }

            } else {
                // User logged in but has no student profile yet
                if (studentNameEl) studentNameEl.textContent = "未設定學生資料";
                if (promptEl) promptEl.style.display = 'block';
                
                // Load empty visibility (everything locked)
                await includeHTML({});
                await includeHomeNav({});
            }
        } catch (err) {
            console.error("Auth process error:", err);
            // Fallback load
            await includeHTML({});
            await includeHomeNav({});
        }
		
        // Chatbot Resume Logic
        const loginPrompt = document.getElementById('login-prompt');
        if (loginPrompt) {
            loginPrompt.remove(); 
            if (typeof pendingChatbotButton !== 'undefined' && pendingChatbotButton) {
                openChatbot(pendingChatbotButton);
                pendingChatbotButton = null; 
            }
        }
    } else {
        // Logged out: Hide info and show login button
        if (loginBtn) loginBtn.style.display = 'flex';
        if (userInfoArea) userInfoArea.style.display = 'none';
        if (promptEl) promptEl.style.display = 'none';
        
        // Reset navigation to empty/locked state
        const navContainer = document.querySelector("[w3-include-html]");
        if (navContainer) navContainer.innerHTML = '<p class="p-4 text-xs text-slate-500">請登入後查看課程</p>';
    }
});

// Add this to the end of auth.js
async function openPythonLab() {
    const user = firebase.auth().currentUser;
    if (!user) {
        alert("請先登入帳號再開啟實驗室。");
        return;
    }

    // Calculate half width and full available height
    const halfWidth = window.screen.width / 2;
    const fullHeight = window.screen.availHeight;
    
    // Set 'left' to the start of the second half of the screen
    const leftPosition = halfWidth; 
    const topPosition = 0; 
	
	window.open(
        `python-lab`, 
        'PythonLabPopup', 
        `width=${halfWidth},height=${fullHeight},top=${topPosition},left=${leftPosition},resizable=yes,scrollbars=yes,status=no,location=no`
    );
}

/**
 * Helper: Calculates visibility by comparing student's class to doc permissions
 */
async function getDocVisibility(userData) {
    try {
        const studentClass = userData ? userData.studentClass : null;
        const docSnap = await db.collection("system").doc("docs").get();
        
        if (!docSnap.exists) return {};
        
        const docs = docSnap.data().documents || [];
        return docs.reduce((acc, d) => {
            const fileName = d.url.split('/').pop();
            const allowedClasses = d.visible_classes || [];
            
            // Access is TRUE if user's class is in the document's visible_classes array
            acc[fileName] = !!(studentClass && allowedClasses.includes(studentClass));
            return acc;
        }, {});
    } catch (e) {
        console.error("Visibility Map Error:", e);
        return {};
    }
}

/**
 * Gatekeeper: Blocks page access if student isn't in an allowed class
 */
async function checkPageVisibility(userData) {
    // 1. Selection Check: Ensure we are looking at the right attribute
    const titleEl = document.querySelector('title');
    // Using .getAttribute is correct, but let's log it to debug
    const rawDocId = titleEl ? titleEl.getAttribute('docid') : null;
    
    if (!rawDocId || !userData) {
        console.log("Check skipped: No DocID on this page or no UserData.");
        return; 
    }

    try {
        const studentClass = userData.studentClass;
        
        // 2. Fetch the latest settings
        const docSnap = await db.collection("system").doc("docs").get();
        if (!docSnap.exists) return;

        const docs = docSnap.data().documents || [];
        
        // Normalize IDs to strings and trim whitespace for the comparison
        const currentDoc = docs.find(d => String(d.doc_id).trim() === String(rawDocId).trim());
		if (!currentDoc) {
            console.log(`DocID ${rawDocId} not found in DB: Granting default access.`);
            return;
        }

        // 3. Security Logic:
        // - If the doc entry doesn't exist in the DB -> Lock it.
        // - If the class list is empty -> Lock it.
        // - If student's class isn't in the list -> Lock it.
        const allowedClasses = currentDoc ? currentDoc.visible_classes || [] : [];
        const hasAccess = studentClass && allowedClasses.includes(studentClass);
		console.log(allowedClasses, studentClass);
        if (!hasAccess) {
            console.warn(`Access Denied for class: ${studentClass} on DocID: ${rawDocId}`);
            
            // Immediately stop any further scripts and hide content
            window.stop(); 

            document.body.innerHTML = `
                <div style="height:100vh; display:flex; align-items:center; justify-content:center; background:#0f172a; color:white; font-family:sans-serif; text-align:center; padding:20px; position:fixed; top:0; left:0; width:100%; z-index:9999;">
                    <div>
                        <h1 style="font-size:3rem;">🔒</h1>
                        <h2 style="margin-top:20px;">此關卡尚未對您的班級開放</h2>
                        <p style="color:#64748b; margin-top:10px;">您的目前班級：<span style="color:#818cf8">${studentClass || '未設定'}</span></p>
                        <p style="color:#475569; font-size:0.8rem; margin-top:5px;">如班級正確但無法進入，請聯繫老師。</p>
                        <button onclick="window.location.href='index.html'" style="margin-top:30px; background:#4f46e5; color:white; border:none; padding:12px 28px; border-radius:8px; cursor:pointer; font-weight:bold;">回首頁</button>
                    </div>
                </div>`;
            
            // Block redirection loop protection
            setTimeout(() => { 
                if(window.location.pathname !== '/index.html') window.location.href = "index.html"; 
            }, 4000);
        } else {
            console.log("Access Granted for class:", studentClass);
        }
    } catch (err) {
        console.error("Critical visibility check error:", err);
    }
}

// --- Actions ---
function loginWithFirebase() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithRedirect(provider).catch(e => alert(e.message));
}

function logoutFromFirebase() {
    auth.signOut().then(() => window.location.reload());
}

async function saveStudentId() {
	const sClass = document.getElementById('student-class-input').value.trim();
    const sName = document.getElementById('student-name-input').value.trim();
    const sId = document.getElementById('student-id-input').value.trim();
    const user = auth.currentUser;

    if (!user) {
        alert("請先登入");
        return;
    }

	if (!sClass || !sId || !sName) { 
		alert("請輸入班級、學號和姓名"); return; 
	}

	// Get the button and disable it
    const submitBtn = document.querySelector('#student-id-prompt button');
    const originalHTML = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '⏳ 儲存中...';
    submitBtn.style.opacity = '0.5';
    submitBtn.style.cursor = 'not-allowed';
    
    // Disable inputs
    const inputs = document.querySelectorAll('#student-id-prompt input');
    inputs.forEach(input => input.disabled = true);

    try {
		// Send registration request to backend
        const response = await fetch(REGISTER_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                studentClass: sClass,
                studentName: sName,
                studentId: sId,
                email: user.email,
                displayName: user.displayName,
                ownerUid: user.uid
            })
        });
		
        const data = await response.json();
        
        if (response.ok && data.status === 'success') {
            // Success
            submitBtn.innerHTML = '✅ 成功！';
            submitBtn.style.background = '#10b981';
            
            alert("資料儲存成功！");
            
            // Reload after short delay
            setTimeout(() => {
                window.location.reload();
            }, 500);
        } else {
            // Error from server
            throw new Error(data.message || '儲存失敗');
        }
		
    } catch (e) {
        console.error("Error saving student data:", e);
        
        // Re-enable everything
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalHTML;
        submitBtn.style.opacity = '1';
        submitBtn.style.cursor = 'pointer';
        inputs.forEach(input => input.disabled = false);
        
        // Show error
        if (e.message.includes('已被其他')) {
            alert(`❌ 註冊失敗：${e.message}`);
        } else {
            alert(`❌ 儲存失敗：${e.message}`);
        }
    }
}

// auth.js - Add these functions at the bottom
async function toggleCourseMap() {
    const modal = document.getElementById('course-map-modal');
    const isHidden = modal.style.display === 'none' || !modal.style.display;

    if (isHidden) {
        // User wants to open it
        modal.style.setProperty('display', 'flex', 'important');
        renderCourseMap(); 
    } else {
        // User wants to close it
        modal.style.setProperty('display', 'none', 'important');
    }
}

async function renderCourseMap() {
    const container = document.getElementById('course-table-container');
    const user = auth.currentUser;
    const studentIdEl = document.getElementById('user-student-id');
    const studentId = studentIdEl ? studentIdEl.textContent.trim() : "";

    if (!user || !studentId) {
        container.innerHTML = "請先登入以查看學習進度。";
        return;
    }

    try {
        const docSnap = await db.collection("system").doc("docs").get();
        if (!docSnap.exists) return;

        const docs = docSnap.data().documents || [];
		let html = `
		<table style="
		  width: 100%;
		  border-collapse: separate;
		  border-spacing: 0;
		  font-size: 14px;
		  margin-top: -1px;
		">
		  <thead style="
			position: sticky;
			top: 0;
			z-index: 10;
			background: #ffffff;
			box-shadow:
			  inset 0 1px 0 #f1f5f9,
			  0 2px 4px rgba(0,0,0,0.1);
		  ">
			<tr>
			  <th style="width:50px;padding:16px 12px;color:#64748b;">#</th>
			  <th style="width:200px;padding:16px 12px;color:#64748b;">關卡標題</th>
			  <th style="padding:16px 12px;color:#64748b;">挑戰進度</th>
			</tr>
		  </thead>
		  <tbody style="background:#fff;">
		`;


        const rows = await Promise.all(docs.map(async (doc, index) => {
            let isDocActive = false;
			let totalProgress = 0;
			
            const challengesHtml = await Promise.all(doc.challenges.map(async (c) => {
                
                // --- 核心修正：從物件中提取 ID 與 Title ---
                const cid = c.id;       // 用於路徑: challenge-1
                const cTitle = c.title; // 用於顯示: 挑戰 1：...

                const chatPath = `chatlog/${studentId}/docs/${doc.doc_id}/challenges/${cid}/history`;
                
                const chatHistoryRef = db.collection('chatlog').doc(studentId)
                    .collection('docs').doc(doc.doc_id.toString())
                    .collection('challenges').doc(cid)
                    .collection('history');

                const summaryHistoryRef = db.collection('summary').doc(studentId)
                    .collection('docs').doc(doc.doc_id.toString())
                    .collection('challenges').doc(cid)
                    .collection('history');

                let msgCount = 0;
				let summaryCount = 0;
                let percent = 0;
				let qtyScore = 0;  
				let qlyScore = 0;
				
                try {
                    const [chatSnap, summarySnap] = await Promise.all([
                        chatHistoryRef.get(),
                        summaryHistoryRef.orderBy("metrics.progress", "desc").limit(1).get()
                    ]);

                    if (!chatSnap.empty) {
                        msgCount = chatSnap.docs.filter(d => d.data().role === 'user').length;
                        // console.log(`✅ 成功抓取: ${chatPath} | 訊息: ${msgCount}`);
                    } else {
                        // console.log(`❓ 路徑為空: ${chatPath}`);
                    }

                    if (!summarySnap.empty) {
						const summaryData = summarySnap.docs[0].data();
						summaryCount = summarySnap.docs.length;
						percent = summaryData.metrics?.progress || 0;  // 對應 Python 的 'progress'
						qtyScore = summaryData.metrics?.quantity || 0; // 對應 Python 的 'quantity'
						qlyScore = summaryData.metrics?.quality || 0;  // 對應 Python 的 'quality'
						// console.log(`📊 ${cid} 指標: 進度 ${percent}%, 互動次數 ${qtyScore}, 品質 ${qlyScore}`);
                    }
                } catch (e) {
                    console.error(`❌ 查詢失敗: ${chatPath}`, e.message);
                }

				const isChallengeActive = (percent > 0 || msgCount > 0);
				if (isChallengeActive) isDocActive = true; // If one challenge is active, the doc is active

				const challengeCardStyle = !isChallengeActive 
					? "filter: grayscale(1); opacity: 0.4; background: #f8f9fa;" 
					: "background: #ffffff;";
				
				// const isChatActive = (msgCount > 0);
				const chatAction = isChallengeActive 
					? `onclick="handleChatLogClick('${doc.doc_id}', '${cid}', '${cTitle.replace(/'/g, "\\'")}')"` 
					: "";
	
				// const isTrophyActive = (summaryCount > 0);
				const trophyAction = isChallengeActive 
					? `onclick="handleTrophyClick('${doc.doc_id}', '${cid}', '${cTitle.replace(/'/g, "\\'")}')"` 
					: "";
				const trophyCursor = isChallengeActive ? "pointer" : "default";

				totalProgress += percent;

                return `
					<div style="display: inline-flex; flex-direction: column; ${challengeCardStyle} border: 1px solid #dadce0; border-radius: 8px; margin: 4px; padding: 8px; min-width: 145px; vertical-align: top;">
						<span style="font-weight: 600; color: ${!isChallengeActive ? '#9aa0a6' : '#1a73e8'}; margin-bottom: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${cTitle}</span>
						<div style="display: flex; gap: 4px; align-items: center;">
							<div ${trophyAction} title="${isChallengeActive ? '點擊查看歷史紀錄' : '尚未開始此挑戰'}" style="flex: 2; text-align: center; cursor: ${trophyCursor}; background: ${!isChallengeActive ? '#e8eaed' : '#fff8e1'}; color: ${!isChallengeActive ? '#9aa0a6' : '#f57f17'}; border: 1px solid ${!isChallengeActive ? '#dadce0' : '#ffecb3'}; padding: 4px; border-radius: 4px; font-weight: bold; white-space: nowrap;" transition: all 0.2s;"
								 ${isChallengeActive ? `onmouseover="this.style.filter='brightness(0.9)'" onmouseout="this.style.filter='none'"` : ""}>
								🏆 ${percent}% / ${qtyScore} / ${qlyScore}
							</div>
							<div ${chatAction} 
								 title="${isChallengeActive ? '查看對話回顧' : '尚無對話'}"
								 style="flex: 1; text-align: center; cursor: ${isChallengeActive ? 'pointer' : 'default'}; 
										background: ${!isChallengeActive ? '#e8eaed' : '#e8f0fe'}; 
										color: ${!isChallengeActive ? '#9aa0a6' : '#1967d2'}; 
										border: 1px solid ${!isChallengeActive ? '#dadce0' : '#d2e3fc'}; 
										padding: 4px; border-radius: 4px; font-weight: bold; transition: all 0.2s;"
								 ${isChallengeActive ? `onmouseover="this.style.filter='brightness(0.9)'" onmouseout="this.style.filter='none'"` : ""}>
								💬 ${msgCount}
							</div>
						</div>
					</div>`;
            }));

			const avgProgress = doc.challenges.length > 0 
				? Math.round(totalProgress / doc.challenges.length) 
				: 0;
            const rowStyle = !isDocActive ? "filter: grayscale(1); opacity: 0.6; color: #9aa0a6;" : "";

			return `
				<tr style="border-bottom: 1px solid #eee; ${rowStyle}">
					<td style="padding: 12px; color: inherit;">${index + 1}</td>
					<td style="padding: 12px; color: inherit;">
						<div style="font-weight: 600; margin-bottom: 4px; font-size: 1rem;">${doc.doc_title}</div>
						<div style="width: 100%; background: #e2e8f0; height: 6px; border-radius: 3px; overflow: hidden; display: flex; align-items: center;">
							<div style="width: ${avgProgress}%; background: #10b981; height: 100%; transition: width 0.5s ease;"></div>
						</div>
						<div style="font-size: 11px; color: #64748b; margin-top: 4px;">關卡進度: ${avgProgress}%</div>
					</td>
					<td style="padding: 12px;">${challengesHtml.join('')}</td>
				</tr>`;
        }));

        html += rows.join('') + `</tbody></table>`;
        container.innerHTML = html;

    } catch (err) {
        console.error("重大渲染錯誤:", err);
    }
}

function closeSummaryModal() {
    document.getElementById('summary-list-modal').style.display = 'none';
}

function closeChatLogModal() {
    document.getElementById('chat-log-modal').style.setProperty('display', 'none', 'important');
}

async function handleTrophyClick(docId, challengeId, challengeTitle) {
    const modal = document.getElementById('summary-list-modal');
	if (!modal) return;
    modal.style.setProperty('display', 'flex', 'important');
	
    const content = document.getElementById('summary-list-content');
    const title = document.getElementById('summary-modal-title');
    
    const studentIdEl = document.getElementById('user-student-id');
    const studentId = studentIdEl ? studentIdEl.textContent.trim() : "";
    
    if (!studentId) return alert("請先登入");

    // 顯示 Modal 並設置標題
    modal.style.display = 'flex';
    title.innerText = `🏆 ${challengeTitle} - 評量紀錄`;
    content.innerHTML = '<p style="text-align: center; color: #64748b; padding: 20px;">⏳ 正在讀取紀錄...</p>';

    try {
        // 依照日期由新到舊排序 (latest first)
		const snapshot = await db.collection('summary')
			.doc(studentId) // 👈 Changed from .document()
			.collection('docs')
			.doc(docId)     // 👈 Changed from .document()
			.collection('challenges')
			.doc(challengeId) // 👈 Changed from .document()
			.collection('history')
			.orderBy('timestamp', 'desc')
			.get();

        if (snapshot.empty) {
            content.innerHTML = '<div style="text-align: center; padding: 40px; color: #94a3b8;font-size:1rem;">目前尚無評量紀錄。</div>';
            return;
        }

		// --- 1. Identify the Max Percentage ---
        let maxProgress = 0;
        const entries = [];
        
		snapshot.forEach(doc => {
            const entryData = doc.data(); // 這裡取名為 entryData 避免混淆
            const p = entryData.metrics?.progress || 0;
            if (p > maxProgress) maxProgress = p;
            entries.push(entryData);
        });

        let html = '';
        entries.forEach(entry => { // 這裡使用 entry 作為參數
            const isMax = (entry.metrics?.progress === maxProgress && maxProgress > 0);
            const date = entry.created_at ? new Date(entry.created_at).toLocaleString('zh-TW') : '未知時間';
            const progress = entry.metrics?.progress || 0;
            const quantity = entry.metrics?.quantity || 0;
            const quality = entry.metrics?.quality || 0;
			const user_answer = entry.user_answer || "無內容";


            // 💬 特別樣式：最高分的高亮效果
            const boxStyle = isMax 
                ? "border: 2px solid #fbbf24; background: #fffbeb; box-shadow: 0 4px 12px rgba(251, 191, 36, 0.2);" 
                : "border: 1px solid #e2e8f0; background: #ffffff;";

			let formattedContent = (entry.content || '無內容')
				.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>'); // 將 **文字** 轉為 <b>文字</b>

            html += `
                <div style="${boxStyle} border-radius: 12px; padding: 16px; margin-bottom: 16px; position: relative; transition: all 0.2s;">
                    ${isMax ? '<div style="position: absolute; top: -10px; right: 12px; background: #fbbf24; color: #92400e; padding: 2px 10px; border-radius: 20px; font-size: 10px; font-weight: bold; border: 2px solid white; z-index: 1;">最佳紀錄</div>' : ''}
                    
					<div style="display: flex; justify-content: space-between; margin-bottom: 10px; align-items: center;">
                        <span style="font-size: 12px; color: #94a3b8; font-family: monospace;">📅 ${date}</span>
                        <span style="background: ${isMax ? '#fef3c7' : '#f0f9ff'}; color: ${isMax ? '#b45309' : '#0369a1'}; padding: 4px 10px; border-radius: 6px; font-size: 13px; font-weight: bold; border: 1px solid ${isMax ? '#fcd34d' : '#e0f2fe'};">
                            ${isMax ? '🏆 ' : ''}進度 ${progress}%
                        </span>
                    </div>

					<div style="margin-bottom: 14px;">
						<div style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; display: flex; align-items: center; gap: 4px;">
							<span>📝 回答內容</span>
						</div>
						<div style="background: #1e293b; color: #e2e8f0; font-family: 'Fira Code', 'Consolas', monospace; font-size: 13px; padding: 12px; border-radius: 8px; border-left: 4px solid #10b981; white-space: pre-wrap; word-break: break-all; box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);">${user_answer || '（未提供回答）'}</div>
					</div>
					                    
                    <div style="display: flex; gap: 10px; margin-bottom: 12px;">
                        <span style="font-size: 11px; color: #64748b;">📊 互動次數: ${'⭐'.repeat(quantity)}</span>
                        <span style="font-size: 11px; color: #64748b;">💬 互動品質: ${'⭐'.repeat(quality)}</span>
                    </div>
                    
                    <div style="font-size: 14px; color: #334155; line-height: 1.6; background: ${isMax ? 'rgba(255,255,255,0.6)' : '#f8fafc'}; padding: 12px; border-radius: 8px; white-space: pre-wrap; border: 1px solid ${isMax ? '#fef3c7' : 'transparent'};">${formattedContent || '無內容'}</div>
                </div>`;
        });
        
        content.innerHTML = html;

    } catch (error) {
        console.error("讀取摘要失敗:", error);
        content.innerHTML = `<p style="color: #ef4444; text-align: center; padding: 20px;">❌ 讀取失敗: ${error.message}</p>`;
    }
}

async function handleChatLogClick(docId, challengeId, challengeTitle) {
    const modal = document.getElementById('chat-log-modal');
    if (!modal) return;
    modal.style.setProperty('display', 'flex', 'important');

    const content = document.getElementById('chat-log-content');
    const title = document.getElementById('chat-log-title');
    const studentId = document.getElementById('user-student-id').textContent.trim();

    title.innerText = `💬 ${challengeTitle} - 對話紀錄`;
    content.innerHTML = '<p style="text-align: center; color: #9ca3af; margin-top: 20px;">載入中...</p>';

    try {
        const snapshot = await db.collection('chatlog')
            .doc(studentId)
            .collection('docs')
            .doc(String(docId))
            .collection('challenges')
            .doc(challengeId)
            .collection('history')
            .orderBy('timestamp', 'desc')
            .get();

        if (snapshot.empty) {
            content.innerHTML = '<p style="text-align: center; color: #9ca3af; padding: 20px;">目前尚無對話紀錄。</p>';
            return;
        }

        let html = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            const isStarter = data.is_starter === true;
			const date = data.created_at ? new Date(data.created_at).toLocaleString('zh-TW') : '未知時間';

			if (isStarter) {
				const assistantText = (data.assistant_message || '').replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
                html += renderBubble(assistantText, 'assistant', date);
			} else {
				const assistantText = (data.assistant_message || '').replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
                html += renderBubble(assistantText, 'assistant', date);
				const userText = (data.user_message || '').replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
                html += renderBubble(userText, 'user', date);
			}
        });
        content.innerHTML = html;
    } catch (error) {
        console.error("Chat Log Error:", error);
        content.innerHTML = `<p style="color: #ef4444; padding: 20px;">❌ 讀取失敗: ${error.message}</p>`;
    }
}

// Helper function to keep the code clean and consistent with chatbot.js style
function renderBubble(text, role, time) {
    const isUser = role === 'user';
    const bubbleBg = isUser ? '#007aff' : '#ffffff';
    const textColor = isUser ? '#ffffff' : '#1f2937';
    const align = isUser ? 'flex-end' : 'flex-start';
    const radius = isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px';
    const shadow = isUser ? 'none' : '0 2px 4px rgba(0,0,0,0.05)';

    return `
        <div style="display: flex; flex-direction: column; align-items: ${align}; width: 100%; margin-bottom: 12px;">
            <div style="max-width: 85%; padding: 10px 14px; background: ${bubbleBg}; color: ${textColor}; border-radius: ${radius}; font-size: 14px; line-height: 1.5; box-shadow: ${shadow}; white-space: pre-wrap; word-break: break-word;">${text}</div>
            <span style="font-size: 10px; color: #9ca3af; margin-top: 4px; padding: 0 4px;">${time}</span>
        </div>`;
}

async function enableAnswerRevealer() {
	// 1. Get docId from the title attribute as requested
    const titleEl = document.querySelector('title');
    const docId = titleEl ? titleEl.getAttribute('docid') : null;
    
    if (!docId) {
        console.error("AnswerRevealer: No docid found in <title> tag.");
        return;
    }
    
    // Locate all "i" icons on the page
    const icons = document.querySelectorAll('.caption .icon');

    icons.forEach((icon, index) => {
        const problemIndex = index + 1;
        const challengeId = `challenge-${problemIndex}`; 

        // Ensure icons are visible (removing any previous 'display: none' logic)
        icon.style.display = 'flex';

        icon.addEventListener('click', async function (event) {
            event.stopPropagation();

            // 1. Verify User Identity
            const user = firebase.auth().currentUser;
            const studentIdEl = document.getElementById('user-student-id');
            const studentId = studentIdEl ? studentIdEl.textContent.trim() : "";

            if (!user || !studentId) {
                alert("請先登入並設定學生資料以查看挑戰解說。");
                return;
            }

            try {
                // 2. Fetch the Highest Progress using the global db constant
                const snapshot = await db.collection('summary')
                    .doc(studentId)
                    .collection('docs')
                    .doc(docId)
                    .collection('challenges')
                    .doc(challengeId)
                    .collection('history')
                    .orderBy('metrics.progress', 'desc')
                    .limit(1)
                    .get();

                let maxProgress = 0;
                if (!snapshot.empty) {
                    maxProgress = snapshot.docs[0].data().metrics?.progress || 0;
                }
				
                // 3. Dynamic Messaging & Gatekeeping Logic
                if (maxProgress === 0) {
                    alert(`🚀 你尚未開始這項挑戰！\n請先找 Python 學長聊聊，完成初次嘗試後再來查看解答。`);
                    return;
                } 
                else if (maxProgress <= 30) {
                    alert(`📈 目前進度：${maxProgress}%\n看來你才剛開始探索！\n再深入與 Python 學長討論，讓進度達到 60% 即可解鎖答案。`);
                    return;
                } 
                else if (maxProgress <= 60) {
                    alert(`✨ 做得好！目前進度：${maxProgress}%\n你已經快要完成了！\n再微調一下你的答案，達到 60% 就能看到這裡的詳細解答囉。`);
                    return;
                }

                // 4. Reveal Logic (Execution only reaches here if progress > 60)
                const caption = icon.closest('.caption');
                let answerElement = caption.nextElementSibling;
                
                while (answerElement && !answerElement.classList.contains('answer')) {
                    answerElement = answerElement.nextElementSibling;
                }

                if (answerElement) {
                    const isCurrentlyVisible = answerElement.style.display === 'block';
                    
                    if (!isCurrentlyVisible) {
                        answerElement.style.display = 'block';
                        icon.classList.add('revealed');
                        caption.classList.add('active');
                    } else {
                        answerElement.style.display = 'none';
                        icon.classList.remove('revealed');
                        caption.classList.remove('active');
                    }
                }

            } catch (error) {
                console.error("Firestore Progress Check Error:", error);
                alert("驗證進度時發生錯誤，請稍後再試。");
            }
        });
    });
}


