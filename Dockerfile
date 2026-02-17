# Build Stage for Frontend
FROM node:22-alpine as frontend-build
# Force rebuild by adding a build argument
ARG CACHE_BUST=2026-01-27-v3
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Runtime Stage for Backend
FROM python:3.11-slim
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
EXPOSE 8000

# Start command
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
