from flask import Blueprint, request, jsonify
from datetime import datetime
from weight_tracker.models import db, Entry
from weight_tracker.config import logger
from flask_login import current_user, login_required
from sqlalchemy.exc import IntegrityError

entries_bp = Blueprint('entries', __name__, url_prefix='/api/entries')

@entries_bp.route('', methods=['GET'])
@login_required
def get_entries():
    try:
        logger.info(f"Processing GET request for entries for user {current_user.id}")
        # Get all entries for users belonging to the current account
        user_ids = [user.id for user in current_user.users]
        if not user_ids:
            logger.warning(f"No users found for account {current_user.id}")
            return jsonify([])
        
        entries = Entry.query.filter(Entry.user_id.in_(user_ids)).order_by(Entry.date.desc()).all()
        result = [entry.to_dict() for entry in entries]
        logger.debug(f"Retrieved {len(result)} entries for account {current_user.id}")
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error retrieving entries: {str(e)}")
        return jsonify({"error": "Failed to retrieve entries"}), 500

@entries_bp.route('', methods=['POST'])
@login_required
def add_entry():
    try:
        data = request.json
        
        # Validate required fields
        if not data.get('weight'):
            return jsonify({'error': 'Weight is required'}), 400
        
        if not data.get('user_id'):
            return jsonify({'error': 'User ID is required'}), 400
        
        # Validate that the user_id belongs to the current account
        user_ids = [user.id for user in current_user.users]
        requested_user_id = int(data.get('user_id'))
        
        if requested_user_id not in user_ids:
            logger.warning(f"Account {current_user.id} attempted to create entry for unauthorized user {requested_user_id}")
            return jsonify({'error': 'User not found or access denied'}), 404
        
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
            user_id=requested_user_id,
            account_id=current_user.id
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
@login_required
def delete_entry(entry_id):
    try:
        logger.info(f"Processing DELETE request for entry ID: {entry_id} by account {current_user.id}")
        
        # Get all user IDs for the current account
        user_ids = [user.id for user in current_user.users]
        
        # Find entry and verify it belongs to the current account
        entry = Entry.query.filter(Entry.id == entry_id, Entry.user_id.in_(user_ids)).first()
        if not entry:
            logger.warning(f"Entry {entry_id} not found or access denied for account {current_user.id}")
            return jsonify({'error': 'Entry not found'}), 404
        
        # Log entry details before deletion
        logger.info(f"Deleting entry: ID={entry_id}, weight={entry.weight}kg, date={entry.date.strftime('%Y-%m-%d')}, user_id={entry.user_id}")
        
        db.session.delete(entry)
        db.session.commit()
        logger.info(f"Entry ID {entry_id} deleted successfully")
        return '', 204
    except Exception as e:
        logger.error(f"Error deleting entry ID {entry_id}: {str(e)}")
        return jsonify({"error": "Failed to delete entry"}), 500

@entries_bp.route('/<int:entry_id>', methods=['PUT'])
@login_required
def update_entry(entry_id):
    try:
        logger.info(f"Processing PUT request for entry ID: {entry_id} by account {current_user.id}")
        
        # Get all user IDs for the current account
        user_ids = [user.id for user in current_user.users]
        
        # Find entry and verify it belongs to the current account
        entry = Entry.query.filter(Entry.id == entry_id, Entry.user_id.in_(user_ids)).first()
        if not entry:
            logger.warning(f"Entry {entry_id} not found or access denied for account {current_user.id}")
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
