import os
import logging
from datetime import datetime

# Debug mode based on FLASK_ENV
FLASK_ENV = os.environ.get('FLASK_ENV', 'development')
DEBUG_MODE = FLASK_ENV == 'development'

# Initialize logging
log_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'logs')
os.makedirs(log_dir, exist_ok=True)
log_file = os.path.join(log_dir, 'app.log')

# Configure logging
logging.basicConfig(
    level=logging.DEBUG if DEBUG_MODE else logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_file),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

if DEBUG_MODE:
    logger.debug("Debug mode enabled")
else:
    logger.info("Debug mode is disabled. Set FLASK_ENV=development to enable.")

# Database configuration
SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'sqlite:///weight_tracker.db')
SQLALCHEMY_TRACK_MODIFICATIONS = False
