<div align="center"> <img src="https://github.com/Cunninger/ocr-based-qwen/blob/main/ocr.png?raw=true" width="120"> </div>



#               QwenLM OCR 


本项目基于 [QwenLM](https://chat.qwenlm.ai/) 。通过调用 QwenLM 的 ”API“，你可以从图片中提取文字内容，并且该项目支持一键部署到 **Cloudflare Workers** (CF) 上。

## 项目展示
![screely-1743379867339](https://github.com/user-attachments/assets/ad25719c-0504-4bc1-926f-4bffeb6b745d)


## 测试cookie
- 如果出现**处理失败: 文件上传失败的错误**，说明测试Cookie 上传文件过多, 尝试获取自己账号的Cookie 使用
```
{
    "code": "RateLimited",
    "detail": "Reached file upload limited: too many files uploaded in (86400.0) seconds."
}
```

![image](https://github.com/user-attachments/assets/5251feec-3fdc-4003-82b5-a273a3abb9f2)
- cookie1:
```txt
_gcl_au=1.1.1128300923.1746849193; _bl_uid=m1mL2atCh8Cot5wsRoIFbqdhm7tg; xlly_s=1; cna=qrulIGTI1xgCAbZmOSlWpOi2; cnaui=53e94788-c03d-4682-993a-a4d3c4e2d649; aui=53e94788-c03d-4682-993a-a4d3c4e2d649; acw_tc=0a03e55a17471050174934469e5698d16b1ed504f9e9c68f410d550889e99b; x-ap=ap-southeast-1; sca=54887197; atpsida=3cac89c5d9360e40b62eb508_1747105020_1; ssxmod_itna=eqIxgDnQKYqDqOD4kxjxYKD5i=m6l40QDXDUqAjdGgDYq7=GF7DChzw1CDBKeZxv=t7iiHP4gRxGXxkKxiNDAxq0iDC8eQeOCmL+tGqFjmhtqqRZayb5zHF2Ghm85mnrZpswVMZYKwDCPDExGkeBvhwDiiax0rD0eDPxDYDGbaD7PDoxDrOIYDjYoICSEmQz4DKx0kDY5Dw1+mDYPDWxDFb+DktYEwbDDCDivfV83DixiaaSDDBg0u4pxmtDi3bUOGjz+LxT0IhooD9E4Ds6xgl/kgvMiAkS17Wvewff3DvxDk2IgGUtTpwfTo+8ZxxohxY7eChxO7ek7orYqoD4aYhoA4ti517qoldaGQQDwolQChmw073QpCxxY+zyTsb+s/ke=eKn2tBjtwGYheYaYqpxoMA5VYYqr5OBQkDtaW5Q7q/2x4D; ssxmod_itna2=eqIxgDnQKYqDqOD4kxjxYKD5i=m6l40QDXDUqAjdGgDYq7=GF7DChzw1CDBKeZxv=t7iiHP4gKxDfrtK2nguI=5mwvNG4oIhfnAQPD; SERVERID=8d1f4d10c35f5d9c380a0c17580aeca9|1747105025|1747105017; token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjUzZTk0Nzg4LWMwM2QtNDY4Mi05OTNhLWE0ZDNjNGUyZDY0OSIsImV4cCI6MTc0OTY5NzAyNX0.MZ-Nmyq08Oy0vDR_PdWDpvq8bAfuA371KPA2fez8Qz0; isg=BNnZ9u4y1WqSC4nCppf6kGHW6MWzZs0YnUIs8PuOVYB_AvmUQ7bd6EcUBMZ0jmVQ; tfstk=gySjtnM1FjcXkNttCE2ydgAaio-_L8rehA9OKOnqBnKv1A1NpFpq0-b1P15XM16gnddO61ONuzrFntxMXWP_YkWc0MUDzitt_TKDQGHyzvEFntDRrOQ1nkk6PJ-6XCC9kU3JpQpxM1LvwUdkIdhvBme7FQvM6Kn9XULJ3pJ9XhCOe89MwKK9k1B-pmGeCRRfh-x3JMyTHBXvNcnO2lYXOt3ZXcIWhE6dHQ6PUg9XlBL9I3NdD_WO0iYuOXKGUw11W14Ern6OknpFnoiWvtQPfLSaQVOAig6R2UMEYh_AGNLhPk0HkFOfyiLSBcBkfaLd5sNjoIQVNevJyAZHU6RRniQ7IbBATItveUrLdTLOziYh07nXvwX20NCg84xfBZK54MmeOK3-5YTnfLOUF8giSdRn6tlqKjZvkLvXV8wSG3LvELOUF8giSEpkU4w7FjtR.
```
- cookie2:
```txt
cna=jVVkIH8WwiECAWrgu3Rh49BZ; _bl_uid=69m7O83qin4t1v50n9b33n9oge32; cnaui=1df8319d-47e8-4859-b77f-810584faec0f; aui=1df8319d-47e8-4859-b77f-810584faec0f; _gcl_au=1.1.505594525.1742563213.867342246.1745928027.1745928034; acw_tc=0a03e55f17471053364778166e659f6b4859f09675a78f141a3e9cc6228e4a; x-ap=ap-southeast-1; sca=73b49ddd; xlly_s=1; ssxmod_itna=GqGx9DyDuiiQYY5i7=YAKG7qDOG2ikDnQDBP01DphxQyK08D6DYqGdcFkmNhY=eF34oqrYqSnxGXKFYxiNDAxq0iDC+ejrenpBHw3354EhteeiAl0g5Ir825b40aFK48qiYoweGLDmKDyWiNxoxGGA4GwDGoD34DiDDPfD03Db4D+fjiD72r32WT5rePDQ4GyDiUti2rDm4DfDDd5qgD4CWroDDtDAuW1PPDADAfYoDDlYiO4mODKoDGWClR/iPptBahdZRrDjkPD/R40Xay05vGtXWkXGKoe=cWDtqD976RVSGIYVQu4htNhDoRYemid=weFio3AxqD4cbxKAGNnDIxYFAGqgt+EOeDNwrdGmexuGpWdhGi0kz9urBTsmAe0AxRotcme3DxRA+F0DqY45O5ZB5xrw3YhiD4bQvFiNeiDD; ssxmod_itna2=GqGx9DyDuiiQYY5i7=YAKG7qDOG2ikDnQDBP01DphxQyK08D6DYqGdcFkmNhY=eF34oqrYqSYxD3beY6jETIQkAw7Xsx58ixWUeeD; token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjFkZjgzMTlkLTQ3ZTgtNDg1OS1iNzdmLTgxMDU4NGZhZWMwZiIsImV4cCI6MTc0OTY5NzM0NH0.GCGFR6NI85QMmXtG6OjLxY0F1fze0XPdVBPRNzpTSh8; atpsida=005f535629829fb74bf7df34_1747105344_2; SERVERID=b98d56744b338696d8c13af9b400879a|1747105345|1747105336; tfstk=gU3jT81sNtXjChzO1oAzO4XwlWUsCQ8UG1NttfQV6rUYC1MZ9lFVuImsVAkbHAGMi5etBAwZ038Eij4gWpJ68el0KkXUGqaOQbU0_VCz46LEijf-qfnsie5_VBg_DRHTDuB8_8FY6PHTyaF_eZFOk5BJN82RkOeT6zE8_SIYBAU9Nbeu6PFxBodSwvQRL5OahjO0-hpQzn2jM8_OW4LgcJGAbNQtPSZj9jeSabu7GowLq1p3hqHr6qu0qp6LSboICcHMYg4j6mUYTjYfPyhx4VNr7CS_Hx0Sw4E5TwzsDxiTx0ThxoE_h03YV1QtZPi8vcMXhi2x0YZ3wuC6-7kUej0xVCX-Mvybk7EyJBG8X0u0xqJRlynngrotIHSulfnYPg5c8JNA2G17xNN7LQO5jGA7LQ7uzuiwwoFuGzOWNta8D7V7LQO5jGqYZ7SWNQ6by; isg=BIqKadcq1ueGLlW0I70ajFfB23Asew7VpeYBkBTDNl1oxyqB_Ate5dAx1zMbA4Zt
```
## 🚀 功能特性

- **图片 OCR**：使用 QwenLM 强大的 OCR 功能从图片中提取文字。
- **拖拽上传**：直接将图片拖拽到页面即可识别。
- **复制粘贴**：支持从剪贴板直接粘贴图片进行识别。
- **Token 管理**：支持多 Token 轮询使用，提升稳定性。
- **历史记录**：保存每次识别的结果和图片，方便查看。
- **一键复制**：轻松复制识别结果到剪贴板。
- **数学公式识别**：特别优化了对数学公式的提取，支持 LaTeX 格式输出。
- **API 支持**：提供 `curl` 接口调用，支持通过图片文件、base64 和图片 URL 3种方式。(Apifox调用文档示例(**仅作为代码示例，这个网页调试有问题**)：https://0vkh6v4ad8.apifox.cn/)
- **验证码识别**：新增验证码识别功能，支持常见类型的验证码（如数字、字母、混合字符等），提升自动化处理能力。
- **自定义prompt**: 在高级模式下(v1.1.0支持)，用户可以自定义 prompt，跳过格式化处理，直接返回原始结果，而在普通模式下，使用默认的 prompt 并保持现有的格式化处理逻辑。
## qwen模型接口：
https://chat.qwenlm.ai/api/models
## 提示词工程
```
  const defaultPrompt =
    '不要输出任何额外的解释或说明,禁止输出例如：识别内容、以上内容已严格按照要求进行格式化和转换等相关无意义的文字！' + '请识别图片中的内容，注意以下要求：\n' +
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
    '';
```
## 🛠️ 部署指南

### 1. 部署到 Cloudflare Workers

1. **配置 Cloudflare Workers**：
   - 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)。
   - 创建一个新的 Worker。
   - 将 `worker.js` 中的代码复制到 Worker 编辑器中。

2. **部署**：
   - 保存并部署 Worker。
   - 获取 Worker 的访问地址，即可使用。
### 2. Docker 一键部署
1. 使用以下命令拉取并运行Docker镜像。
```
docker pull sexgirls/qwen-ocr-app:latest
docker run -p 3000:3000 sexgirls/qwen-ocr-app:latest
```
2. 然后在浏览器中访问应用：
```
http://localhost:3000
```
详情可见：https://github.com/Cunninger/ocr-based-qwen/tree/docker-version
## 🧩 使用说明

1. **设置 Cookie**：
   - 前往 [QwenLM](https://chat.qwenlm.ai/) 获取对话请求中的 Cookie。
   ![alt text](image.png)

   - 点击右上角的 **⚙️ Cookie设置** 按钮。
   - 输入你的 Cookie（或者使用测试Cookie）。
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
      curl -X POST \
        'https://test-qwen-cor.aughumes8.workers.dev/api/recognize/base64' \
        -H 'Content-Type: application/json' \
        -H 'x-custom-cookie: YOUR_COOKIE_STRING' \
        -d '{
          "base64Image": "YOUR_BASE64_IMAGE_STRING"
        }'
     ```
   - **支持图片 URL**:
     ```bash
      curl -X POST \
        'https://test-qwen-cor.aughumes8.workers.dev/api/recognize/url' \
        -H 'Content-Type: application/json' \
        -H 'x-custom-cookie: YOUR_COOKIE_STRING' \
        -d '{
          "imageUrl": "YOUR_IMAGE_URL"
     }'
     ```
6. **验证码识别**
![image](https://github.com/user-attachments/assets/66f24d52-6263-446c-b371-cc2e65c9277c)


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
    
![image](https://github.com/user-attachments/assets/9841509d-be56-4eb9-aafa-4d4ca5555c2e)

- 识别效果图：
![image](https://github.com/user-attachments/assets/2340dc6d-9156-4866-aa53-cdfd1911a651)


### 2025/01/13 18点34分 支持`curl`接口调用
- **支持base64**：
```bash
curl -X POST \
  'https://test-qwen-cor.aughumes8.workers.dev/api/recognize/base64' \
  -H 'Content-Type: application/json' \
  -H 'x-custom-cookie: YOUR_COOKIE_STRING' \
  -d '{
    "base64Image": "YOUR_BASE64_IMAGE_STRING"
  }'
```
- 效果图：
![image](https://github.com/user-attachments/assets/363afb39-444b-4308-a2bd-55831df81b6f)

- **支持图片URL**:
```bash
curl -X POST \
  'https://test-qwen-cor.aughumes8.workers.dev/api/recognize/url' \
  -H 'Content-Type: application/json' \
  -H 'x-custom-cookie: YOUR_COOKIE_STRING' \
  -d '{
    "imageUrl": "YOUR_IMAGE_URL"
  }'
```
- 效果图：
![image](https://github.com/user-attachments/assets/a816085e-8a52-4425-b02c-94ea543bf95b)

- **通过图片文件识别（需要先上传获取imageId）**
```bash
# 1. 先上传文件
curl -X POST \
  'https://test-qwen-cor.aughumes8.workers.dev/proxy/upload' \
  -H 'x-custom-cookie: YOUR_COOKIE_STRING' \
  -F 'file=@/path/to/your/image.jpg'

# 2. 使用返回的imageId进行识别
curl -X POST \
  'https://test-qwen-cor.aughumes8.workers.dev/recognize' \
  -H 'Content-Type: application/json' \
  -H 'x-custom-cookie: YOUR_COOKIE_STRING' \
  -d '{
    "imageId": "RETURNED_IMAGE_ID"
  }'
```
## Cloudflare访问数据
![image](https://github.com/user-attachments/assets/bb456075-6107-47ee-a361-a0edba532c38)
## 致谢
![image](https://github.com/user-attachments/assets/cfc04290-6400-483d-b0a9-4dd4b409bab9)
## 趋势
[![Star History Chart](https://api.star-history.com/svg?repos=cunninger/ocr-based-qwen&type=Date)](https://star-history.com/#Cunninger/ocr-based-qwen&Date)
