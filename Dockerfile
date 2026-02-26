# Build Stage for Frontend
FROM node:22-alpine as frontend-build
ARG CACHE_BUST=2026-02-26-v5
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Runtime Stage for Backend
FROM python:3.11-slim
LABEL "language"="python"
LABEL "framework"="fastapi"
WORKDIR /app

# Install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/app ./app
COPY backend/init_db.py .

# Copy built frontend assets from previous stage
COPY --from=frontend-build /app/dist ./static

# Expose port
ENV PORT=8000
# 设置生产环境标识(logger.py 据此决定是否写文件日志)
ENV ENVIRONMENT=production
EXPOSE 8000

# Start command
# --limit-max-requests=1000: worker 处理 1000 个请求后自动重启,防止内存泄漏累积
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT} --limit-max-requests 1000"]
