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
                <button onclick="logoutFromFirebase()" style="background: none; border: none; color: #1a73e8; font-size: 0.95rem; cursor: pointer; font-weight: 500; padding: 0; margin-left: 4px;">登出</button>
            </div>

            <div id="student-id-prompt" style="display: none; position: absolute; top: 55px; right: 0; width: 240px; background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #e0e0e0; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                <div style="font-size: 14px; margin-bottom: 12px; color: #202124; text-align: left; font-weight: 600;">請完成資料設定</div>
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
const db = firebase.app().firestore('accounts');

// --- Auth State Logic ---
auth.onAuthStateChanged(async (user) => {
    const loginBtn = document.getElementById('login-btn');
    const userInfoArea = document.getElementById('user-info-area');
    const nameEl = document.getElementById('user-display-name');
    const studentNameEl = document.getElementById('user-student-name');
    const idEl = document.getElementById('user-student-id');
    const promptEl = document.getElementById('student-id-prompt');

    if (user) {
        if (loginBtn) loginBtn.style.display = 'none';
        if (userInfoArea) userInfoArea.style.display = 'flex';
        if (nameEl) nameEl.textContent = user.displayName;

        // Check for existing Student ID and Name in Firestore
        try {
            // NEW LOGIC: Query by ownerUid since doc ID is now the student ID
            const userQuery = await db.collection("users")
                .where("ownerUid", "==", user.uid)
                .limit(1)
                .get();

            if (!userQuery.empty) {
                const userData = userQuery.docs[0].data();
                if (studentNameEl) studentNameEl.textContent = userData.studentName;
                if (idEl) idEl.textContent = userData.studentId;
                if (promptEl) promptEl.style.display = 'none';
            } else {
                if (studentNameEl) studentNameEl.textContent = "未設定學生資料";
                if (idEl) idEl.textContent = "";
                if (promptEl) promptEl.style.display = 'block';
            }
        } catch (err) {
            console.error("Firestore error:", err);
            if (studentNameEl) studentNameEl.textContent = "載入失敗";
        }
		
		// 2. NEW: Auto-resume Chatbot if the login prompt was active
        const loginPrompt = document.getElementById('login-prompt');
        if (loginPrompt) {
            loginPrompt.remove(); // Close the modal
            
            // If a button was clicked previously, trigger openChatbot again
            if (typeof pendingChatbotButton !== 'undefined' && pendingChatbotButton) {
                openChatbot(pendingChatbotButton);
                pendingChatbotButton = null; // Clear state
            }
        }
    } else {
        if (loginBtn) loginBtn.style.display = 'flex';
        if (userInfoArea) userInfoArea.style.display = 'none';
        if (promptEl) promptEl.style.display = 'none';
    }
});

// --- Actions ---
function loginWithFirebase() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch(e => alert(e.message));
}

function logoutFromFirebase() {
    auth.signOut().then(() => window.location.reload());
}

async function saveStudentId() {
    const sName = document.getElementById('student-name-input').value.trim();
    const sId = document.getElementById('student-id-input').value.trim();
    const user = auth.currentUser;

    if (!user) {
        alert("請先登入");
        return;
    }

    if (!sName || !sId) {
        alert("請輸入姓名和學號");
        return;
    }

    try {
        // 1. Check if this Student ID already exists as a document
        const docRef = db.collection("users").doc(sId);
        const docSnap = await docRef.get();

        if (docSnap.exists) {
            const existingData = docSnap.data();
            
            // Check if the registered ownerUid is different from the current user's UID
            if (existingData.ownerUid && existingData.ownerUid !== user.uid) {
                // Specific error message for duplicate ID
                alert(`❌ 註冊失敗：學號 「${sId}」 已被其他 Google 帳號使用。`);
                return; // Stop execution
            }
        }

        // 2. Save the data using Student ID as the Document ID
        await docRef.set({
            studentName: sName,
            studentId: sId,
            email: user.email,
            googleDisplayName: user.displayName,
            ownerUid: user.uid, // Store the Firebase UID to verify ownership later
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        alert("資料儲存成功！");
        window.location.reload();
    } catch (e) {
        console.error("Error saving student data:", e);
        
		if (e.code === 'permission-denied') {
            alert("❌ 權限不足：該學號可能已被註冊，或系統拒絕了您的請求。");
        } else {
            alert("❌ 儲存失敗：" + e.message);
        }
    }
}