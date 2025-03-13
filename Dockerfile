# 使用 Node.js 18 作为基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 安装 wrangler CLI
RUN npm install -g wrangler

# 复制项目文件
COPY . .

# 验证文件存在
RUN ls -la && echo "Checking for worker.js"

# 暴露端口
EXPOSE 8787

# 启动命令
CMD ["wrangler", "dev", "worker.js", "--local", "--port", "8787"] 