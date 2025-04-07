function includeHTML(cb = null) {
    const NAVIGATION_HTML = `
    <ul class="nav flex-column">
        <li class="nav-item mb-2"><a href="index.html" class="nav-link link-primary">回到首頁</a></li>
        <li class="nav-item mb-2"><a href="hello_world.html" class="nav-link link-primary">Hello, World!</a></li>
        <li class="nav-item mb-2"><a href="variables_data_types.html" class="nav-link link-primary">變數與資料型態</a></li>
        <li class="nav-item mb-2"><a href="input.html" class="nav-link link-primary">input 函數</a></li>
        <li class="nav-item mb-2"><a href="arithmetic_operators.html" class="nav-link link-primary">算術運算符號與運算優先順序</a></li>
        <li class="nav-item mb-2"><a href="print.html" class="nav-link link-primary">print 進階</a></li>
        <li class="nav-item mb-2"><a href="string_format.html" class="nav-link link-primary">字串格式化</a></li>
        <li class="nav-item mb-2"><a href="logical_operators.html" class="nav-link link-primary">邏輯與比較運算符號</a></li>
        <li class="nav-item mb-2"><a href="if.html" class="nav-link link-primary">條件判斷</a></li>
        <li class="nav-item mb-2"><a href="loop.html" class="nav-link link-primary">迴圈</a></li>
        <li class="nav-item mb-2"><a href="def.html" class="nav-link link-primary">自訂函式</a></li>
	<li class="nav-item mb-2"><a href="practice_1.html" class="nav-link link-primary">問題導向練習題組 1</a></li>
        <li class="nav-item mb-2"><a href="scope.html" class="nav-link link-primary">區域變數與全域變數</a></li>
        <li class="nav-item mb-2"><a href="exception.html" class="nav-link link-primary">例外處理</a></li>
        <li class="nav-item mb-2"><a href="debug.html" class="nav-link link-primary">追蹤與偵錯</a></li>
        <li class="nav-item mb-2"><a href="list.html" class="nav-link link-primary">串列容器</a></li>
        <li class="nav-item mb-2"><a href="tuple.html" class="nav-link link-primary">元組容器</a></li>
        <li class="nav-item mb-2"><a href="set.html" class="nav-link link-primary">集合容器</a></li>
        <li class="nav-item mb-2"><a href="dict.html" class="nav-link link-primary">字典容器</a></li>
	<li class="nav-item mb-2"><a href="practice_2.html" class="nav-link link-primary">問題導向練習題組 2</a></li>
        <li class="nav-item mb-2"><a href="ds_functions.html" class="nav-link link-primary">四大資料結構建構式</a></li>
        <li class="nav-item mb-2"><a href="packing.html" class="nav-link link-primary">指定、多重指定、打包與解包</a></li>
        <li class="nav-item mb-2"><a href="in_is.html" class="nav-link link-primary">身分與成員運算符號</a></li>
        <li class="nav-item mb-2"><a href="string_functions_methods.html" class="nav-link link-primary">字串方法與函式</a></li>    
        <li class="nav-item mb-2"><a href="slicing.html" class="nav-link link-primary">切片</a></li>
        <li class="nav-item mb-2"><a href="file.html" class="nav-link link-primary">檔案操作</a></li>
        <li class="nav-item mb-2"><a href="import.html" class="nav-link link-primary">匯入模組</a></li>
        <li class="nav-item mb-2"><a href="main.html" class="nav-link link-primary">了解 __name__</a></li>
        <li class="nav-item mb-2"><a href="oo.html" class="nav-link link-primary">類別與物件</a></li>
        <li class="nav-item mb-2"><a href="practice_stock_price.html" class="nav-link link-primary">綜合練習：抓取 TSMC 股票歷史價格</a></li>
        <li class="nav-item mb-2"><a href="practice_pygame_zero.html" class="nav-link link-primary">綜合練習：Pygame Zero 基礎教學</a></li>
        <li class="nav-item mb-2"><a href="practice_optical_illusions_pgzero.html" class="nav-link link-primary">綜合練習：Hering Illusion</a></li>
        <li class="nav-item mb-2"><a href="practice_stroop_pgzero.html" class="nav-link link-primary">綜合練習：Stroop Task</a></li>
        <li class="nav-item mb-2"><a href="practice_bouncing_balls_pgzero.html" class="nav-link link-primary">綜合練習：Bouncing Balls</a></li>
    </ul>
    `;

    const elements = document.querySelectorAll("[w3-include-html]");
    elements.forEach(elmnt => {
        elmnt.innerHTML = NAVIGATION_HTML;
        elmnt.removeAttribute("w3-include-html");
    });

    if (cb) cb();
	
    document.title;

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

function highlightItem() {
	// Highlight the nav item based on the current page URL
	const currentPage = window.location.pathname.split('/').pop();	
	document.querySelectorAll('.nav-link').forEach(link => {		
		if (link.getAttribute('href') === currentPage) {
			link.classList.add('active');
			link.style.fontWeight = 'bold';
			link.style.background = 'lightblue';
			
			link.scrollIntoView({ behavior: 'smooth', block: 'center' });
			
			// Add copy buttons to all <code> elements
            document.querySelectorAll('pre code').forEach((block) => {
                const button = document.createElement('button');
                button.textContent = 'Copy';
                button.classList.add('btn', 'btn-sm', 'btn-secondary', 'copy-btn');
                button.style.position = 'absolute';
                button.style.top = '5px';
                button.style.right = '5px';

                const pre = block.parentNode;
                pre.style.position = 'relative';
                pre.appendChild(button);

                button.addEventListener('click', () => {
                    navigator.clipboard.writeText(block.textContent).then(() => {
                        button.textContent = 'Copied!';
                        setTimeout(() => (button.textContent = 'Copy'), 2000);
                    });
                });
            });
		}
	});
}

function navClick() {
	const sidebar = document.getElementById("sidebar");
	const main = document.querySelector("main");
	const header = document.querySelector("main > header");
	const toggleButton = document.getElementById("toggleNav");
	
	if (sidebar.classList.contains("hidden")) {
		sidebar.classList.remove("hidden");
		toggleButton.style.left = "190px"; // Sidebar width
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

function enableAnswerRevealer() {	
	const fileName = window.location.pathname.split('/').pop();
	const GOOGLE_SHEETS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSF-MJYb-3c-teT8X6Te8eqIoP4UC8BsgMUI0pcpo2VYKrf178ACOjLEfuFpuRPu3QSy5DDk2KY1jTO/pub?gid=0&single=true&output=csv";
	let showAnswers = false;

	fetch(GOOGLE_SHEETS_CSV_URL)
		.then(response => response.text()) // Read CSV as text
		.then(data => {
			let rows = data.split("\n"); // Split CSV rows		
			const result = {};

			rows.forEach(row => {
				// console.log(row);
				const [key, ...values] = row.split(","); // Split by comma
				result[key.trim()] = values.map(value => value.trim())
								.filter(value => value !== "")
								.map(Number);
			});
			
			// console.log(result);
			
			if (result.hasOwnProperty(fileName) && result[fileName].length != 0) showAnswers = true;
			else showAnswers = false;

			if (showAnswers) {
				document.querySelectorAll('.caption .icon').forEach((icon, index) => {
					let clickCount = 0;
					let isAnswerVisible = false;
					const numClicksToReveal = 1;
					
					if (!result[fileName].includes(index+1)) {
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
			} else {
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
			}
			
		})
		.catch(error => {
			console.error("Error fetching CSV:", error);
			
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
