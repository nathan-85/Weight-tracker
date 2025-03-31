#!/bin/bash
# Weight Tracker Unified Start Script
# This script combines all functionality from existing scripts

# Function to show usage instructions
show_help() {
  echo "Weight Tracker Unified Start Script"
  echo "Usage: ./start.sh [OPTIONS]"
  echo ""
  echo "OPTIONS:"
  echo "  -h, --help       Show this help message"
  echo "  --debug          Start in debug mode"
  echo "  --backend-only   Start only the backend server"
  echo "  --frontend-only  Start only the frontend client"
  echo "  --restart        Check for existing processes and restart them"
  echo ""
  echo "Default: Starts both backend and frontend in normal mode"
}

# Parse command line arguments
DEBUG_MODE=false
START_BACKEND=true
START_FRONTEND=true
RESTART_MODE=false

for arg in "$@"; do
  case $arg in
    -h|--help)
      show_help
      exit 0
      ;;
    --debug)
      DEBUG_MODE=true
      ;;
    --backend-only)
      START_BACKEND=true
      START_FRONTEND=false
      ;;
    --frontend-only)
      START_BACKEND=false
      START_FRONTEND=true
      ;;
    --restart)
      RESTART_MODE=true
      ;;
  esac
done

# Print header
echo "==============================================="
echo "   Weight Tracker App Starter                  "
echo "==============================================="

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Create logs directory if it doesn't exist
if [ ! -d "logs" ]; then
  echo "Creating logs directory..."
  mkdir -p logs
fi

# Function to check and kill existing processes
check_existing_processes() {
  echo "Checking for existing Weight Tracker processes..."
  
  # Look for Flask/Python processes that might be our backend
  BACKEND_PIDS=$(ps aux | grep "[p]ython.*run.py\|[f]lask" | awk '{print $2}')
  
  # Look for npm processes that might be our frontend
  FRONTEND_PIDS=$(ps aux | grep "[n]pm.*start\|[n]ode.*weight.*tracker\|[n]ode.*react-scripts" | awk '{print $2}')
  
  if [ -n "$BACKEND_PIDS" ] && $START_BACKEND; then
    echo "Found existing backend process(es): $BACKEND_PIDS"
    # Kill backend processes automatically
    for PID in $BACKEND_PIDS; do
      echo "Killing backend process $PID..."
      kill -9 $PID 2>/dev/null
    done
    echo "Backend processes terminated."
    sleep 1
  fi
  
  if [ -n "$FRONTEND_PIDS" ] && $START_FRONTEND; then
    echo "Found existing frontend process(es): $FRONTEND_PIDS"
    # Kill frontend processes automatically
    for PID in $FRONTEND_PIDS; do
      echo "Killing frontend process $PID..."
      kill -9 $PID 2>/dev/null
    done
    echo "Frontend processes terminated."
    sleep 1
  fi

  # Check if port 3939 is in use and kill that process
  if $START_FRONTEND; then
    PORT_PID=$(lsof -i:3939 -t 2>/dev/null)
    if [ -n "$PORT_PID" ]; then
      echo "Found process using port 3939: $PORT_PID"
      kill -9 $PORT_PID 2>/dev/null
      echo "Process on port 3939 terminated."
      sleep 1
    fi
  fi

  # Check if port 5001 is in use and kill that process
  if $START_BACKEND; then
    PORT_PID=$(lsof -i:5001 -t 2>/dev/null)
    if [ -n "$PORT_PID" ]; then
      echo "Found process using port 5001: $PORT_PID"
      kill -9 $PORT_PID 2>/dev/null
      echo "Process on port 5001 terminated."
      sleep 1
    fi
  fi
}

# If in restart mode or by default, check for existing processes
if $RESTART_MODE || [ "$1" = "" ]; then
  check_existing_processes
fi

# Check for Python virtual environment
if [ ! -d "venv" ] && $START_BACKEND; then
  echo "Virtual environment not found. Please follow the setup instructions in README.md"
  exit 1
fi

# Set environment variable for debug mode if needed
if $DEBUG_MODE; then
  echo "Setting DEBUG_MODE=true for backend"
  export DEBUG_MODE=true
else
  # Make sure debug mode is disabled
  export DEBUG_MODE=false
fi

# Start the backend server if requested
if $START_BACKEND; then
  echo "Starting backend server..."
  source venv/bin/activate
  
  # Run in background if frontend is also starting, otherwise in foreground
  if $START_FRONTEND; then
    python run.py &
    BACKEND_PID=$!
    echo "Backend started with PID: $BACKEND_PID"
    # Wait a moment for the backend to initialize
    echo "Waiting for backend to initialize..."
    sleep 2
  else
    echo "Running backend server in foreground..."
    exec python run.py
  fi
fi

# Start the frontend client if requested
if $START_FRONTEND; then
  echo "Starting frontend client..."
  FRONTEND_PATH="$SCRIPT_DIR/frontend"

  if [ ! -d "$FRONTEND_PATH" ]; then
    echo "Error: Frontend directory not found at $FRONTEND_PATH"
    if $START_BACKEND; then
      echo "Stopping backend server..."
      kill $BACKEND_PID
    fi
    exit 1
  fi

  # Start frontend in the same terminal as a background process instead of opening a new terminal
  echo "Starting frontend in background (PORT=3939)..."
  (cd "$FRONTEND_PATH" && PORT=3939 npm start) &
  FRONTEND_PID=$!
  echo "Frontend started with PID: $FRONTEND_PID"
  
  # Wait a moment for the frontend to initialize
  echo "Waiting for frontend to initialize..."
  sleep 3

  # Create a trap to clean up when script exits
  cleanup() {
    echo "Cleaning up and shutting down..."
    if kill -0 $BACKEND_PID 2>/dev/null; then
      echo "Stopping backend server (PID: $BACKEND_PID)..."
      kill $BACKEND_PID
    fi
    if kill -0 $FRONTEND_PID 2>/dev/null; then
      echo "Stopping frontend server (PID: $FRONTEND_PID)..."
      kill $FRONTEND_PID
    fi
    echo "Shutdown complete."
  }

  trap cleanup EXIT

  echo ""
  echo "Weight Tracker is running!"
  echo "- Backend is running on http://localhost:5001"
  echo "- Frontend is running on http://localhost:3939"
  echo ""
  echo "Press Ctrl+C to stop both servers"

  # Wait for user to press Ctrl+C
  wait $BACKEND_PID $FRONTEND_PID
fi 