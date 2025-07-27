from flask import Blueprint, request, jsonify
from datetime import datetime
from weight_tracker.models import db, Entry
from weight_tracker.config import logger
from flask_login import current_user
from sqlalchemy.exc import IntegrityError

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
        
        # Get account_id from current_user if authenticated, otherwise None for backward compatibility
        account_id = current_user.id if current_user.is_authenticated else None
        
        # Create new entry
        new_entry = Entry(
            date=entry_date,
            weight=float(data.get('weight')),
            neck=float(data.get('neck')) if data.get('neck') else None,
            belly=float(data.get('belly')) if data.get('belly') else None,
            hip=float(data.get('hip')) if data.get('hip') else None,
            user_id=data.get('user_id'),  # This can be null for backward compatibility
            account_id=account_id
        )
        
        db.session.add(new_entry)
        db.session.commit()
        
        logger.info(f"New entry added: ID={new_entry.id}, weight={new_entry.weight}kg, user_id={new_entry.user_id}, account_id={new_entry.account_id}, date={new_entry.date.strftime('%Y-%m-%d')}")
        
        # Return the created entry
        return jsonify(new_entry.to_dict()), 201
    except IntegrityError as e:
        db.session.rollback()
        if "duplicate key value violates unique constraint" in str(e):
            logger.error(f"Duplicate key error adding entry: {e}")
            return jsonify({
                'error': 'Database sequence error detected. Please contact administrator to run database maintenance.',
                'technical_details': 'Duplicate key constraint violation - sequence may be out of sync'
            }), 500
        else:
            logger.error(f"Integrity error adding entry: {e}")
            return jsonify({'error': 'Data integrity error'}), 400
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error adding entry: {e}")
        return jsonify({'error': 'Failed to add entry'}), 500

@entries_bp.route('/<int:entry_id>', methods=['DELETE'])
def delete_entry(entry_id):
    try:
        logger.info(f"Processing DELETE request for entry ID: {entry_id}")
        entry = Entry.query.get_or_404(entry_id)
        
        # Log entry details before deletion
        logger.info(f"Deleting entry: ID={entry_id}, weight={entry.weight}kg, date={entry.date.strftime('%Y-%m-%d')}")
        
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
        
        # Log what's being updated
        updates = []
        
        # Update entry fields if provided
        if 'date' in data:
            try:
                old_date = entry.date.strftime('%Y-%m-%d')
                entry.date = datetime.strptime(data['date'], '%Y-%m-%d')
                updates.append(f"date: {old_date} → {data['date']}")
            except ValueError:
                return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        
        if 'weight' in data:
            old_weight = entry.weight
            entry.weight = float(data['weight'])
            updates.append(f"weight: {old_weight} → {entry.weight}")
        if 'neck' in data:
            old_neck = entry.neck
            entry.neck = float(data['neck']) if data['neck'] else None
            updates.append(f"neck: {old_neck} → {entry.neck}")
        if 'belly' in data:
            old_belly = entry.belly
            entry.belly = float(data['belly']) if data['belly'] else None
            updates.append(f"belly: {old_belly} → {entry.belly}")
        if 'hip' in data:
            old_hip = entry.hip
            entry.hip = float(data['hip']) if data['hip'] else None
            updates.append(f"hip: {old_hip} → {entry.hip}")
        if 'user_id' in data:
            old_user = entry.user_id
            entry.user_id = data['user_id']
            updates.append(f"user_id: {old_user} → {entry.user_id}")
            
        db.session.commit()
        
        logger.info(f"Entry updated: ID={entry_id}, changes=[{', '.join(updates)}]")
        
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
