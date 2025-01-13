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
   - 前往https://chat.qwenlm.ai/ 获取token:
     ![image](https://github.com/user-attachments/assets/125f702e-856b-4a11-b5da-8df654ac8b7e)

   - 点击右上角的 **⚙️ Token设置** 按钮。
   - 输入你的 QwenLM API Token（多个 Token 用英文逗号分隔）。
   - 点击 **保存**。

3. **上传图片**：
   - 拖拽图片到页面，或点击上传区域选择图片。
   - 支持直接粘贴图片。

4. **查看结果**：
   - 识别结果会显示在页面下方。
   - 点击 **复制结果** 按钮，将识别内容复制到剪贴板。

5. **查看历史记录**：
   - 点击左侧的 **📋 识别历史** 按钮，查看历史识别记录。
   - 点击历史记录中的图片，可以查看大图。



## 📜 许可证

本项目基于 MIT 许可证开源。详情请查看 [LICENSE](LICENSE) 文件。

## 🙏 致谢

- 感谢 [QwenLM](https://chat.qwenlm.ai/) 提供的 OCR 功能。
- 感谢 Cloudflare 提供的 Workers 服务。
- 感谢 @lonelykkk的思路支持


---

🌟 如果觉得这个项目对你有帮助，欢迎点个 Star 支持一下！🌟
