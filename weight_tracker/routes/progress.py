from flask import Blueprint, jsonify
from weight_tracker.models import Entry, Goal, User
from weight_tracker.config import logger
from weight_tracker.utils import infer_belly_circumference

progress_bp = Blueprint('progress', __name__, url_prefix='/api/progress')

@progress_bp.route('', methods=['GET'])
def get_progress():
    try:
        logger.info("Processing GET request for progress")
        # Get the latest entry and goal
        latest_entry = Entry.query.order_by(Entry.date.desc()).first()
        goals = Goal.query.order_by(Goal.target_date).all()
        
        if not latest_entry or not goals:
            logger.warning("Cannot calculate progress: missing entries or goals")
            return jsonify({'error': 'Need at least one entry and one goal to calculate progress'}), 400
        
        # Convert latest entry to dict to get calculated values
        latest_entry_dict = latest_entry.to_dict()
        latest_fat_percentage = latest_entry_dict.get('fat_percentage')
        latest_muscle_mass = latest_entry_dict.get('muscle_mass')
        
        results = []
        
        for goal in goals:
            # Use start_date if available, otherwise use latest entry date
            start_date = goal.start_date if goal.start_date else latest_entry.date
            
            # Calculate days between start date, current date, and target date
            total_days = (goal.target_date - start_date).days
            days_elapsed = (latest_entry.date - start_date).days
            days_remaining = (goal.target_date - latest_entry.date).days
            
            if days_remaining <= 0:
                # Goal date has passed
                logger.debug(f"Skipping goal ID {goal.id} as target date has passed")
                continue
            
            # Calculate progress percentage
            progress_percentage = (days_elapsed / total_days * 100) if total_days > 0 else 0
            
            result = {
                'goal_id': goal.id,
                'target_date': goal.target_date.strftime('%Y-%m-%d'),
                'start_date': goal.start_date.strftime('%Y-%m-%d') if goal.start_date else None,
                'days_remaining': days_remaining,
                'days_elapsed': days_elapsed,
                'total_days': total_days,
                'progress_percentage': progress_percentage,
                'weight': {
                    'current': latest_entry.weight,
                    'target': goal.target_weight,
                    'daily_change_needed': (goal.target_weight - latest_entry.weight) / days_remaining if goal.target_weight else None,
                    'weekly_change_needed': (goal.target_weight - latest_entry.weight) / (days_remaining / 7) if goal.target_weight else None
                },
                'fat_percentage': {
                    'current': latest_fat_percentage,
                    'target': goal.target_fat_percentage,
                    'daily_change_needed': (goal.target_fat_percentage - latest_fat_percentage) / days_remaining if goal.target_fat_percentage and latest_fat_percentage else None,
                    'weekly_change_needed': (goal.target_fat_percentage - latest_fat_percentage) / (days_remaining / 7) if goal.target_fat_percentage and latest_fat_percentage else None
                },
                'muscle_mass': {
                    'current': latest_muscle_mass,
                    'target': goal.target_muscle_mass,
                    'daily_change_needed': (goal.target_muscle_mass - latest_muscle_mass) / days_remaining if goal.target_muscle_mass and latest_muscle_mass else None,
                    'weekly_change_needed': (goal.target_muscle_mass - latest_muscle_mass) / (days_remaining / 7) if goal.target_muscle_mass and latest_muscle_mass else None
                }
            }
            
            results.append(result)
        
        logger.debug(f"Calculated progress for {len(results)} goals")
        return jsonify(results)
    except Exception as e:
        logger.error(f"Error calculating progress: {str(e)}")
        return jsonify({"error": "Failed to calculate progress"}), 500

@progress_bp.route('/user/<int:user_id>', methods=['GET'])
def get_user_progress(user_id):
    try:
        logger.info(f"Processing GET request for progress for user {user_id}")
        # Get the latest entry and goals for this user
        latest_entry = Entry.query.filter_by(user_id=user_id).order_by(Entry.date.desc()).first()
        goals = Goal.query.filter_by(user_id=user_id).order_by(Goal.target_date).all()
        user = User.query.get(user_id)

        if not latest_entry or not goals or not user:
            logger.warning(f"Cannot calculate progress for user {user_id}: missing entries, goals, or user data")
            return jsonify([])

        # Convert latest entry to dict to get calculated values
        latest_entry_dict = latest_entry.to_dict()
        latest_fat_percentage = latest_entry_dict.get('fat_percentage')
        latest_muscle_mass = latest_entry_dict.get('muscle_mass')
        latest_neck = latest_entry.neck
        latest_hip = latest_entry.hip # Will be None if not applicable or entered
        user_height = user.height
        user_gender = user.sex

        results = []
        
        for goal in goals:
            # Use start_date if available, otherwise use latest entry date
            start_date = goal.start_date if goal.start_date else latest_entry.date
            
            # Calculate days between start date, current date, and target date
            total_days = (goal.target_date - start_date).days
            days_elapsed = (latest_entry.date - start_date).days
            days_remaining = (goal.target_date - latest_entry.date).days
            
            if days_remaining <= 0:
                # Goal date has passed
                logger.debug(f"Skipping goal ID {goal.id} as target date has passed")
                continue
            
            # Calculate progress percentage
            progress_percentage = (days_elapsed / total_days * 100) if total_days > 0 else 0
            
            result = {
                'goal_id': goal.id,
                'target_date': goal.target_date.strftime('%Y-%m-%d'),
                'start_date': goal.start_date.strftime('%Y-%m-%d') if goal.start_date else None,
                'days_remaining': days_remaining,
                'days_elapsed': days_elapsed,
                'total_days': total_days,
                'progress_percentage': progress_percentage,
                'weight': {
                    'current': latest_entry.weight,
                    'target': goal.target_weight,
                    'daily_change_needed': (goal.target_weight - latest_entry.weight) / days_remaining if goal.target_weight else None,
                    'weekly_change_needed': (goal.target_weight - latest_entry.weight) / (days_remaining / 7) if goal.target_weight else None
                },
                'fat_percentage': {
                    'current': latest_fat_percentage,
                    'target': goal.target_fat_percentage,
                    'daily_change_needed': (goal.target_fat_percentage - latest_fat_percentage) / days_remaining if goal.target_fat_percentage and latest_fat_percentage else None,
                    'weekly_change_needed': (goal.target_fat_percentage - latest_fat_percentage) / (days_remaining / 7) if goal.target_fat_percentage and latest_fat_percentage else None,
                    'current_inferred_belly': infer_belly_circumference(
                        fat_percentage=latest_fat_percentage, 
                        neck=latest_neck, 
                        height=user_height, 
                        gender=user_gender, 
                        hip=latest_hip
                    ) if latest_fat_percentage and latest_neck and user_height else None,
                    'target_inferred_belly': infer_belly_circumference(
                        fat_percentage=goal.target_fat_percentage, 
                        neck=latest_neck, 
                        height=user_height, 
                        gender=user_gender, 
                        hip=latest_hip
                    ) if goal.target_fat_percentage and latest_neck and user_height else None
                },
                'muscle_mass': {
                    'current': latest_muscle_mass,
                    'target': goal.target_muscle_mass,
                    'daily_change_needed': (goal.target_muscle_mass - latest_muscle_mass) / days_remaining if goal.target_muscle_mass and latest_muscle_mass else None,
                    'weekly_change_needed': (goal.target_muscle_mass - latest_muscle_mass) / (days_remaining / 7) if goal.target_muscle_mass and latest_muscle_mass else None
                }
            }
            
            results.append(result)
        
        logger.debug(f"Calculated progress for {len(results)} goals for user {user_id}")
        return jsonify(results)
    except Exception as e:
        logger.error(f"Error calculating progress for user {user_id}: {str(e)}")
        return jsonify({"error": "Failed to calculate progress"}), 500
