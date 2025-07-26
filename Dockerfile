# Dockerfile for Weight Tracker app
# Stage 1: Build React frontend
FROM node:18-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Build Python backend
FROM python:3.11-slim
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
WORKDIR /app

# Install Python dependencies
COPY requirements.txt ./
# RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Copy built frontend files into the Flask static folder
RUN rm -rf weight_tracker/frontend/build && \
    cp -r frontend/build weight_tracker/frontend/

# Expose port for Flask
EXPOSE 5000

# Run the Flask app
CMD ["python", "-m", "flask", "--app", "weight_tracker", "run", "--host", "0.0.0.0", "--port", "5000"]
