from flask import Blueprint, jsonify, current_app
from weight_tracker.config import logger, DEBUG_MODE, log_file

debug_bp = Blueprint('debug', __name__, url_prefix='/api/debug')

@debug_bp.route('/status', methods=['GET'])
def server_status():
    try:
        # Check if debug mode is enabled
        debug_mode_enabled = DEBUG_MODE
        
        # Return basic server status info
        status = {
            "status": "running",
            "debug_mode": debug_mode_enabled,
            "database_uri": current_app.config['SQLALCHEMY_DATABASE_URI']
        }
        
        # Only include logs if debug mode is enabled
        if debug_mode_enabled:
            try:
                with open(log_file, 'r') as f:
                    # Get last 100 lines of log
                    logs = f.readlines()[-100:]
                status["logs"] = logs
            except Exception as e:
                logger.error(f"Error reading log file: {str(e)}")
                status["logs_error"] = str(e)
        else:
            status["warning"] = "Debug mode is disabled. Enable DEBUG_MODE=true to see detailed logs."
        
        return jsonify(status)
    except Exception as e:
        logger.error(f"Error retrieving server status: {str(e)}")
        return jsonify({"error": "Failed to retrieve server status"}), 500
