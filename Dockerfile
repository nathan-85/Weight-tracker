FROM python:3.11-slim

# Install Node.js and npm
RUN apt-get update && apt-get install -y nodejs npm

# Set working directory
WORKDIR /app

# Copy application code
COPY . .

# Install Python dependencies
RUN pip install -r requirements.txt

# Install frontend dependencies and build
RUN cd frontend && npm install && npm run build

# Expose the port
EXPOSE $PORT

# Run the application using the proper WSGI entry point
CMD ["gunicorn", "-b", "0.0.0.0:$PORT", "wsgi:application"] 