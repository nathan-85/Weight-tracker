from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from weight_tracker.models import db, Goal
from weight_tracker.config import logger

goals_bp = Blueprint('goals', __name__, url_prefix='/api/goals')

@goals_bp.route('', methods=['GET'])
def get_goals():
    try:
        logger.info("Processing GET request for goals")
        goals = Goal.query.order_by(Goal.target_date).all()
        result = [goal.to_dict() for goal in goals]
        logger.debug(f"Retrieved {len(result)} goals")
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error retrieving goals: {str(e)}")
        return jsonify({"error": "Failed to retrieve goals"}), 500

@goals_bp.route('', methods=['POST'])
def add_goal():
    try:
        data = request.json
        
        # Validate required fields (at least one target must be set)
        if not any([data.get('target_weight'), data.get('target_fat_percentage'), data.get('target_muscle_mass')]):
            return jsonify({'error': 'At least one target (weight, fat percentage, or muscle mass) is required'}), 400
        
        # Parse target date (if provided) or use default date (30 days from now)
        target_date = data.get('target_date')
        if target_date:
            try:
                target_date = datetime.strptime(target_date, '%Y-%m-%d')
            except ValueError:
                return jsonify({'error': 'Invalid date format for target_date. Use YYYY-MM-DD'}), 400
        else:
            target_date = datetime.now() + timedelta(days=30)
        
        # Create new goal
        new_goal = Goal(
            target_date=target_date,
            target_weight=float(data.get('target_weight')) if data.get('target_weight') else None,
            target_fat_percentage=float(data.get('target_fat_percentage')) if data.get('target_fat_percentage') else None,
            target_muscle_mass=float(data.get('target_muscle_mass')) if data.get('target_muscle_mass') else None,
            user_id=data.get('user_id')  # This can be null for backward compatibility
        )
        
        db.session.add(new_goal)
        db.session.commit()
        
        # Return the created goal
        return jsonify(new_goal.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error adding goal: {e}")
        return jsonify({'error': 'Failed to add goal'}), 500

@goals_bp.route('/<int:goal_id>', methods=['DELETE'])
def delete_goal(goal_id):
    try:
        goal = Goal.query.get(goal_id)
        if not goal:
            return jsonify({'error': 'Goal not found'}), 404
        
        db.session.delete(goal)
        db.session.commit()
        return jsonify({'message': 'Goal deleted successfully'})
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting goal: {e}")
        return jsonify({'error': 'Failed to delete goal'}), 500

@goals_bp.route('/<int:goal_id>', methods=['PUT'])
def update_goal(goal_id):
    try:
        goal = Goal.query.get(goal_id)
        if not goal:
            return jsonify({'error': 'Goal not found'}), 404
            
        data = request.json
        
        # Update goal fields if provided
        if 'target_date' in data:
            try:
                goal.target_date = datetime.strptime(data['target_date'], '%Y-%m-%d')
            except ValueError:
                return jsonify({'error': 'Invalid date format for target_date. Use YYYY-MM-DD'}), 400
        
        if 'target_weight' in data:
            goal.target_weight = float(data['target_weight']) if data['target_weight'] else None
        if 'target_fat_percentage' in data:
            goal.target_fat_percentage = float(data['target_fat_percentage']) if data['target_fat_percentage'] else None
        if 'target_muscle_mass' in data:
            goal.target_muscle_mass = float(data['target_muscle_mass']) if data['target_muscle_mass'] else None
        if 'user_id' in data:
            goal.user_id = data['user_id']
            
        db.session.commit()
        return jsonify(goal.to_dict())
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating goal: {e}")
        return jsonify({'error': 'Failed to update goal'}), 500

@goals_bp.route('/user/<int:user_id>', methods=['GET'])
def get_user_goals(user_id):
    try:
        goals = Goal.query.filter_by(user_id=user_id).order_by(Goal.target_date.desc()).all()
        return jsonify([goal.to_dict() for goal in goals])
    except Exception as e:
        logger.error(f"Error fetching goals for user {user_id}: {e}")
        return jsonify({'error': 'Failed to fetch goals'}), 500
