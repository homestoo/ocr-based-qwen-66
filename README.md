# 🖼️ QwenLM OCR 逆向工程项目

本项目是对 [QwenLM](https://chat.qwenlm.ai/) 的 OCR 功能进行逆向工程的实现。通过调用 QwenLM 的 API，你可以从图片中提取文字内容，并且该项目支持一键部署到 **Cloudflare Workers** (CF) 上。

## 项目展示
![image](https://github.com/user-attachments/assets/0805489b-b5b2-454b-a46d-31c005113ca6)

## 🚀 功能特性

- **图片 OCR**：使用 QwenLM 强大的 OCR 功能从图片中提取文字。
- **拖拽上传**：直接将图片拖拽到页面即可识别。
- **复制粘贴**：支持从剪贴板直接粘贴图片进行识别。
- **Token 管理**：支持多 Token 轮询使用，提升稳定性。
- **历史记录**：保存每次识别的结果和图片，方便查看。
- **一键复制**：轻松复制识别结果到剪贴板。
- **数学公式识别**：特别优化了对数学公式的提取，支持 LaTeX 格式输出。
- **API 支持**：提供 `curl` 接口调用，支持 base64 和图片 URL 两种方式。

## 🛠️ 部署指南

### 1. 部署到 Cloudflare Workers

1. **配置 Cloudflare Workers**：
   - 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)。
   - 创建一个新的 Worker。
   - 将 `worker.js` 中的代码复制到 Worker 编辑器中。

2. **部署**：
   - 保存并部署 Worker。
   - 获取 Worker 的访问地址，即可使用。

## 🧩 使用说明

1. **设置 Token**：
   - 前往 [QwenLM](https://chat.qwenlm.ai/) 获取 Token。
   - 点击右上角的 **⚙️ Token设置** 按钮。
   - 输入你的 QwenLM API Token（多个 Token 用英文逗号分隔）。
   - 点击 **保存**。

2. **上传图片**：
   - 拖拽图片到页面，或点击上传区域选择图片。
   - 支持直接粘贴图片。

3. **查看结果**：
   - 识别结果会显示在页面下方。
   - 点击 **复制结果** 按钮，将识别内容复制到剪贴板。

4. **查看历史记录**：
   - 点击左侧的 **📋 识别历史** 按钮，查看历史识别记录。
   - 点击历史记录中的图片，可以查看大图。

5. **API 调用**：
   - **支持 base64**：
     ```bash
     curl --location 'https://ocr.doublefenzhuan.me/api/recognize/base64' \
     --header 'Content-Type: application/json' \
     --data '{
         "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjUzZTk0Nzg4LWMwM2QtNDY4Mi05OTNhLWE0ZDNjNGUyZDY0OSIsImV4cCI6MTczOTA3NTE0MX0.FtwG6xDLYd2rngWUhuldg56WXCiLSTL0RI6xJJQ4vHM",
         "base64Image": "xxx"
     }'
     ```
   - **支持图片 URL**:
     ```bash
     curl --location 'https://ocr.doublefenzhuan.me/api/recognize/url' \
     --header 'Content-Type: application/json' \
     --data '{
         "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjUzZTk0Nzg4LWMwM2QtNDY4Mi05OTNhLWE0ZDNjNGUyZDY0OSIsImV4cCI6MTczOTA3NTE0MX0.FtwG6xDLYd2rngWUhuldg56WXCiLSTL0RI6xJJQ4vHM",
         "imageUrl": "xxxx"
     }'
     ```

## 📜 许可证

本项目基于 MIT 许可证开源。详情请查看 [LICENSE](LICENSE) 文件。

## 🙏 致谢

- 感谢 [QwenLM](https://chat.qwenlm.ai/) 提供的 OCR 功能。
- 感谢 Cloudflare 提供的 Workers 服务。

---

🌟 如果觉得这个项目对你有帮助，欢迎点个 Star 支持一下！🌟

**体验地址**：[智能图片识别 (doublefenzhuan.me)](https://ocr.doublefenzhuan.me/)

**GitHub 仓库**：[Cunninger/ocr-based-qwen](https://github.com/Cunninger/ocr-based-qwen)

---

#### 后续计划
- 优化数学公式识别精度；
- 增加更多 API 功能支持；
- 提升识别速度和稳定性。

快来体验吧！如果有任何问题或建议，欢迎在 GitHub 上提 Issue 或直接联系我！

## 更新
### 2025/01/13 应佬友需求，优化了对数学公式的识别，效果如下图
  - 原图：
    
![image|690x401, 75%](upload://jsL7sKDLKKP4xpNNgm9kHXq7qdD.png)
  识别效果图：
  ![image|536x500](upload://1mLEmxYZ3MPl0DvMsLSz7noQb4i.png)

### 2025/01/13 18点34分 支持`curl`接口调用
- **支持base64**：
```
curl --location 'https://ocr.doublefenzhuan.me/api/recognize/base64' \
--header 'Content-Type: application/json' \
--data '{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjUzZTk0Nzg4LWMwM2QtNDY4Mi05OTNhLWE0ZDNjNGUyZDY0OSIsImV4cCI6MTczOTA3NTE0MX0.FtwG6xDLYd2rngWUhuldg56WXCiLSTL0RI6xJJQ4vHM",
    "base64Image": "xxx"
}'
```
- 效果图：
![image](https://github.com/user-attachments/assets/ef160aae-e741-49d3-96f0-a0969b883f1a)

- **支持图片URL**:
```bash
curl --location 'https://ocr.doublefenzhuan.me/api/recognize/url' \
--header 'Content-Type: application/json' \
--data '{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjUzZTk0Nzg4LWMwM2QtNDY4Mi05OTNhLWE0ZDNjNGUyZDY0OSIsImV4cCI6MTczOTA3NTE0MX0.FtwG6xDLYd2rngWUhuldg56WXCiLSTL0RI6xJJQ4vHM",
    
     "imageUrl": "xxxx"
}'
```
- 效果图：
![image](https://github.com/user-attachments/assets/db0c89f9-96f1-45b1-b1e9-88ac3d01e196)
