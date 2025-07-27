from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from weight_tracker.models import db, Goal
from weight_tracker.config import logger
from sqlalchemy import text

goals_bp = Blueprint('goals', __name__, url_prefix='/api/goals')

@goals_bp.route('', methods=['GET'])
def get_goals():
    try:
        logger.info("Processing GET request for goals")
        goals = Goal.query.order_by(Goal.target_date).all()
        
        # Convert each goal to dict and ensure start_date is included
        result = []
        for goal in goals:
            goal_dict = goal.to_dict()
            
            # Ensure start_date is included
            if 'start_date' not in goal_dict or goal_dict['start_date'] is None:
                # If start_date is missing, use created_at
                if goal.start_date:
                    goal_dict['start_date'] = goal.start_date.strftime('%Y-%m-%d')
                else:
                    goal_dict['start_date'] = goal.created_at.strftime('%Y-%m-%d')
                    
            result.append(goal_dict)
            
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
        target_date_str = data.get('target_date')
        if target_date_str:
            try:
                target_date = datetime.strptime(target_date_str, '%Y-%m-%d')
            except ValueError:
                return jsonify({'error': 'Invalid date format for target_date. Use YYYY-MM-DD'}), 400
        else:
            target_date = datetime.now() + timedelta(days=30)
        
        # Parse start date (if provided) or use current date
        start_date_str = data.get('start_date')
        if start_date_str:
            try:
                start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
            except ValueError:
                return jsonify({'error': 'Invalid date format for start_date. Use YYYY-MM-DD'}), 400
        else:
            start_date = datetime.now()
        
        # Handle optional numeric fields
        target_weight = float(data.get('target_weight')) if data.get('target_weight') else None
        target_fat_percentage = float(data.get('target_fat_percentage')) if data.get('target_fat_percentage') else None
        target_muscle_mass = float(data.get('target_muscle_mass')) if data.get('target_muscle_mass') else None
        description = data.get('description')
        user_id = data.get('user_id')
        created_at = datetime.now()
        
        # Use raw SQL to insert the goal with all fields including start_date
        insert_stmt = text("""
            INSERT INTO goal (target_date, start_date, target_weight, target_fat_percentage, 
                             target_muscle_mass, description, user_id, created_at)
            VALUES (:target_date, :start_date, :target_weight, :target_fat_percentage,
                   :target_muscle_mass, :description, :user_id, :created_at)
        """)
        
        result = db.session.execute(insert_stmt, {
            'target_date': target_date,
            'start_date': start_date,
            'target_weight': target_weight,
            'target_fat_percentage': target_fat_percentage,
            'target_muscle_mass': target_muscle_mass,
            'description': description,
            'user_id': user_id,
            'created_at': created_at
        })
        db.session.commit()
        
        # Get the ID of the inserted row
        goal_id = result.lastrowid
        
        # Retrieve the goal to return it
        created_goal = Goal.query.get(goal_id)
        
        # Check if start_date is set, and if not, fix it
        if created_goal.start_date is None:
            logger.warning(f"start_date is NULL for goal {goal_id}, fixing...")
            fix_stmt = text("UPDATE goal SET start_date = :start_date WHERE id = :id")
            db.session.execute(fix_stmt, {'start_date': start_date, 'id': goal_id})
            db.session.commit()
            # Refresh the goal
            created_goal = Goal.query.get(goal_id)
        
        logger.info(f"New goal added: ID={goal_id}, target_date={target_date}, target_weight={target_weight}kg, user_id={user_id}")
        
        # Return the created goal
        return jsonify(created_goal.to_dict()), 201
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
            
        logger.info(f"Deleting goal: ID={goal_id}, target_date={goal.target_date.strftime('%Y-%m-%d')}, user_id={goal.user_id}")
        
        db.session.delete(goal)
        db.session.commit()
        
        logger.info(f"Goal ID {goal_id} deleted successfully")
        return '', 204
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
        updates = []
        
        # Update goal fields if provided
        if 'target_date' in data:
            try:
                old_date = goal.target_date.strftime('%Y-%m-%d')
                goal.target_date = datetime.strptime(data['target_date'], '%Y-%m-%d')
                updates.append(f"target_date: {old_date} → {data['target_date']}")
            except ValueError:
                return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        
        if 'target_weight' in data:
            old_weight = goal.target_weight
            goal.target_weight = float(data['target_weight']) if data['target_weight'] else None
            updates.append(f"target_weight: {old_weight} → {goal.target_weight}")
        
        if 'target_fat_percentage' in data:
            old_fat = goal.target_fat_percentage
            goal.target_fat_percentage = float(data['target_fat_percentage']) if data['target_fat_percentage'] else None
            updates.append(f"target_fat: {old_fat} → {goal.target_fat_percentage}")
        
        if 'target_muscle_mass' in data:
            old_muscle = goal.target_muscle_mass
            goal.target_muscle_mass = float(data['target_muscle_mass']) if data['target_muscle_mass'] else None
            updates.append(f"target_muscle: {old_muscle} → {goal.target_muscle_mass}")
        
        if 'description' in data:
            goal.description = data['description']
            updates.append(f"description updated")
        
        if 'user_id' in data:
            old_user = goal.user_id
            goal.user_id = data['user_id']
            updates.append(f"user_id: {old_user} → {goal.user_id}")
            
        db.session.commit()
        
        logger.info(f"Goal updated: ID={goal_id}, changes=[{', '.join(updates)}]")
        
        return jsonify(goal.to_dict())
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating goal: {e}")
        return jsonify({'error': 'Failed to update goal'}), 500

@goals_bp.route('/user/<int:user_id>', methods=['GET'])
def get_user_goals(user_id):
    try:
        goals = Goal.query.filter_by(user_id=user_id).order_by(Goal.target_date.desc()).all()
        
        # Convert each goal to dict and ensure start_date is included
        result = []
        for goal in goals:
            goal_dict = goal.to_dict()
            
            # Ensure start_date is included
            if 'start_date' not in goal_dict or goal_dict['start_date'] is None:
                # If start_date is missing, use created_at
                if goal.start_date:
                    goal_dict['start_date'] = goal.start_date.strftime('%Y-%m-%d')
                else:
                    goal_dict['start_date'] = goal.created_at.strftime('%Y-%m-%d')
                    
            result.append(goal_dict)
        
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error fetching goals for user {user_id}: {e}")
        return jsonify({'error': 'Failed to fetch goals'}), 500

@goals_bp.route('/<int:goal_id>', methods=['GET'])
def get_goal(goal_id):
    try:
        goal = Goal.query.get_or_404(goal_id)
        goal_dict = goal.to_dict()
        
        # Ensure start_date is included
        if 'start_date' not in goal_dict or goal_dict['start_date'] is None:
            # If start_date is missing, use created_at
            if goal.start_date:
                goal_dict['start_date'] = goal.start_date.strftime('%Y-%m-%d')
            else:
                goal_dict['start_date'] = goal.created_at.strftime('%Y-%m-%d')
        
        return jsonify(goal_dict)
    except Exception as e:
        logger.error(f"Error fetching goal {goal_id}: {e}")
        return jsonify({'error': 'Failed to fetch goal'}), 500
