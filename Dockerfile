# Stage 1: build React frontend
FROM node:18-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: build Flask back‑end
FROM python:3.11
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
# Copy built frontend from previous stage
COPY --from=frontend-build /app/frontend/build ./frontend/build/

EXPOSE 5000
CMD ["python", "-m", "flask", "--app", "weight_tracker", "run", "--host", "0.0.0.0", "--port", "5000"]
