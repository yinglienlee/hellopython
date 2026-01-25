const COURSE_TREE = [
  {
    title: "📂 基礎入門",
    chapters: [
      { href: "hello_world.html", title: "Hello, World!", desc: "你的第一個 Python 程式，認識程式的執行流程。" },
      { href: "variables_data_types.html", title: "變數與資料型態", desc: "了解資料如何命名、儲存與分類。" },
      { href: "input.html", title: "input 函數", desc: "讓程式能與使用者互動，讀取輸入資料。" },
      { href: "arithmetic_operators.html", title: "算術運算符號與運算優先順序", desc: "數學運算與運算順序的基本規則。" },
      { href: "print.html", title: "print 進階", desc: "更靈活地輸出資訊到螢幕。" },
      { href: "string_format.html", title: "字串格式化", desc: "將變數或資料漂亮地嵌入文字中。" }
    ]
  },
  {
    title: "📂 邏輯與流程控制",
    chapters: [
      { href: "logical_operators.html", title: "邏輯與比較運算符號", desc: "判斷條件真或假的基本工具。" },
      { href: "if.html", title: "條件判斷", desc: "讓程式依不同條件選擇性執行。" },
      { href: "loop.html", title: "迴圈", desc: "重複執行程式碼，提高效率。" },
      { href: "def.html", title: "自訂函式", desc: "將程式模組化並重複使用。" }
    ]
  },
  {
    title: "📂 問題導向練習（階段一）",
    chapters: [
      { href: "practice_1.html", title: "問題導向練習題組 1", desc: "鞏固基礎語法與流程控制概念。" }
    ]
  },
  {
    title: "📂 變數範疇與除錯",
    chapters: [
      { href: "scope.html", title: "區域變數與全域變數", desc: "理解變數的作用範圍與使用方式。" },
      { href: "exception.html", title: "例外處理", desc: "處理錯誤，避免程式崩潰。" },
      { href: "debug.html", title: "追蹤與偵錯", desc: "找出程式錯誤並修正問題。" }
    ]
  },
  {
    title: "📂 資料結構（容器）",
    chapters: [
      { href: "list.html", title: "串列容器", desc: "儲存有順序的一組資料，可修改。" },
      { href: "tuple.html", title: "元組容器", desc: "不可修改的資料集合，適合固定資料。" },
      { href: "set.html", title: "集合容器", desc: "不重複且無順序的資料集合。" },
      { href: "dict.html", title: "字典容器", desc: "使用鍵值對管理資料。" }
    ]
  },
  {
    title: "📂 問題導向練習（階段二）",
    chapters: [
      { href: "practice_2.html", title: "問題導向練習題組 2", desc: "鞏固資料結構與程式除錯技能。" }
    ]
  },
  {
    title: "📂 進階語法與資料操作",
    chapters: [
      { href: "ds_functions.html", title: "四大資料結構建構式", desc: "快速建立串列、元組、集合與字典。" },
      { href: "packing.html", title: "指定、多重指定、打包與解包", desc: "一次處理多個變數，方便函式傳參。" },
      { href: "in_is.html", title: "身分與成員運算符號", desc: "判斷物件是否相同或存在於集合中。" },
      { href: "string_functions_methods.html", title: "字串方法與函式", desc: "操作字串、分析與轉換資料。" },
      { href: "slicing.html", title: "切片", desc: "取出資料的一部分，支援字串與容器。" }
    ]
  },
  {
    title: "📂 檔案與模組",
    chapters: [
      { href: "file.html", title: "檔案操作", desc: "讀取與寫入外部資料檔案。" },
      { href: "import.html", title: "匯入模組", desc: "使用現成或自訂功能模組。" },
      { href: "main.html", title: "了解 __name__", desc: "理解模組執行方式與主程式概念。" }
    ]
  },
  {
    title: "📂 物件導向",
    chapters: [
      { href: "oo.html", title: "類別與物件", desc: "使用物件方式組織程式，學習 OOP 概念。" }
    ]
  },
  {
    title: "📂 問題導向練習（階段三）",
    chapters: [
      { href: "practice_3.html", title: "問題導向練習題組 3", desc: "綜合運用各階段所學知識。" }
    ]
  },
  {
    title: "📂 綜合實作專題",
    chapters: [
      { href: "practice_stock_price.html", title: "抓取 TSMC 股票歷史價格", desc: "實務資料分析入門，使用 Python 擷取資料。" },
      { href: "practice_pygame_zero.html", title: "Pygame Zero 基礎教學", desc: "用 Python 製作互動遊戲，入門遊戲設計。" },
      { href: "practice_optical_illusions_pgzero.html", title: "Hering Illusion", desc: "程式實作視覺錯覺效果，學習動畫控制。" },
      { href: "practice_stroop_pgzero.html", title: "Stroop Task", desc: "心理實驗程式實作，理解刺激與反應。" },
      { href: "practice_bouncing_balls_pgzero.html", title: "Bouncing Balls", desc: "動畫與物理概念整合，模擬彈跳效果。" }
    ]
  }
];

// Helper updated to use class-based logic via your backend or Firestore auth state
// Change: Add userData as a parameter
async function getDocVisibility(userData) {
    try {
        if (!userData || !userData.studentClass) {
            console.warn("No student class found for this user.");
            return {};
        }

        const studentClass = userData.studentClass;

        // Fetch the global visibility settings
        const docSnap = await db.collection("system").doc("docs").get();
        if (!docSnap.exists) return {};
        
        const docs = docSnap.data().documents || [];
        
        return docs.reduce((acc, d) => {
            const fileName = d.url.split('/').pop();
            const allowedClasses = d.visible_classes || [];
            
            // Logic: Is the student's class in the allowed list?
            acc[fileName] = allowedClasses.includes(studentClass);
            return acc;
        }, {});
    } catch (e) {
        console.error("Visibility Error:", e);
        return {};
    }
}

// includeHTML and includeHomeNav remain largely the same, 
// as they simply consume the map returned by getDocVisibility()
// Change: accept visibilityMap as an argument
async function includeHTML(visibilityMap = null) {
    const navContainer = document.querySelector("[w3-include-html]");
    if (!navContainer) return;

    // IF NO DATA YET: Show spinner and stop here
    if (visibilityMap === null) {
        navContainer.innerHTML = `
            <div class="p-4 text-slate-400 text-sm flex items-center gap-2">
                <span class="spinner"></span> 正在載入選單...
            </div>`;
        return; 
    }

    // IF DATA ARRIVED: Build the actual menu
    let html = `<ul class="nav flex-column">
        <li><a href="index.html" class="home-link">回到首頁</a></li>`;

    COURSE_TREE.forEach(group => {
        html += `<li class="nav-item"><details open><summary>${group.title}</summary><ul>`;
        group.chapters.forEach(ch => {
            const isVisible = visibilityMap[ch.href] !== false;
            html += `
                <li class="${isVisible ? '' : 'nav-locked'}">
                    <a href="${isVisible ? ch.href : 'javascript:void(0)'}">
                        ${ch.title} ${isVisible ? '' : '🔒'}
                    </a>
                </li>`;
        });
        html += `</ul></details></li>`;
    });

    navContainer.innerHTML = html;
    
	highlightItem();
}

async function includeHomeNav(visibilityMap = null) {
    const container = document.getElementById("home-navigation");
    if (!container) return;

    // --- STEP 1: IMMEDIATE SKELETON STATE ---
    // If no data yet, show the shimmer effect and exit the function
    if (visibilityMap === null) {
        container.innerHTML = `
            <div class="course-map">
                <section class="course-group loading-skeleton">
                    <div class="skeleton-title"></div>
                    <div class="card-grid">
                        ${Array(3).fill('<div class="skeleton-card"></div>').join('')}
                    </div>
                </section>
            </div>`;
        return; 
    }

    // --- STEP 2: ACTUAL CONTENT RENDER ---
    // This part runs once the visibilityMap is passed from the Auth observer
    let html = `<div class="course-map">`;
    
    COURSE_TREE.forEach((group, index) => {
        html += `
            <section class="course-group" style="animation: fadeInUp 0.5s ease forwards; animation-delay: ${index * 0.1}s;">
                <h3>${group.title}</h3>
                <div class="card-grid">`;

        group.chapters.forEach(ch => {
            // Check visibility against our class-based map
            const isVisible = visibilityMap[ch.href] !== false;
            
            html += `
                <a href="${isVisible ? ch.href : 'javascript:void(0)'}" 
                   class="card ${isVisible ? '' : 'locked-card'}"
                   ${!isVisible ? 'onclick="alert(\'此課程尚未對您的班級開放\')"' : ''}>
                    <h4>${ch.title} ${isVisible ? '' : '🔒'}</h4>
                    <p>${ch.desc}</p>
                </a>`;
        });
        
        html += `</div></section>`;
    });

    html += `</div>`;
    container.innerHTML = html;
}

/*
function includeHTML(cb=null) {
  var z, i, elmnt, file, xhttp;
  
  z = document.getElementsByTagName("*");
  for (i = 0; i < z.length; i++) {
    elmnt = z[i];
    
    file = elmnt.getAttribute("w3-include-html");
    if (file) {      
      xhttp = new XMLHttpRequest();
      xhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
			if (this.status == 200) {
				elmnt.innerHTML = this.responseText;	
				if (cb) cb();
			}
			if (this.status == 404) {
				elmnt.innerHTML = "Page not found.";
			}
          
          elmnt.removeAttribute("w3-include-html");
          includeHTML();
        }
      }
      xhttp.open("GET", file, true);
      xhttp.send();
      
      return;
    }
  }
}
*/

/* ========= TREE NAV BEHAVIOR ========= */

// track whether Ctrl is held
let ctrlPressed = false;
document.addEventListener('keydown', e => { if (e.ctrlKey) ctrlPressed = true; });
document.addEventListener('keyup',   e => { ctrlPressed = false; });

function highlightItem() {
  const currentPage = window.location.pathname.split('/').pop();

  document.querySelectorAll('.nav a[href]').forEach(link => {
    if (link.getAttribute('href') === currentPage) {
      link.classList.add('active');

      const details = link.closest('details');
      if (details) {
        // collapse others unless Ctrl is pressed
        if (!ctrlPressed) {
          document.querySelectorAll('.nav details').forEach(d => {
            if (d !== details) d.open = false;
          });
        }

        details.open = true;

        const summary = details.querySelector('summary');
        if (summary) summary.classList.add('active-group');
      }

      link.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });

  // copy buttons (guarded)
  document.querySelectorAll('pre code').forEach(block => {
    if (block.parentNode.querySelector('.copy-btn')) return;

    const btn = document.createElement('button');
    btn.textContent = 'Copy';
    btn.className = 'btn btn-sm btn-secondary copy-btn';

    const pre = block.parentNode;
    pre.style.position = 'relative';
    btn.style.position = 'absolute';
    btn.style.top = '6px';
    btn.style.right = '6px';
    pre.appendChild(btn);

    btn.addEventListener('click', () => {
      navigator.clipboard.writeText(block.textContent).then(() => {
        btn.textContent = 'Copied!';
        setTimeout(() => (btn.textContent = 'Copy'), 1500);
      });
    });
  });
}

// auto-collapse logic on clicking group titles
document.addEventListener('click', e => {
  const summary = e.target.closest('summary');
  if (!summary) return;

  if (!ctrlPressed) {
    document.querySelectorAll('.nav details').forEach(d => {
      if (d !== summary.parentElement) d.open = false;
    });
  }
});


function navClick() {
	const sidebar = document.getElementById("sidebar");
	const main = document.querySelector("main");
	const header = document.querySelector("main > header");
	const toggleButton = document.getElementById("toggleNav");
	
	if (sidebar.classList.contains("hidden")) {
		sidebar.classList.remove("hidden");
		toggleButton.style.left = "205px"; // Sidebar width
		main.style.marginLeft = "0"; // Nudge main content
		header.style.paddingLeft = "250px"; // Restore header content
        main.style.width = "calc(100% - 190px)"; // Adjust width
		toggleButton.innerHTML = "&#8212;"; // Single line
	} else {
		sidebar.classList.add("hidden");
		toggleButton.style.left = "0"; // Align with the left border of the page
		main.style.marginLeft = "-250px"; // Restore main content
		header.style.paddingLeft = "0"; // Nudge header content
        main.style.width = "100%"; // Reset width
		toggleButton.innerHTML = "&#9776;"; // Three lines (hamburger icon)
	}
}

/*
function enableAnswerRevealer() {	
	const urlParams = new URLSearchParams(window.location.search);
	const overrideKey = parseInt(urlParams.get("override"));
	const fileName = window.location.pathname.split('/').pop();
	const GOOGLE_SHEETS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSF-MJYb-3c-teT8X6Te8eqIoP4UC8BsgMUI0pcpo2VYKrf178ACOjLEfuFpuRPu3QSy5DDk2KY1jTO/pub?gid=0&single=true&output=csv";
	
    let isOverrideActive = false; // Flag to determine if the global override is active

	fetch(GOOGLE_SHEETS_CSV_URL)
		.then(response => response.text()) // Read CSV as text
		.then(data => {
			let rows = data.split("\n"); // Split CSV rows		
			const result = {};

			rows.forEach(row => {
				const [key, ...values] = row.split(","); // Split by comma
				result[key.trim()] = values.map(value => value.trim())
								.filter(value => value !== "")
								.map(Number);
			});
			
			console.log("Parsed CSV Data:", result); // Updated log for clarity
			
            // 1. Determine if the global override is active
            if (result["reveal"] && overrideKey && result["reveal"].includes(overrideKey)) {
                isOverrideActive = true;
                console.log("Global Answer Override is Active.");
            }
			
			console.log(result["reveal"], overrideKey);
            
            // 2. Get the list of problems to reveal on this specific page
            const revealedProblems = result[fileName] || []; 
			
            // Use revealedProblems and isOverrideActive to determine visibility
			document.querySelectorAll('.caption .icon').forEach((icon, index) => {
				const problemIndex = index + 1; // 1-based index
                
                // Condition to HIDE the answer/icon:
                // Hide if: 
                // a) The global override is NOT active, AND
                // b) The problem's index is NOT in the page-specific revealed list.
                const shouldHide = !isOverrideActive && !revealedProblems.includes(problemIndex);
					
				if (shouldHide) {
					icon.style.display = 'none'; // Hide the icon
					const caption = icon.closest('.caption');
					let answerElement = caption.nextElementSibling;
					while (answerElement && !answerElement.classList.contains('answer')) {
						answerElement = answerElement.nextElementSibling;
					}
					if (answerElement) {
						answerElement.style.display = 'none'; // Hide the answer
					}
				} else {
                    // Answer is visible/clickable (either via override or page-specific list)
					let clickCount = 0;
					let isAnswerVisible = false;
					const numClicksToReveal = 1;
					
					icon.addEventListener('click', function (event) {
						// Prevent bubbling to the parent `.caption` click handler
						event.stopPropagation();

						clickCount++;

						if (clickCount === numClicksToReveal) {
							// Find the parent `.caption` element
							const caption = icon.closest('.caption');

							// Find the next sibling `.answer` element
							let answerElement = caption.nextElementSibling;
							while (answerElement && !answerElement.classList.contains('answer')) {
								answerElement = answerElement.nextElementSibling;
							}

							if (answerElement) {
								if (!isAnswerVisible) {
									answerElement.style.display = 'block';
									icon.classList.add('revealed');
								} else {
									answerElement.style.display = 'none';
									icon.classList.remove('revealed');
								}

								caption.classList.toggle('active');
								isAnswerVisible = !isAnswerVisible;
							}

							// Reset the click count after toggling
							clickCount = 0;
						}
					});
				}					
			});
			
		})
		.catch(error => {
			console.error("Error fetching CSV:", error);
			
			// Default behavior on error: hide all answers
			document.querySelectorAll('.caption .icon').forEach(icon => {
				icon.style.display = 'none'; // Hide the icon
				const caption = icon.closest('.caption');
				let answerElement = caption.nextElementSibling;
				while (answerElement && !answerElement.classList.contains('answer')) {
					answerElement = answerElement.nextElementSibling;
				}
				if (answerElement) {
					answerElement.style.display = 'none'; // Hide the answer
				}
			});
		});
}
*/