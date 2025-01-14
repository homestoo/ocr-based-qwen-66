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

  // API路由处理
  switch (url.pathname) {
    // 1. 通过图片URL识别
    case '/api/recognize/url':
      if (request.method === 'POST') {
        return handleImageUrlRecognition(request);
      }
      break;

    // 2. 通过Base64识别
    case '/api/recognize/base64':
      if (request.method === 'POST') {
        return handleBase64Recognition(request);
      }
      break;

    // 3. 通过图片文件识别 (原有的/recognize端点)
    case '/recognize':
      if (request.method === 'POST') {
        return handleFileRecognition(request);
      }
      break;

    // 返回前端界面
    case '/':
      return new Response(getHTML(), {
        headers: { 'Content-Type': 'text/html' },
      });
  }

  return new Response('Not Found', { status: 404 });
}

// 处理图片URL识别
async function handleImageUrlRecognition(request) {
  try {
    const { token, imageUrl } = await request.json();

    if (!token || !imageUrl) {
      return new Response(JSON.stringify({
        error: 'Missing token or imageUrl'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 下载图片
    const imageResponse = await fetch(imageUrl);
    const imageBlob = await imageResponse.blob();

    // 上传到QwenLM
    const formData = new FormData();
    formData.append('file', imageBlob);

    const uploadResponse = await fetch('https://chat.qwenlm.ai/api/v1/files/', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const uploadData = await uploadResponse.json();
    if (!uploadData.id) throw new Error('File upload failed');

    // 调用识别API
    return await recognizeImage(token, uploadData.id);
  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message || 'Internal Server Error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// 处理Base64识别
async function handleBase64Recognition(request) {
  try {
    const { token, base64Image } = await request.json();

    if (!token || !base64Image) {
      return new Response(JSON.stringify({
        error: 'Missing token or base64Image'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 转换Base64为Blob
    const imageData = base64Image.startsWith('data:') ?
      base64Image :
      'data:image/png;base64,' + base64Image;

    const response = await fetch(imageData);
    const blob = await response.blob();

    // 上传到QwenLM
    const formData = new FormData();
    formData.append('file', blob);

    const uploadResponse = await fetch('https://chat.qwenlm.ai/api/v1/files/', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const uploadData = await uploadResponse.json();
    if (!uploadData.id) throw new Error('File upload failed');

    // 调用识别API
    return await recognizeImage(token, uploadData.id);
  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message || 'Internal Server Error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// 处理文件识别 (原有功能)
async function handleFileRecognition(request) {
  try {
    const { token, imageId } = await request.json();

    if (!token || !imageId) {
      return new Response(JSON.stringify({
        error: 'Missing token or imageId'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return await recognizeImage(token, imageId);
  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message || 'Internal Server Error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// 通用的识别函数
async function recognizeImage(token, imageId) {
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
              text: '请识别图片中的内容，注意以下要求：\n' +
                    '对于数学公式和普通文本：\n' +
                    '1. 所有数学公式和数学符号都必须使用标准的LaTeX格式\n' +
                    '2. 行内公式使用单个$符号包裹，如：$x^2$\n' +
                    '3. 独立公式块使用两个$$符号包裹，如：$$\\sum_{i=1}^n i^2$$\n' +
                    '4. 普通文本保持原样，不要使用LaTeX格式\n' +
                    '5. 保持原文的段落格式和换行\n' +
                    '6. 明显的换行使用\\n表示\n' +
                    '7. 确保所有数学符号都被正确包裹在$或$$中\n\n' +
                    '对于验证码图片：\n' +
                    '1. 只输出验证码字符，不要加任何额外解释\n' +
                    '2. 忽略干扰线和噪点\n' +
                    '3. 注意区分相似字符，如0和O、1和l、2和Z等\n' +
                    '4. 验证码通常为4-6位字母数字组合\n\n' +
                    '不要输出任何额外的解释或说明'
            },
            { type: 'image', image: imageId },
          ],
        },
      ],
      session_id: '1',
      chat_id: '2',
      id: '3',
    }),
  });

  const data = await response.json();
  let result = data.choices[0]?.message?.content || '识别失败';

  // 如果结果长度小于10且只包含字母数字，很可能是验证码
  if (result.length <= 10 && /^[A-Za-z0-9]+$/.test(result)) {
    return new Response(JSON.stringify({
      success: true,
      result: result.toUpperCase(), // 验证码统一转大写
      type: 'captcha'
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  // 其他情况（数学公式和普通文本）的处理
  result = result
    .replace(/\\（/g, '\\(')
    .replace(/\\）/g, '\\)')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/([^\n])\n([^\n])/g, '$1\n$2')
    .replace(/\$\s+/g, '$')
    .replace(/\s+\$/g, '$')
    .replace(/\$\$/g, '$$')
    .trim();

  return new Response(JSON.stringify({
    success: true,
    result: result,
    type: 'text'
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

function getHTML() {
  const html = [
    '<!DOCTYPE html>',
    '<html lang="zh-CN">',
    '<head>',
    '<meta charset="UTF-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
    '<title>Qwen VL 智能识别系统</title>',

    // 添加 MathJax 支持
    '<script src="https://polyfill.io/v3/polyfill.min.js?features=es6"></script>',
    '<script>',
    'window.MathJax = {',
    '  tex: {',
    '    inlineMath: [["$", "$"]],',
    '    displayMath: [["$$", "$$"]]',
    '  },',
    '  startup: {',
    '    pageReady: () => {',
    '      return MathJax.startup.defaultPageReady().then(() => {',
    '        // MathJax 加载完成后刷新历史记录',
    '        if (currentToken) {',
    '          historyManager.displayHistory(currentToken);',
    '        }',
    '      });',
    '    }',
    '  },',
    '  options: {',
    '    enableMenu: false',
    '  }',
    '};',
    '</script>',
    '<script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>',
    '<script>',
    'function waitForMathJax(callback, maxTries = 30) {',
    '  let tries = 0;',
    '  const checkMathJax = () => {',
    '    tries++;',
    '    if (window.MathJax && window.MathJax.typesetPromise) {',
    '      callback();',
    '    } else if (tries < maxTries) {',
    '      setTimeout(checkMathJax, 100);',
    '    }',
    '  };',
    '  checkMathJax();',
    '}',
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
    '      padding-bottom: 4rem;',
    '      border-radius: 16px;',
    '      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);',
    '      width: 90%;',
    '      max-width: 800px;',
    '      transition: all 0.3s ease;',
    '    }',

    '    h1 {',
    '      color: #2c3e50;',
    '      margin-bottom: 0.5rem;',
    '      font-size: 2.2rem;',
    '      text-align: center;',
    '      font-weight: 700;',
    '      text-transform: uppercase;',
    '      letter-spacing: 2px;',
    '      background: linear-gradient(135deg, #1a5fb4 0%, #3498db 100%);',
    '      -webkit-background-clip: text;',
    '      -webkit-text-fill-color: transparent;',
    '      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);',
    '      position: relative;',
    '      padding-bottom: 10px;',
    '      animation: titleFadeIn 1s ease-out;',
    '    }',

    '    @keyframes titleFadeIn {',
    '      from {',
    '        opacity: 0;',
    '        transform: translateY(-20px);',
    '      }',
    '      to {',
    '        opacity: 1;',
    '        transform: translateY(0);',
    '      }',
    '    }',

    '    h1::after {',
    '      content: "";',
    '      position: absolute;',
    '      bottom: 0;',
    '      left: 50%;',
    '      transform: translateX(-50%);',
    '      width: 100px;',
    '      height: 3px;',
    '      background: linear-gradient(90deg, transparent, #3498db, transparent);',
    '    }',

    '    .subtitle {',
    '      color: #7f8c8d;',
    '      text-align: center;',
    '      font-size: 1.1rem;',
    '      margin-bottom: 1.5rem;',
    '      font-weight: 300;',
    '      letter-spacing: 1px;',
    '      opacity: 0.8;',
    '      animation: subtitleFadeIn 1s ease-out 0.3s both;',
    '    }',

    '    @keyframes subtitleFadeIn {',
    '      from {',
    '        opacity: 0;',
    '        transform: translateY(10px);',
    '      }',
    '      to {',
    '        opacity: 0.8;',
    '        transform: translateY(0);',
    '      }',
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
    '      left: -400px;',
    '      top: 0;',
    '      width: 400px;',
    '      height: 100vh;',
    '      background: rgba(255, 255, 255, 0.98);',
    '      backdrop-filter: blur(10px);',
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

    '    /* Base64输入相关样式 */',
    '    #base64Input {',
    '      width: 100%;',
    '      height: 100px;',
    '      padding: 10px;',
    '      margin-top: 10px;',
    '      border: 1px solid #dcdde1;',
    '      border-radius: 8px;',
    '      resize: vertical;',
    '    }',
    '    .toggle-btn {',
    '      background: #3498db;',
    '      color: white;',
    '      border: none;',
    '      padding: 8px 15px;',
    '      border-radius: 5px;',
    '      cursor: pointer;',
    '      margin-top: 10px;',
    '      transition: background 0.3s ease;',
    '    }',
    '    .toggle-btn:hover {',
    '      background: #2980b9;',
    '    }',

    '    /* 修改历史记录侧边栏样式 */',
    '    .history-item {',
    '      background: #ffffff;',
    '      border-radius: 12px;',
    '      margin-bottom: 20px;',
    '      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);',
    '      overflow: hidden;',
    '      transition: transform 0.2s ease, box-shadow 0.2s ease;',
    '    }',

    '    .history-item:hover {',
    '      transform: translateY(-2px);',
    '      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);',
    '    }',

    '    .history-image-container {',
    '      position: relative;',
    '      width: 100%;',
    '      height: 200px;',
    '      overflow: hidden;',
    '    }',

    '    .history-image {',
    '      width: 100%;',
    '      height: 100%;',
    '      object-fit: cover;',
    '      transition: transform 0.3s ease;',
    '    }',

    '    .image-overlay {',
    '      position: absolute;',
    '      top: 0;',
    '      left: 0;',
    '      width: 100%;',
    '      height: 100%;',
    '      background: rgba(0, 0, 0, 0.4);',
    '      display: flex;',
    '      justify-content: center;',
    '      align-items: center;',
    '      opacity: 0;',
    '      transition: opacity 0.3s ease;',
    '    }',

    '    .history-image-container:hover .image-overlay {',
    '      opacity: 1;',
    '    }',

    '    .history-image-container:hover .history-image {',
    '      transform: scale(1.05);',
    '    }',

    '    .overlay-btn {',
    '      background: rgba(255, 255, 255, 0.9);',
    '      color: #2c3e50;',
    '      border: none;',
    '      padding: 8px 16px;',
    '      border-radius: 20px;',
    '      cursor: pointer;',
    '      font-size: 0.9rem;',
    '      transition: all 0.2s ease;',
    '    }',

    '    .overlay-btn:hover {',
    '      background: #ffffff;',
    '      transform: scale(1.05);',
    '    }',

    '    .history-content {',
    '      padding: 16px;',
    '    }',

    '    .history-header {',
    '      display: flex;',
    '      justify-content: space-between;',
    '      align-items: center;',
    '      margin-bottom: 12px;',
    '      padding-bottom: 12px;',
    '      border-bottom: 1px solid #eee;',
    '    }',

    '    .history-time {',
    '      color: #7f8c8d;',
    '      font-size: 0.9rem;',
    '    }',

    '    .history-actions {',
    '      display: flex;',
    '      gap: 8px;',
    '    }',

    '    .action-btn {',
    '      background: none;',
    '      border: 1px solid #e0e0e0;',
    '      padding: 4px 8px;',
    '      border-radius: 4px;',
    '      cursor: pointer;',
    '      font-size: 0.8rem;',
    '      transition: all 0.2s ease;',
    '    }',

    '    .action-btn.copy-btn {',
    '      color: #3498db;',
    '    }',

    '    .action-btn.delete-btn {',
    '      color: #e74c3c;',
    '    }',

    '    .action-btn:hover {',
    '      background: #f8f9fa;',
    '      transform: translateY(-1px);',
    '    }',

    '    .history-text {',
    '      color: #2c3e50;',
    '      font-size: 0.95rem;',
    '      line-height: 1.6;',
    '      max-height: 200px;',
    '      overflow-y: auto;',
    '      padding-right: 8px;',
    '    }',

    '    .history-text::-webkit-scrollbar {',
    '      width: 4px;',
    '    }',

    '    .history-text::-webkit-scrollbar-track {',
    '      background: #f1f1f1;',
    '    }',

    '    .history-text::-webkit-scrollbar-thumb {',
    '      background: #c0c0c0;',
    '      border-radius: 2px;',
    '    }',

    '    .footer {',
    '      position: fixed;',
    '      bottom: 0;',
    '      left: 0;',
    '      width: 100%;',
    '      padding: 15px;',
    '      text-align: center;',
    '      background: rgba(255, 255, 255, 0.9);',
    '      backdrop-filter: blur(5px);',
    '      z-index: 900;',
    '      border-top: 1px solid rgba(0, 0, 0, 0.1);',
    '    }',

    '    .powered-by {',
    '      color: #7f8c8d;',
    '      font-size: 0.9rem;',
    '    }',

    '    .powered-by a {',
    '      color: #3498db;',
    '      text-decoration: none;',
    '      transition: color 0.3s ease;',
    '      font-weight: 500;',
    '    }',

    '    .powered-by a:hover {',
    '      color: #2980b9;',
    '    }',

    '    .footer-content {',
    '      margin-top: 2rem;',
    '      padding-top: 1rem;',
    '      border-top: 1px solid #eee;',
    '      text-align: center;',
    '    }',

    '    .powered-by {',
    '      color: #7f8c8d;',
    '      font-size: 0.9rem;',
    '    }',

    '    .powered-by a {',
    '      color: #3498db;',
    '      text-decoration: none;',
    '      transition: color 0.3s ease;',
    '      font-weight: 500;',
    '    }',

    '    .powered-by a:hover {',
    '      color: #2980b9;',
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
    '<h1>Qwen VL 智能识别系统</h1>',
    '<div class="subtitle">基于通义千问大模型的多模态智能识别引擎</div>',
    '<div class="upload-area" id="uploadArea">',
    '<i>📸</i>',
    '<div class="upload-text">',
    '拖拽图片到这里，点击上传，或粘贴Base64图片内容<br>',
    '支持复制粘贴图片',
    '</div>',
    '<textarea id="base64Input" placeholder="在此输入Base64格式的图片内容..." style="display: none; width: 100%; height: 100px; margin-top: 10px;"></textarea>',
    '<button id="toggleBase64" class="toggle-btn" style="margin-top: 10px;">切换Base64输入</button>',
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
    '<div class="footer-content">',
    '<div class="powered-by">',
    '由 <a href="https://chat.qwenlm.ai/" target="_blank" rel="noopener noreferrer">Qwen VL</a> 提供支持，一切仅用于学习使用！',
    '</div>',
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
    '      history.forEach((record, i) => {',
    '        // 确保 image 数据存在且格式正确',
    '        const imageUrl = record.image && (',
    '          record.image.startsWith(\'data:\') ? ',
    '          record.image : ',
    '          `data:image/png;base64,${record.image}`',
    '        );',

    '        const timestamp = new Date(record.timestamp);',
    '        const timeStr = timestamp.toLocaleString(\'zh-CN\', {',
    '          year: \'numeric\',',
    '          month: \'2-digit\',',
    '          day: \'2-digit\',',
    '          hour: \'2-digit\',',
    '          minute: \'2-digit\'',
    '        });',

    '        html += `',
    '          <div class="history-item" data-index="${i}">',
    '            <div class="history-image-container">',
    '              <img src="${imageUrl}" ',
    '                   class="history-image" ',
    '                   alt="历史图片" ',
    '                   onerror="this.src=\'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=\'"',
    '                   onclick="event.stopPropagation(); showFullImage(\'${imageUrl}\')">',
    '              <div class="image-overlay">',
    '                <button class="overlay-btn" onclick="event.stopPropagation(); showFullImage(\'${imageUrl}\')">查看大图</button>',
    '              </div>',
    '            </div>',
    '            <div class="history-content">',
    '              <div class="history-header">',
    '                <span class="history-time">${timeStr}</span>',
    '                <div class="history-actions">',
    '                  <button class="action-btn copy-btn" onclick="event.stopPropagation(); copyHistoryResult(${i}, this)">复制结果</button>',
    '                  <button class="action-btn delete-btn" onclick="event.stopPropagation(); deleteHistoryItem(${i})">删除</button>',
    '                </div>',
    '              </div>',
    '              <div class="history-text">${record.result || \'无识别结果\'}</div>',
    '            </div>',
    '          </div>',
    '        `;',
    '      });',

    '      historyList.innerHTML = html;',

    '      // 使用 waitForMathJax 函数处理公式渲染',
    '      waitForMathJax(() => {',
    '        try {',
    '          MathJax.typesetPromise([historyList])',
    '            .catch(err => console.error("MathJax渲染错误:", err));',
    '        } catch (err) {',
    '          console.error("MathJax处理错误:", err);',
    '        }',
    '      });',
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

    '        // 修改这里：使用新的响应格式',
    '        if (!recognizeData.success) {',
    '          throw new Error(recognizeData.error || \'识别失败\');',
    '        }',

    '        const result = recognizeData.result || \'识别失败\';',
    '        // 保存原始文本到属性中，确保 LaTeX 格式完整',
    '        const formattedResult = result',
    '          .replace(/\$\$(.*?)\$\$/g, (_, formula) => `$${formula}$$`)',
    '          .replace(/\$([^$]+)\$/g, (_, formula) => `$${formula}$`);',

    '        resultDiv.setAttribute(\'data-original-text\', formattedResult);',
    '        resultDiv.innerHTML = result;',
    '        waitForMathJax(() => {',
    '          try {',
    '            MathJax.typesetPromise([resultDiv])',
    '              .then(() => {',
    '                resultContainer.classList.add(\'show\');',
    '              })',
    '              .catch(err => {',
    '                console.error("MathJax渲染错误:", err);',
    '                resultContainer.classList.add(\'show\');',
    '              });',
    '          } catch (err) {',
    '            console.error("MathJax处理错误:", err);',
    '            resultContainer.classList.add(\'show\');',
    '          }',
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
    '    uploadArea.addEventListener(\'click\', (e) => {',
    '      // 如果点击的是 base64Input 或 toggleBase64 按钮，不触发文件上传',
    '      if (e.target.id === \'base64Input\' || ',
    '          e.target.id === \'toggleBase64\' || ',
    '          e.target.closest(\'#base64Input\') || ',
    '          e.target.closest(\'#toggleBase64\')) {',
    '        return;',
    '      }',

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
    '      const modal = document.getElementById(\'imageModal\');',
    '      const modalImg = document.getElementById(\'modalImage\');',

    '      if (!src) {',
    '        console.error(\'图片源为空\');',
    '        return;',
    '      }',

    '      modal.style.display = \'block\';',
    '      modalImg.src = src;',

    '      // 添加加载错误处理',
    '      modalImg.onerror = function() {',
    '        alert(\'图片加载失败\');',
    '        modal.style.display = \'none\';',
    '      };',

    '      modalImg.style.opacity = \'0\';',
    '      setTimeout(() => {',
    '        modalImg.style.transition = \'opacity 0.3s ease\';',
    '        modalImg.style.opacity = \'1\';',
    '      }, 50);',
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

    '    // 修改复制结果功能，保持完整的 LaTeX 格式',
    '    copyBtn.addEventListener(\'click\', async () => {',
    '      // 获取原始文本（包含完整的 LaTeX 格式）',
    '      const result = resultDiv.getAttribute(\'data-original-text\');',
    '      if (!result) return;',

    '      try {',
    '        // 直接复制包含 LaTeX 标记的文本',
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

    '    // Base64 输入相关功能',
    '    const base64Input = document.getElementById(\'base64Input\');',
    '    const toggleBase64 = document.getElementById(\'toggleBase64\');',

    '    // 切换 Base64 输入框显示',
    '    toggleBase64.addEventListener(\'click\', (e) => {',
    '      e.stopPropagation(); // 阻止事件冒泡到 uploadArea',
    '      if (base64Input.style.display === \'none\') {',
    '        base64Input.style.display = \'block\';',
    '        toggleBase64.textContent = \'隐藏Base64输入\';',
    '      } else {',
    '        base64Input.style.display = \'none\';',
    '        toggleBase64.textContent = \'切换Base64输入\';',
    '      }',
    '    });',

    '    // 为 base64Input 添加阻止事件冒泡',
    '    document.getElementById(\'base64Input\').addEventListener(\'click\', (e) => {',
    '      e.stopPropagation(); // 阻止事件冒泡到 uploadArea',
    '    });',

    '    // base64Input 的 input 事件处理也需要阻止冒泡',
    '    base64Input.addEventListener(\'input\', async (e) => {',
    '      e.stopPropagation();',
    '      const base64Content = base64Input.value.trim();',
    '      if (base64Content) {',
    '        try {',
    '          // 尝试转换Base64为Blob',
    '          let imageData;',
    '          if (base64Content.startsWith(\'data:image\')) {',
    '            imageData = base64Content;',
    '          } else {',
    '            imageData = \'data:image/png;base64,\' + base64Content;',
    '          }',

    '          // 验证Base64是否为有效图片',
    '          const img = new Image();',
    '          img.src = imageData;',
    '          await new Promise((resolve, reject) => {',
    '            img.onload = resolve;',
    '            img.onerror = reject;',
    '          });',

    '          // 转换Base64为Blob',
    '          const response = await fetch(imageData);',
    '          const blob = await response.blob();',
    '          const file = new File([blob], "image.png", { type: "image/png" });',

    '          // 显示预览',
    '          previewImage.src = imageData;',
    '          previewImage.style.display = \'block\';',

    '          // 处理图片',
    '          await processImage(file);',
    '        } catch (error) {',
    '          resultDiv.textContent = \'处理失败: \' + error.message;',
    '          resultContainer.classList.add(\'show\');',
    '          console.error(\'Base64处理错误:\', error);',
    '        }',
    '      }',
    '    });',

    '    // 复制历史记录结果，保持完整的 LaTeX 格式',
    '    async function copyHistoryResult(index, btn) {',
    '      try {',
    '        const history = historyManager.loadHistory(currentToken);',
    '        const result = history[index]?.result;',

    '        if (!result) {',
    '          throw new Error(\'无法复制：结果为空\');',
    '        }',

    '        // 使用临时输入框来执行复制',
    '        const tempInput = document.createElement(\'textarea\');',
    '        tempInput.value = result;',
    '        document.body.appendChild(tempInput);',
    '        tempInput.select();',
        
    '        // 尝试使用 execCommand 作为后备方案',
    '        if (!navigator.clipboard) {',
    '          document.execCommand("copy");',
    '          tempInput.remove();',
    '        } else {',
    '          // 优先使用 clipboard API',
    '          await navigator.clipboard.writeText(result);',
    '          tempInput.remove();',
    '        }',

    '        // 更新按钮状态 - 使用传入的按钮元素',
    '        btn.textContent = \'已复制\';',
    '        btn.classList.add(\'copied\');',
        
    '        setTimeout(() => {',
    '          btn.textContent = \'复制结果\';',
    '          btn.classList.remove(\'copied\');',
    '        }, 2000);',
        
    '        return true;',
    '      } catch (err) {',
    '        console.error(\'复制失败:\', err);',
    '        alert(\'复制失败: \' + err.message);',
    '        return false;',
    '      }',
    '    }',

    '    // 删除历史记录项',
    '    function deleteHistoryItem(index) {',
    '      const history = historyManager.loadHistory(currentToken);',
    '      if (!history[index]) {',
    '        alert(\'该记录不存在\');',
    '        return;',
    '      }',

    '      if (confirm(\'确定要删除这条历史记录吗？\')) {',
    '        history.splice(index, 1);',
    '        historyManager.saveHistory(currentToken, history);',
    '        historyManager.displayHistory(currentToken);',
    '      }',
    '    }',
    '</script>',
    '</body>',
    '</html>'
  ].join('\n');

  return html;
}

