#!/usr/bin/env python
"""
Debug launcher for Weight Tracker Application
This script starts the Weight Tracker with debug mode enabled.
It works on both Windows and macOS/Linux systems.
"""

import os
import sys
import platform
import subprocess
import logging

# Configure logging
os.makedirs('logs', exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/launcher.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("debug_launcher")

def main():
    """Main function to launch the app with debug mode enabled"""
    logger.info("Starting Weight Tracker Debug Launcher")
    
    # Determine the operating system
    system = platform.system()
    logger.info(f"Detected operating system: {system}")
    
    # Set environment variable - use value that will be recognized by our check
    os.environ['DEBUG_MODE'] = 'true'
    logger.info("Set DEBUG_MODE=true")
    
    # Verify the variable is set
    if os.environ.get('DEBUG_MODE') == 'true':
        logger.info("✅ DEBUG_MODE successfully set to true")
    else:
        logger.error("❌ ERROR: Failed to set DEBUG_MODE")
        return 1
    
    # Print header
    print("===============================================")
    print("   Running Weight Tracker in DEBUG MODE        ")
    print("===============================================")
    
    # Run the Flask app
    logger.info("Starting Flask app with debugging enabled...")
    print("-----------------------------------------------")
    
    try:
        # Use python executable from the current environment
        python_exec = sys.executable
        
        # Run app.py as a direct process so it inherits our environment variables
        print(f"Running: {python_exec} app.py")
        sys.stdout.flush()  # Make sure the message is printed before subprocess output
        
        # Use os.execl instead of subprocess to ensure environment variables are passed correctly
        os.execl(python_exec, python_exec, "app.py")
    except Exception as e:
        logger.error(f"An unexpected error occurred: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main()) 