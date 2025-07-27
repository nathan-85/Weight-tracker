from flask import Blueprint, jsonify
from weight_tracker.models import db, Entry, Goal, User, Account
from weight_tracker.config import logger, DEBUG_MODE
from datetime import datetime
import os
import psutil
from sqlalchemy import text

debug_bp = Blueprint('debug', __name__, url_prefix='/api/debug')

@debug_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        # Test database connection
        db.session.execute(text('SELECT 1'))
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

@debug_bp.route('/database-info', methods=['GET'])
def database_info():
    """Get database and table information including sequence status"""
    try:
        result = {}
        
        # Check if we're using PostgreSQL
        db_url = db.engine.url
        result['database_type'] = str(db_url.drivername)
        result['database_name'] = str(db_url.database)
        
        # Get table counts
        result['table_counts'] = {
            'entries': Entry.query.count(),
            'goals': Goal.query.count(),
            'users': User.query.count(),
            'accounts': Account.query.count()
        }
        
        # Get max IDs
        result['max_ids'] = {}
        for table_name, model in [('entry', Entry), ('goal', Goal), ('user', User), ('account', Account)]:
            max_id_result = db.session.execute(text(f"SELECT MAX(id) FROM {table_name}"))
            max_id = max_id_result.scalar()
            result['max_ids'][table_name] = max_id
        
        # If PostgreSQL, check sequence values
        if 'postgresql' in str(db_url.drivername):
            result['sequences'] = {}
            for table_name in ['entry', 'goal', 'user', 'account']:
                try:
                    seq_result = db.session.execute(text(f"SELECT nextval('{table_name}_id_seq')"))
                    next_val = seq_result.scalar()
                    # Reset the sequence back one since we just incremented it with nextval
                    db.session.execute(text(f"SELECT setval('{table_name}_id_seq', {next_val - 1})"))
                    result['sequences'][f'{table_name}_id_seq'] = next_val - 1
                except Exception as e:
                    result['sequences'][f'{table_name}_id_seq'] = f'error: {str(e)}'
        
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error getting database info: {e}")
        return jsonify({'error': str(e)}), 500

@debug_bp.route('/fix-sequences', methods=['POST'])
def fix_sequences():
    """Fix PostgreSQL sequences to match the current max IDs"""
    try:
        # Check if we're using PostgreSQL
        db_url = db.engine.url
        if 'postgresql' not in str(db_url.drivername):
            return jsonify({'error': 'This endpoint only works with PostgreSQL databases'}), 400
        
        results = {}
        
        for table_name, model in [('entry', Entry), ('goal', Goal), ('user', User), ('account', Account)]:
            try:
                # Get the current max ID
                max_id_result = db.session.execute(text(f"SELECT MAX(id) FROM {table_name}"))
                max_id = max_id_result.scalar()
                
                if max_id is None:
                    max_id = 0
                
                # Set the sequence to max_id + 1
                new_seq_val = max_id + 1
                db.session.execute(text(f"SELECT setval('{table_name}_id_seq', {new_seq_val})"))
                
                results[table_name] = {
                    'max_id': max_id,
                    'sequence_set_to': new_seq_val,
                    'status': 'fixed'
                }
                
                logger.info(f"Fixed sequence for {table_name}: max_id={max_id}, sequence set to {new_seq_val}")
                
            except Exception as e:
                results[table_name] = {
                    'status': 'error',
                    'error': str(e)
                }
                logger.error(f"Error fixing sequence for {table_name}: {e}")
        
        db.session.commit()
        
        return jsonify({
            'message': 'Sequence fix completed',
            'results': results
        })
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error fixing sequences: {e}")
        return jsonify({'error': str(e)}), 500
