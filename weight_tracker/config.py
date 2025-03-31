import os
import logging
from datetime import datetime

# Debug mode flag - standardize the check
DEBUG_MODE = True  # Force debug mode to be True for debugging

# Initialize logging
log_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'logs')
os.makedirs(log_dir, exist_ok=True)
log_file = os.path.join(log_dir, 'app.log')

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,  # Set to DEBUG to capture all messages
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_file),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

if DEBUG_MODE:
    logger.setLevel(logging.DEBUG)
    logger.debug("Debug mode enabled")
else:
    logger.info("Debug mode is disabled. Set DEBUG_MODE=true to enable.")

# Database configuration
SQLALCHEMY_DATABASE_URI = 'sqlite:///weight_tracker.db'
SQLALCHEMY_TRACK_MODIFICATIONS = False

# Server configuration
HOST = '127.0.0.1'
PORT = 5001
