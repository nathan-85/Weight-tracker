from flask import Blueprint, request, jsonify
from weight_tracker.models import db, User, Entry, Goal
from weight_tracker.config import logger
from flask_login import login_required, current_user

users_bp = Blueprint('users', __name__, url_prefix='/api/users')

@users_bp.route('', methods=['GET'])
@login_required
def get_users():
    try:
        users = User.query.filter_by(account_id=current_user.id).order_by(User.name).all()
        return jsonify([user.to_dict() for user in users])
    except Exception as e:
        logger.error(f"Error fetching users: {e}")
        return jsonify({'error': 'Failed to fetch users'}), 500

@users_bp.route('', methods=['POST'])
@login_required
def add_user():
    try:
        data = request.json
        
        # Validate required fields
        if not data.get('name'):
            return jsonify({'error': 'Name is required'}), 400
        
        # Create new user
        new_user = User(
            name=data.get('name'),
            age=data.get('age'),
            sex=data.get('sex'),
            height=data.get('height'),
            account_id=current_user.id
        )
        
        db.session.add(new_user)
        db.session.commit()
        
        logger.info(f"New user created: ID={new_user.id}, name={new_user.name}, account_id={current_user.id}")
        
        return jsonify(new_user.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error adding user: {e}")
        return jsonify({'error': 'Failed to add user'}), 500

@users_bp.route('/<int:user_id>', methods=['GET'])
@login_required
def get_user(user_id):
    try:
        user = User.query.filter_by(id=user_id, account_id=current_user.id).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify(user.to_dict())
    except Exception as e:
        logger.error(f"Error fetching user: {e}")
        return jsonify({'error': 'Failed to fetch user'}), 500

@users_bp.route('/<int:user_id>', methods=['PUT'])
@login_required
def update_user(user_id):
    try:
        user = User.query.filter_by(id=user_id, account_id=current_user.id).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404
            
        data = request.json
        updates = []
        
        # Update user fields if provided
        if 'name' in data:
            old_name = user.name
            user.name = data['name']
            updates.append(f"name: {old_name} → {user.name}")
        if 'age' in data:
            old_age = user.age
            user.age = int(data['age']) if data['age'] else None
            updates.append(f"age: {old_age} → {user.age}")
        if 'sex' in data:
            old_sex = user.sex
            user.sex = data['sex']
            updates.append(f"sex: {old_sex} → {user.sex}")
        if 'height' in data:
            old_height = user.height
            user.height = float(data['height']) if data['height'] else None
            updates.append(f"height: {old_height} → {user.height}")
            
        db.session.commit()
        
        logger.info(f"User updated: ID={user_id}, changes=[{', '.join(updates)}]")
        
        return jsonify(user.to_dict())
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating user: {e}")
        return jsonify({'error': 'Failed to update user'}), 500

@users_bp.route('/<int:user_id>', methods=['DELETE'])
@login_required
def delete_user(user_id):
    try:
        user = User.query.filter_by(id=user_id, account_id=current_user.id).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        logger.info(f"Deleting user and associated data: ID={user_id}, name={user.name}, account_id={current_user.id}")
        
        # Delete user's entries and goals
        entry_count = Entry.query.filter_by(user_id=user_id).count()
        goal_count = Goal.query.filter_by(user_id=user_id).count()
        
        Entry.query.filter_by(user_id=user_id).delete()
        Goal.query.filter_by(user_id=user_id).delete()
        
        db.session.delete(user)
        db.session.commit()
        
        logger.info(f"User ID {user_id} deleted successfully along with {entry_count} entries and {goal_count} goals")
        
        return jsonify({'message': 'User and associated data deleted successfully'})
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting user: {e}")
        return jsonify({'error': 'Failed to delete user'}), 500
