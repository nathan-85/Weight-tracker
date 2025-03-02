#!/bin/bash
# Weight Tracker App Starter
# This script starts both the backend server and frontend client

echo "==============================================="
echo "   Starting Weight Tracker App                 "
echo "==============================================="

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Create logs directory if it doesn't exist
if [ ! -d "logs" ]; then
  echo "Creating logs directory..."
  mkdir -p logs
fi

# Function to find and kill existing processes
check_existing_processes() {
  # Check for existing backend processes
  echo "Checking for existing Weight Tracker processes..."
  
  # Look for Flask/Python processes that might be our backend
  BACKEND_PIDS=$(ps aux | grep "[p]ython.*run.py\|[f]lask" | awk '{print $2}')
  
  # Look for npm processes that might be our frontend
  FRONTEND_PIDS=$(ps aux | grep "[n]pm.*start\|[n]ode.*weight.*tracker" | awk '{print $2}')
  
  if [ -n "$BACKEND_PIDS" ] || [ -n "$FRONTEND_PIDS" ]; then
    echo "Found existing Weight Tracker processes:"
    
    if [ -n "$BACKEND_PIDS" ]; then
      echo "- Backend process(es): $BACKEND_PIDS"
      # Kill backend processes automatically
      for PID in $BACKEND_PIDS; do
        echo "Killing backend process $PID..."
        kill -9 $PID 2>/dev/null
      done
    fi
    
    if [ -n "$FRONTEND_PIDS" ]; then
      echo "- Frontend process(es): $FRONTEND_PIDS"
      # Kill frontend processes automatically
      for PID in $FRONTEND_PIDS; do
        echo "Killing frontend process $PID..."
        kill -9 $PID 2>/dev/null
      done
    fi
    
    # Wait a moment for processes to fully terminate
    sleep 2
    echo "Previous processes terminated."
  else
    echo "No existing Weight Tracker processes found."
  fi
}

# Check for Python virtual environment
if [ ! -d "venv" ]; then
  echo "Virtual environment not found. Please follow the setup instructions in README.md"
  exit 1
fi

# Check and handle existing processes
check_existing_processes

# Start the backend server in the background
echo "Starting backend server..."
source venv/bin/activate
python run.py &
BACKEND_PID=$!
echo "Backend started with PID: $BACKEND_PID"

# Wait a moment for the backend to initialize
echo "Waiting for backend to initialize..."
sleep 2

# Start the frontend client in a new terminal window
echo "Starting frontend client..."
FRONTEND_PATH="$SCRIPT_DIR/frontend"

if [ ! -d "$FRONTEND_PATH" ]; then
  echo "Error: Frontend directory not found at $FRONTEND_PATH"
  echo "Stopping backend server..."
  kill $BACKEND_PID
  exit 1
fi

# Create temporary script to start frontend
cat > "$SCRIPT_DIR/temp_start_client.sh" << EOL
#!/bin/bash
cd "$FRONTEND_PATH"
PORT=3939 npm start
EOL
chmod +x "$SCRIPT_DIR/temp_start_client.sh"

# Open terminal based on detected OS
if [[ "$OSTYPE" == "darwin"* ]]; then  # macOS
  open -a Terminal "$SCRIPT_DIR/temp_start_client.sh"
else  # Linux
  # Try different terminal emulators
  if command -v gnome-terminal &> /dev/null; then
    gnome-terminal -- "$SCRIPT_DIR/temp_start_client.sh"
  elif command -v xterm &> /dev/null; then
    xterm -e "$SCRIPT_DIR/temp_start_client.sh"
  else
    echo "Could not find a suitable terminal emulator."
    echo "Please start the frontend manually in another terminal with:"
    echo "cd $FRONTEND_PATH && PORT=3939 npm start"
  fi
fi

# Cleanup: Create a trap to remove the temporary script and kill backend when script exits
cleanup() {
  echo "Cleaning up and shutting down..."
  if [ -f "$SCRIPT_DIR/temp_start_client.sh" ]; then
    rm "$SCRIPT_DIR/temp_start_client.sh"
  fi
  
  if kill -0 $BACKEND_PID 2>/dev/null; then
    echo "Stopping backend server (PID: $BACKEND_PID)..."
    kill $BACKEND_PID
  fi
  
  echo "Shutdown complete."
}

trap cleanup EXIT

echo ""
echo "Weight Tracker is starting up!"
echo "- Backend is running on http://localhost:5001"
echo "- Frontend will be available at http://localhost:3939"
echo ""
echo "Press Ctrl+C to stop the backend server"
echo "(Frontend must be closed separately in its own terminal)"

# Wait for user to press Ctrl+C
wait $BACKEND_PID 