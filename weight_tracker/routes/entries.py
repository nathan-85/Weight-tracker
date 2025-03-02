from flask import Blueprint, request, jsonify
from datetime import datetime
from weight_tracker.models import db, Entry
from weight_tracker.config import logger

entries_bp = Blueprint('entries', __name__, url_prefix='/api/entries')

@entries_bp.route('', methods=['GET'])
def get_entries():
    try:
        logger.info("Processing GET request for entries")
        entries = Entry.query.order_by(Entry.date).all()
        result = [entry.to_dict() for entry in entries]
        logger.debug(f"Retrieved {len(result)} entries")
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error retrieving entries: {str(e)}")
        return jsonify({"error": "Failed to retrieve entries"}), 500

@entries_bp.route('', methods=['POST'])
def add_entry():
    try:
        data = request.json
        
        # Validate required fields
        if not data.get('weight'):
            return jsonify({'error': 'Weight is required'}), 400
        
        # Parse date (if provided) or use current date
        entry_date = data.get('date')
        if entry_date:
            try:
                entry_date = datetime.strptime(entry_date, '%Y-%m-%d')
            except ValueError:
                return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        else:
            entry_date = datetime.now()
        
        # Create new entry
        new_entry = Entry(
            date=entry_date,
            weight=float(data.get('weight')),
            neck=float(data.get('neck')) if data.get('neck') else None,
            belly=float(data.get('belly')) if data.get('belly') else None,
            hip=float(data.get('hip')) if data.get('hip') else None,
            user_id=data.get('user_id')  # This can be null for backward compatibility
        )
        
        db.session.add(new_entry)
        db.session.commit()
        
        # Return the created entry
        return jsonify(new_entry.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error adding entry: {e}")
        return jsonify({'error': 'Failed to add entry'}), 500

@entries_bp.route('/<int:entry_id>', methods=['DELETE'])
def delete_entry(entry_id):
    try:
        logger.info(f"Processing DELETE request for entry ID: {entry_id}")
        entry = Entry.query.get_or_404(entry_id)
        db.session.delete(entry)
        db.session.commit()
        logger.info(f"Entry ID {entry_id} deleted successfully")
        return '', 204
    except Exception as e:
        logger.error(f"Error deleting entry ID {entry_id}: {str(e)}")
        return jsonify({"error": "Failed to delete entry"}), 500

@entries_bp.route('/<int:entry_id>', methods=['PUT'])
def update_entry(entry_id):
    try:
        entry = Entry.query.get(entry_id)
        if not entry:
            return jsonify({'error': 'Entry not found'}), 404
            
        data = request.json
        
        # Update entry fields if provided
        if 'date' in data:
            try:
                entry.date = datetime.strptime(data['date'], '%Y-%m-%d')
            except ValueError:
                return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        
        if 'weight' in data:
            entry.weight = float(data['weight'])
        if 'neck' in data:
            entry.neck = float(data['neck']) if data['neck'] else None
        if 'belly' in data:
            entry.belly = float(data['belly']) if data['belly'] else None
        if 'hip' in data:
            entry.hip = float(data['hip']) if data['hip'] else None
        if 'user_id' in data:
            entry.user_id = data['user_id']
            
        db.session.commit()
        return jsonify(entry.to_dict())
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating entry: {e}")
        return jsonify({'error': 'Failed to update entry'}), 500

@entries_bp.route('/user/<int:user_id>', methods=['GET'])
def get_user_entries(user_id):
    try:
        entries = Entry.query.filter_by(user_id=user_id).order_by(Entry.date.desc()).all()
        return jsonify([entry.to_dict() for entry in entries])
    except Exception as e:
        logger.error(f"Error fetching entries for user {user_id}: {e}")
        return jsonify({'error': 'Failed to fetch entries'}), 500
