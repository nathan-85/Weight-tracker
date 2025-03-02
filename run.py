from weight_tracker import create_app
from weight_tracker.config import HOST, PORT, DEBUG_MODE, logger

if __name__ == '__main__':
    logger.info(f"Starting application with debug={DEBUG_MODE}")
    app = create_app()
    app.run(host=HOST, port=PORT, debug=DEBUG_MODE)
