import os
from weight_tracker import create_app
from weight_tracker.config import DEBUG_MODE, logger

if __name__ == '__main__':
    HOST = os.environ.get('HOST', '127.0.0.1')
    PORT = int(os.environ.get('PORT', 5001))
    logger.info(f"Starting application with debug={DEBUG_MODE}")
    app = create_app()
    app.run(host=HOST, port=PORT, debug=DEBUG_MODE)
