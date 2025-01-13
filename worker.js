addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);

  // 处理 CORS 预检请求
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  // 处理 POST 请求
  if (request.method === 'POST' && url.pathname === '/recognize') {
    try {
      const { token, imageId } = await request.json();

      if (!token || !imageId) {
        return new Response(JSON.stringify({ error: 'Missing token or imageId' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // 调用 QwenLM API
      const response = await fetch('https://chat.qwenlm.ai/api/chat/completions', {
        method: 'POST',
        headers: {
          'accept': '*/*',
          'authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stream: false,
          model: 'qwen-vl-max-latest',
          messages: [
            {
              role: 'user',
              content: [
                { 
                  type: 'text', 
                  text: '请识别图片中的内容。对于数学公式和数学符号，请使用标准的LaTeX格式输出。' +
                        '要求：\n' +
                        '1. 所有数学公式和单个数学符号都要用LaTeX格式\n' +
                        '2. 普通文本保持原样\n' +
                        '3. 对于行内公式使用$单个符号$\n' +
                        '4. 对于独立公式块使用$$公式$$\n' +
                        '5. 严格保持原文的段落格式和换行\n' +
                        '6. 当文本明显换行时，使用\\n进行换行处理\n' +
                        '请尽可能精确地转换每个数学符号并保持原始排版格式。'
                },
                { type: 'image', image: imageId }, // 使用上传后的图片 ID
              ],
            },
          ],
          session_id: '1',
          chat_id: '2',
          id: '3',
        }),
      });

      const data = await response.json();
      
      // 对识别结果进行后处理，确保LaTeX格式正确并保持换行
      let result = data.choices[0]?.message?.content || '识别失败';
      result = result
        // 修复可能的LaTeX格式问题
        .replace(/\\（/g, '\\(')
        .replace(/\\）/g, '\\)')
        // 确保连续的换行符被保留（2个以上的换行符表示段落分隔）
        .replace(/\n{3,}/g, '\n\n')
        // 保留单个换行符，不合并
        .replace(/([^\n])\n([^\n])/g, '$1\n$2')
        .trim();

      return new Response(JSON.stringify({ ...data, choices: [{ message: { content: result } }] }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // 返回前端界面
  return new Response(getHTML(), {
    headers: { 'Content-Type': 'text/html' },
  });
}

function getHTML() {
  const html = [
    '<!DOCTYPE html>',
    '<html lang="zh-CN">',
    '<head>',
    '<meta charset="UTF-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
    '<title>智能公式识别</title>',
    
    // 添加 MathJax 支持
    '<script src="https://polyfill.io/v3/polyfill.min.js?features=es6"></script>',
    '<script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>',
    '<script>',
    'window.MathJax = {',
    '  tex: {',
    '    inlineMath: [["$", "$"]],',
    '    displayMath: [["$$", "$$"]]',
    '  },',
    '  startup: {',
    '    typeset: false',
    '  }',
    '};',
    '</script>',
    
    '<style>',
    '    * {',
    '      box-sizing: border-box;',
    '      margin: 0;',
    '      padding: 0;',
    '    }',
        
    '    body {',
    '      font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Oxygen, Ubuntu, sans-serif;',
    '      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);',
    '      min-height: 100vh;',
    '      display: flex;',
    '      justify-content: center;',
    '      align-items: center;',
    '      padding: 20px;',
    '    }',
    
    '    .container {',
    '      background: rgba(255, 255, 255, 0.95);',
    '      padding: 2.5rem;',
    '      border-radius: 16px;',
    '      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);',
    '      width: 90%;',
    '      max-width: 800px;',
    '      transition: all 0.3s ease;',
    '    }',
    
    '    h1 {',
    '      color: #2c3e50;',
    '      margin-bottom: 1.5rem;',
    '      font-size: 1.8rem;',
    '      text-align: center;',
    '    }',
    
    '    .upload-area {',
    '      border: 2px dashed #8e9eab;',
    '      border-radius: 12px;',
    '      padding: 2rem;',
    '      text-align: center;',
    '      transition: all 0.3s ease;',
    '      margin-bottom: 1.5rem;',
    '      cursor: pointer;',
    '      position: relative;',
    '      overflow: hidden;',
    '    }',
    
    '    .upload-area:hover {',
    '      border-color: #3498db;',
    '      background: rgba(52, 152, 219, 0.05);',
    '    }',
    
    '    .upload-area.dragover {',
    '      border-color: #3498db;',
    '      background: rgba(52, 152, 219, 0.1);',
    '      transform: scale(1.02);',
    '    }',
    
    '    .upload-area i {',
    '      font-size: 2rem;',
    '      color: #8e9eab;',
    '      margin-bottom: 1rem;',
    '    }',
    
    '    .upload-text {',
    '      color: #7f8c8d;',
    '      font-size: 0.9rem;',
    '    }',
    
    '    #tokens {',
    '      width: 100%;',
    '      padding: 0.8rem;',
    '      border: 1px solid #dcdde1;',
    '      border-radius: 8px;',
    '      margin-bottom: 1rem;',
    '      font-size: 0.9rem;',
    '      resize: none;',
    '    }',
    
    '    .result-container {',
    '      margin-top: 1.5rem;',
    '      opacity: 0;',
    '      transform: translateY(20px);',
    '      transition: all 0.3s ease;',
    '    }',
    
    '    .result-container.show {',
    '      opacity: 1;',
    '      transform: translateY(0);',
    '    }',
    
    '    .result {',
    '      background: #f8f9fa;',
    '      padding: 1.2rem;',
    '      border-radius: 8px;',
    '      color: #2c3e50;',
    '      font-size: 1rem;',
    '      line-height: 1.6;',
    '      white-space: pre-wrap;',
    '    }',
    
    '    .loading {',
    '      display: none;',
    '      text-align: center;',
    '      margin: 1rem 0;',
    '    }',
    
    '    .loading::after {',
    '      content: \'\';',
    '      display: inline-block;',
    '      width: 20px;',
    '      height: 20px;',
    '      border: 2px solid #3498db;',
    '      border-radius: 50%;',
    '      border-top-color: transparent;',
    '      animation: spin 0.8s linear infinite;',
    '    }',
    
    '    @keyframes spin {',
    '      to { transform: rotate(360deg); }',
    '    }',
    
    '    .preview-image {',
    '      max-width: 100%;',
    '      max-height: 200px;',
    '      margin: 1rem 0;',
    '      border-radius: 8px;',
    '      display: none;',
    '    }',
    
    '    /* 侧边栏样式 */',
    '    .sidebar {',
    '      position: fixed;',
    '      right: -300px;',
    '      top: 0;',
    '      width: 300px;',
    '      height: 100vh;',
    '      background: white;',
    '      box-shadow: -5px 0 15px rgba(0, 0, 0, 0.1);',
    '      transition: right 0.3s ease;',
    '      padding: 20px;',
    '      z-index: 1000;',
    '    }',
    
    '    .sidebar.open {',
    '      right: 0;',
    '    }',
    
    '    .sidebar-toggle {',
    '      position: fixed;',
    '      right: 20px;',
    '      top: 20px;',
    '      background: #3498db;',
    '      color: white;',
    '      border: none;',
    '      padding: 10px 15px;',
    '      border-radius: 5px;',
    '      cursor: pointer;',
    '      z-index: 1001;',
    '    }',
    
    '    .token-list {',
    '      margin-top: 20px;',
    '    }',
    
    '    .token-item {',
    '      background: #f8f9fa;',
    '      padding: 10px;',
    '      margin-bottom: 10px;',
    '      border-radius: 5px;',
    '      cursor: pointer;',
    '      word-break: break-all;',
    '    }',
    
    '    .token-item:hover {',
    '      background: #e9ecef;',
    '    }',
    
    '    #tokenInput {',
    '      width: 100%;',
    '      padding: 10px;',
    '      margin-bottom: 10px;',
    '      border: 1px solid #dcdde1;',
    '      border-radius: 5px;',
    '    }',
    
    '    .save-btn {',
    '      background: #3498db;',
    '      color: white;',
    '      border: none;',
    '      padding: 10px 15px;',
    '      border-radius: 5px;',
    '      cursor: pointer;',
    '      width: 100%;',
    '    }',
    
    '    /* 历史记录样式 */',
    '    .history-container {',
    '      margin-top: 2rem;',
    '      border-top: 1px solid #eee;',
    '      padding-top: 1rem;',
    '    }',
    
    '    .history-title {',
    '      color: #2c3e50;',
    '      font-size: 1.2rem;',
    '      margin-bottom: 1rem;',
    '    }',
    
    '    .history-item {',
    '      display: flex;',
    '      align-items: flex-start;',
    '      padding: 1rem;',
    '      background: #f8f9fa;',
    '      border-radius: 8px;',
    '      margin-bottom: 1rem;',
    '    }',
    
    '    .history-image {',
    '      width: 100px;',
    '      height: 100px;',
    '      object-fit: cover;',
    '      border-radius: 4px;',
    '      margin-right: 1rem;',
    '    }',
    
    '    .history-content {',
    '      flex: 1;',
    '    }',
    
    '    .history-text {',
    '      color: #2c3e50;',
    '      font-size: 0.9rem;',
    '      line-height: 1.4;',
    '    }',
    
    '    .history-time {',
    '      color: #7f8c8d;',
    '      font-size: 0.8rem;',
    '      margin-top: 0.5rem;',
    '    }',
    
    '    .no-history {',
    '      text-align: center;',
    '      color: #7f8c8d;',
    '      padding: 1rem;',
    '    }',
    
    '    .modal {',
    '      display: none;',
    '      position: fixed;',
    '      top: 0;',
    '      left: 0;',
    '      width: 100%;',
    '      height: 100%;',
    '      background-color: rgba(0, 0, 0, 0.9);',
    '      z-index: 2000;',
    '      cursor: pointer;',
    '    }',
    
    '    .modal-content {',
    '      max-width: 90%;',
    '      max-height: 90vh;',
    '      margin: auto;',
    '      display: block;',
    '      position: relative;',
    '      top: 50%;',
    '      transform: translateY(-50%);',
    '    }',
    
    '    /* 修改侧边栏样式 */',
    '    .sidebar {',
    '      position: fixed;',
    '      right: -400px;', 
    '      top: 0;',
    '      width: 400px;', 
    '      height: 100vh;',
    '      background: rgba(255, 255, 255, 0.95);',
    '      backdrop-filter: blur(10px);',
    '      box-shadow: -5px 0 15px rgba(0, 0, 0, 0.1);',
    '      transition: right 0.3s ease;',
    '      padding: 30px;',
    '      z-index: 1000;',
    '    }',

    '    .sidebar-header {',
    '      display: flex;',
    '      justify-content: space-between;',
    '      align-items: center;',
    '      margin-bottom: 20px;',
    '      padding-bottom: 15px;',
    '      border-bottom: 2px solid #eee;',
    '    }',

    '    .sidebar-header h2 {',
    '      margin: 0;',
    '      color: #2c3e50;',
    '      font-size: 1.5rem;',
    '    }',

    '    .close-sidebar {',
    '      background: none;',
    '      border: none;',
    '      font-size: 1.5rem;',
    '      cursor: pointer;',
    '      color: #7f8c8d;',
    '    }',

    '    .token-section {',
    '      margin-bottom: 25px;',
    '    }',

    '    .token-section label {',
    '      display: block;',
    '      margin-bottom: 10px;',
    '      color: #34495e;',
    '      font-weight: 500;',
    '    }',

    '    #tokenInput {',
    '      width: 100%;',
    '      padding: 12px;',
    '      border: 2px solid #e9ecef;',
    '      border-radius: 8px;',
    '      font-size: 0.95rem;',
    '      transition: border-color 0.3s ease;',
    '      margin-bottom: 15px;',
    '    }',

    '    #tokenInput:focus {',
    '      outline: none;',
    '      border-color: #3498db;',
    '    }',

    '    .save-btn {',
    '      background: #3498db;',
    '      color: white;',
    '      border: none;',
    '      padding: 12px 20px;',
    '      border-radius: 8px;',
    '      cursor: pointer;',
    '      width: 100%;',
    '      font-size: 1rem;',
    '      transition: background 0.3s ease;',
    '    }',

    '    .save-btn:hover {',
    '      background: #2980b9;',
    '    }',

    '    .token-list {',
    '      margin-top: 25px;',
    '      max-height: calc(100vh - 250px);',
    '      overflow-y: auto;',
    '    }',

    '    .token-item {',
    '      background: #f8f9fa;',
    '      padding: 15px;',
    '      margin-bottom: 12px;',
    '      border-radius: 8px;',
    '      cursor: pointer;',
    '      transition: all 0.3s ease;',
    '      border: 2px solid transparent;',
    '    }',

    '    .token-item:hover {',
    '      background: #e9ecef;',
    '      transform: translateX(-5px);',
    '    }',

    '    .token-item.active {',
    '      border-color: #3498db;',
    '      background: #f1f9ff;',
    '    }',

    '    /* 添加左侧边栏样式 */',
    '    .history-sidebar {',
    '      position: fixed;',
    '      left: -300px;',
    '      top: 0;',
    '      width: 300px;',
    '      height: 100vh;',
    '      background: white;',
    '      box-shadow: 5px 0 15px rgba(0, 0, 0, 0.1);',
    '      transition: left 0.3s ease;',
    '      padding: 20px;',
    '      z-index: 1000;',
    '      overflow-y: auto;',
    '    }',
    
    '    .history-sidebar.open {',
    '      left: 0;',
    '    }',
    
    '    .history-toggle {',
    '      position: fixed;',
    '      left: 20px;',
    '      top: 20px;',
    '      background: #3498db;',
    '      color: white;',
    '      border: none;',
    '      padding: 10px 15px;',
    '      border-radius: 5px;',
    '      cursor: pointer;',
    '      z-index: 1001;',
    '    }',
    
    '    /* 添加复制按钮样式 */',
    '    .result-header {',
    '      display: flex;',
    '      justify-content: space-between;',
    '      align-items: center;',
    '      margin-bottom: 10px;',
    '    }',
    
    '    .copy-btn {',
    '      background: #3498db;',
    '      color: white;',
    '      border: none;',
    '      padding: 5px 10px;',
    '      border-radius: 4px;',
    '      cursor: pointer;',
    '      font-size: 0.9rem;',
    '      transition: background 0.3s ease;',
    '    }',
    
    '    .copy-btn:hover {',
    '      background: #2980b9;',
    '    }',
    
    '    .copy-btn.copied {',
    '      background: #27ae60;',
    '    }',
    '</style>',
    '</head>',
    '<body>',
    '<button class="sidebar-toggle" id="sidebarToggle">⚙️ Token设置</button>',
    '<div class="sidebar" id="sidebar">',
    '<div class="sidebar-header">',
    '<h2>Token 管理</h2>',
    '<button class="close-sidebar" id="closeSidebar">×</button>',
    '</div>',
    '<div class="token-section">',
    '<label for="tokenInput">输入Token</label>',
    '<textarea id="tokenInput" placeholder="输入Token，多个Token请用英文逗号分隔" rows="4"></textarea>',
    '<button class="save-btn" id="saveTokens">保存 Token</button>',
    '</div>',
    '<div class="token-list" id="tokenList"></div>',
    '</div>',
    
    '<div class="container">',
    '<h1>智能图片识别</h1>',
    '<div class="upload-area" id="uploadArea">',
    '<i>📸</i>',
    '<div class="upload-text">',
    '拖拽图片到这里，或点击上传<br>',
    '支持复制粘贴图片',
    '</div>',
    '<img id="previewImage" class="preview-image">',
    '</div>',
    '<div class="loading" id="loading"></div>',
    '<div class="result-container" id="resultContainer">',
    '<div class="result-header">',
    '<span>识别结果</span>',
    '<button class="copy-btn" id="copyBtn">复制结果</button>',
    '</div>',
    '<div class="result" id="result"></div>',
    '</div>',
    '<button class="history-toggle" id="historyToggle">📋 识别历史</button>',
    '<div class="history-sidebar" id="historySidebar">',
    '<h2>识别历史</h2>',
    '<div id="historyList"></div>',
    '</div>',
    '</div>',
    
    '<div id="imageModal" class="modal">',
    '<img class="modal-content" id="modalImage">',
    '</div>',
    
    '<script>',
    '    // 首先定义类',
    '    function HistoryManager() {',
    '      this.maxHistory = 10;',
    '    }',
    
    '    // 添加原型方法',
    '    HistoryManager.prototype.getHistoryKey = function(token) {',
    '      return \'imageRecognition_history_\' + token;',
    '    };',
    
    '    HistoryManager.prototype.loadHistory = function(token) {',
    '      const history = localStorage.getItem(this.getHistoryKey(token));',
    '      return history ? JSON.parse(history) : [];',
    '    };',
    
    '    HistoryManager.prototype.saveHistory = function(token, history) {',
    '      localStorage.setItem(this.getHistoryKey(token), JSON.stringify(history));',
    '    };',
    
    '    HistoryManager.prototype.addHistory = function(token, imageData, result) {',
    '      const history = this.loadHistory(token);',
    '      const newRecord = {',
    '        image: imageData,',
    '        result: result,',
    '        timestamp: new Date().toISOString()',
    '      };',
    
    '      history.unshift(newRecord);',
    '      if (history.length > this.maxHistory) {',
    '        history.pop();',
    '      }',
    
    '      this.saveHistory(token, history);',
    '      this.displayHistory(token);',
    '    };',
    
    '    HistoryManager.prototype.displayHistory = function(token) {',
    '      const history = this.loadHistory(token);',
          
    '      if (history.length === 0) {',
    '        historyList.innerHTML = \'<div class="no-history">暂无识别历史</div>\';',
    '        return;',
    '      }',
    
    '      var html = \'\';',
    '      for (var i = 0; i < history.length; i++) {',
    '        var record = history[i];',
    '        html += \'<div class="history-item">\';',
    '        html += \'<img src="\' + record.image + \'" class="history-image" alt="历史图片" onclick="showFullImage(this.src)">\';',
    '        html += \'<div class="history-content">\';',
    '        html += \'<div class="history-text">\' + record.result + \'</div>\';',
    '        html += \'<div class="history-time">\' + new Date(record.timestamp).toLocaleString() + \'</div>\';',
    '        html += \'</div></div>\';',
    '      }',
    '      historyList.innerHTML = html;',
    '    };',
    
    '    // 初始化变量',
    '    const uploadArea = document.getElementById(\'uploadArea\');',
    '    const tokensInput = document.getElementById(\'tokenInput\');',
    '    const resultDiv = document.getElementById(\'result\');',
    '    const resultContainer = document.getElementById(\'resultContainer\');',
    '    const loading = document.getElementById(\'loading\');',
    '    const previewImage = document.getElementById(\'previewImage\');',
    '    const historyList = document.getElementById(\'historyList\');',
    '    const sidebar = document.getElementById(\'sidebar\');',
    '    const sidebarToggle = document.getElementById(\'sidebarToggle\');',
    '    const tokenInput = document.getElementById(\'tokenInput\');',
    '    const saveTokensBtn = document.getElementById(\'saveTokens\');',
    '    const tokenList = document.getElementById(\'tokenList\');',
    '    const historySidebar = document.getElementById(\'historySidebar\');',
    '    const historyToggle = document.getElementById(\'historyToggle\');',
    
    '    let currentToken = \'\';',
    '    let tokens = [];',
    '    const historyManager = new HistoryManager();',
    
    '    // 从localStorage加载保存的tokens',
    '    function loadTokens() {',
    '      const savedTokens = localStorage.getItem(\'imageRecognitionTokens\');',
    '      if (savedTokens) {',
    '        tokens = savedTokens.split(\',\');',
    '        updateTokenList();',
    '        if (tokens.length > 0) {',
    '          currentToken = tokens[0];',
    '        }',
    '      }',
    '    }',
    
    '    // 修改 updateTokenList 函数',
    '    function updateTokenList() {',
    '      tokenList.innerHTML = "";',
    '      tokens.forEach(function(token, index) {',
    '        var truncatedToken = token.slice(0, 10) + "..." + token.slice(-10);',
    '        var div = document.createElement("div");',
    '        div.className = "token-item" + (token === currentToken ? " active" : "");',
    '        div.textContent = "Token " + (index + 1) + ": " + truncatedToken;',
    '        div.addEventListener("click", function() {',
    '          document.querySelectorAll(".token-item").forEach(item => item.classList.remove("active"));',
    '          div.classList.add("active");',
    '          currentToken = token;',
    '          historyManager.displayHistory(currentToken);',
    '        });',
    '        tokenList.appendChild(div);',
    '      });',
    '      tokenInput.value = tokens.join(",");',
    '    }',
    
    '    // 保存tokens',
    '    saveTokensBtn.addEventListener(\'click\', () => {',
    '      const inputTokens = tokenInput.value.split(\',\').map(t => t.trim()).filter(t => t);',
    '      if (inputTokens.length > 0) {',
    '        tokens = inputTokens;',
    '        localStorage.setItem(\'imageRecognitionTokens\', tokens.join(\',\'));',
    '        updateTokenList();',
    '        currentToken = tokens[0];',
    '        alert(\'Tokens已保存\');',
    '      } else {',
    '        alert(\'请至少输入一个有效的Token\');',
    '      }',
    '    });',
    
    '    // 侧边栏开关',
    '    sidebarToggle.addEventListener(\'click\', () => {',
    '      sidebar.classList.toggle(\'open\');',
    '    });',
    
    '    // 处理文件上传和识别',
    '    async function processImage(file) {',
    '      if (!currentToken) {',
    '        alert(\'请先设置并选择一个Token\');',
    '        sidebar.classList.add(\'open\');',
    '        return;',
    '      }',
    
    '      // 显示图片预览',
    '      const reader = new FileReader();',
    '      let imageData;',
    '      reader.onload = (e) => {',
    '        imageData = e.target.result;',
    '        previewImage.src = imageData;',
    '        previewImage.style.display = \'block\';',
    '      };',
    '      reader.readAsDataURL(file);',
    
    '      // 显示加载动画',
    '      loading.style.display = \'block\';',
    '      resultContainer.classList.remove(\'show\');',
    
    '      try {',
    '        // 上传文件',
    '        const formData = new FormData();',
    '        formData.append(\'file\', file);',
    
    '        const uploadResponse = await fetch(\'https://chat.qwenlm.ai/api/v1/files/\', {',
    '          method: \'POST\',',
    '          headers: {',
    '            \'accept\': \'application/json\',',
    '            \'authorization\': \'Bearer \' + currentToken,',
    '          },',
    '          body: formData,',
    '        });',
    
    '        const uploadData = await uploadResponse.json();',
    '        if (!uploadData.id) throw new Error(\'文件上传失败\');',
    
    '        // 识别图片',
    '        const recognizeResponse = await fetch(\'/recognize\', {',
    '          method: \'POST\',',
    '          headers: { \'Content-Type\': \'application/json\' },',
    '          body: JSON.stringify({ ', 
    '            token: currentToken, ', 
    '            imageId: uploadData.id ', 
    '          }),',
    '        });',
    
    '        const recognizeData = await recognizeResponse.json();',
            
    '        // 提取并显示识别结果',
    '        const result = recognizeData.choices[0]?.message?.content || \'识别失败\';',
    '        resultDiv.innerHTML = result;',  // 使用innerHTML而不是textContent以支持公式渲染
    '        MathJax.typesetPromise([resultDiv]).then(() => {',  // 渲染数学公式
    '          resultContainer.classList.add(\'show\');',
    '        });',
    
    '        // 添加到历史记录',
    '        historyManager.addHistory(currentToken, imageData, result);',
    '      } catch (error) {',
    '        resultDiv.textContent = \'处理失败: \' + error.message;',
    '        resultContainer.classList.add(\'show\');',
    '        copyBtn.textContent = \'复制结果\';',
    '        copyBtn.classList.remove(\'copied\');',
    '      } finally {',
    '        loading.style.display = \'none\';',
    '      }',
    '    }',
    
    '    // 文件拖放处理',
    '    uploadArea.addEventListener(\'dragover\', (e) => {',
    '      e.preventDefault();',
    '      uploadArea.classList.add(\'dragover\');',
    '    });',
    
    '    uploadArea.addEventListener(\'dragleave\', () => {',
    '      uploadArea.classList.remove(\'dragover\');',
    '    });',
    
    '    uploadArea.addEventListener(\'drop\', (e) => {',
    '      e.preventDefault();',
    '      uploadArea.classList.remove(\'dragover\');',
    '      const file = e.dataTransfer.files[0];',
    '      if (file && file.type.startsWith(\'image/\')) {',
    '        processImage(file);',
    '      }',
    '    });',
    
    '    // 点击上传',
    '    uploadArea.addEventListener(\'click\', () => {',
    '      const input = document.createElement(\'input\');',
    '      input.type = \'file\';',
    '      input.accept = \'image/*\';',
    '      input.onchange = (e) => {',
    '        const file = e.target.files[0];',
    '        if (file) processImage(file);',
    '      };',
    '      input.click();',
    '    });',
    
    '    // 粘贴处理',
    '    document.addEventListener(\'paste\', (e) => {',
    '      const file = e.clipboardData.files[0];',
    '      if (file && file.type.startsWith(\'image/\')) {',
    '        processImage(file);',
    '      }',
    '    });',
    
    '    // 初始化',
    '    loadTokens();',
    '    if (currentToken) {',
    '      historyManager.displayHistory(currentToken);',
    '    }',
    
    '    const modal = document.getElementById(\'imageModal\');',
    '    const modalImg = document.getElementById(\'modalImage\');',
    
    '    function showFullImage(src) {',
    '      modal.style.display = "block";',
    '      modalImg.src = src;',
    '    }',
    
    '    // 点击模态框关闭',
    '    modal.onclick = function() {',
    '      modal.style.display = "none";',
    '    }',
    
    '    // ESC 键关闭模态框',
    '    document.addEventListener(\'keydown\', function(e) {',
    '      if (e.key === \'Escape\' && modal.style.display === \'block\') {',
    '        modal.style.display = \'none\';',
    '      }',
    '    });',
    
    '    // 左侧历史记录边栏开关',
    '    historyToggle.addEventListener(\'click\', () => {',
    '      historySidebar.classList.toggle(\'open\');',
    '    });',
    
    '    const copyBtn = document.getElementById(\'copyBtn\');',
    
    '    // 复制结果功能',
    '    copyBtn.addEventListener(\'click\', async () => {',
    '      const result = resultDiv.textContent;',
    '      try {',
    '        await navigator.clipboard.writeText(result);',
    '        copyBtn.textContent = \'已复制\';',
    '        copyBtn.classList.add(\'copied\');',
    '        setTimeout(() => {',
    '          copyBtn.textContent = \'复制结果\';',
    '          copyBtn.classList.remove(\'copied\');',
    '        }, 2000);',
    '      } catch (err) {',
    '        console.error(\'复制失败:\', err);',
    '      }',
    '    });',
    '    // 添加关闭侧边栏的功能',
    '    document.getElementById("closeSidebar").addEventListener("click", () => {',
    '      sidebar.classList.remove("open");',
    '    });',
    '</script>',
    '</body>',
    '</html>'
  ].join('\n');

  return html;
}
