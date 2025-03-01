#!/bin/bash

# Print header
echo "==============================================="
echo "   Running Weight Tracker in DEBUG MODE        "
echo "==============================================="

# Create logs directory if it doesn't exist
if [ ! -d "logs" ]; then
  echo "Creating logs directory..."
  mkdir -p logs
fi

# Set debug mode to true - export so child processes get it
echo "Setting DEBUG_MODE=true"
export DEBUG_MODE=true

# Verify the variable is set
if [ "$DEBUG_MODE" = "true" ]; then
  echo "✅ DEBUG_MODE successfully set to true"
else
  echo "❌ ERROR: Failed to set DEBUG_MODE"
  exit 1
fi

# Print environment variables for debugging
echo "Environment variables:"
echo "DEBUG_MODE = $DEBUG_MODE"

echo "Starting Flask app with debugging enabled..."
echo "-----------------------------------------------"

# Run the Flask app with exec to replace this shell process with the Python one
exec python app.py 