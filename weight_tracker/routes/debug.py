from flask import Blueprint, jsonify
from weight_tracker.models import db
from weight_tracker.config import logger, DEBUG_MODE
from datetime import datetime
import os
import psutil

debug_bp = Blueprint('debug', __name__, url_prefix='/api/debug')

@debug_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        # Test database connection
        db.session.execute('SELECT 1')
        db_status = 'connected'
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        db_status = f'error: {str(e)}'
    
    # Get system info
    cpu_percent = psutil.cpu_percent(interval=1)
    memory = psutil.virtual_memory()
    
    return jsonify({
        'status': 'healthy',
        'debug_mode': DEBUG_MODE,
        'database': db_status,
        'timestamp': datetime.utcnow().isoformat(),
        'system': {
            'cpu_percent': cpu_percent,
            'memory_percent': memory.percent,
            'memory_available_mb': memory.available / (1024 * 1024)
        },
        'environment': os.environ.get('FLASK_ENV', 'unknown')
    })
