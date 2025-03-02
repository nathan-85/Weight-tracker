import os
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta
import numpy as np

# Initialize logging
log_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'logs')
os.makedirs(log_dir, exist_ok=True)
log_file = os.path.join(log_dir, 'app.log')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_file),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Debug mode flag - standardize the check
DEBUG_MODE = os.environ.get('DEBUG_MODE', 'False').lower() in ('true', '1', 't')
if DEBUG_MODE:
    logger.setLevel(logging.DEBUG)
    logger.debug("Debug mode enabled")
else:
    logger.info("Debug mode is disabled. Set DEBUG_MODE=true to enable.")

# Initialize Flask app
app = Flask(__name__, static_folder='frontend/build', static_url_path='')
CORS(app)

# Configure SQLite database
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///weight_tracker.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Define database models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    age = db.Column(db.Integer)
    sex = db.Column(db.String(10))  # 'male', 'female', or 'other'
    height = db.Column(db.Float)  # height in cm
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'age': self.age,
            'sex': self.sex,
            'height': self.height,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Entry(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    weight = db.Column(db.Float, nullable=False)  # weight in kg
    neck = db.Column(db.Float)  # neck circumference in cm
    belly = db.Column(db.Float)  # belly circumference in cm
    hip = db.Column(db.Float)  # hip circumference in cm for female users
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)  # nullable for backward compatibility
    # Remove calculated fields from database model
    # calculated_fat_percentage and calculated_muscle_mass are no longer stored

    def to_dict(self):
        # Calculate values on-the-fly when converting to dict
        # Get user details if available
        user = User.query.get(self.user_id) if self.user_id else None
        height = user.height if user else 185
        gender = user.sex if user else 'male'
        
        fat_percentage = calculate_body_fat_percentage(
            self.weight, self.neck, self.belly, height, gender, self.hip
        ) if all([self.weight, self.neck, self.belly]) else None
        
        muscle_mass = calculate_muscle_mass(
            self.weight, fat_percentage
        ) if all([self.weight, fat_percentage]) else None
        
        return {
            'id': self.id,
            'date': self.date.strftime('%Y-%m-%d'),
            'weight': self.weight,
            'neck': self.neck,
            'belly': self.belly,
            'hip': self.hip,
            'fat_percentage': fat_percentage,
            'muscle_mass': muscle_mass,
            'user_id': self.user_id
        }

class Goal(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    target_date = db.Column(db.DateTime, nullable=False)
    target_weight = db.Column(db.Float)
    target_fat_percentage = db.Column(db.Float)
    target_muscle_mass = db.Column(db.Float)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)  # nullable for backward compatibility

    def to_dict(self):
        return {
            'id': self.id,
            'target_date': self.target_date.strftime('%Y-%m-%d'),
            'target_weight': self.target_weight,
            'target_fat_percentage': self.target_fat_percentage,
            'target_muscle_mass': self.target_muscle_mass,
            'created_at': self.created_at.strftime('%Y-%m-%d'),
            'user_id': self.user_id
        }

# Create database tables
with app.app_context():
    try:
        db.create_all()
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Error creating database tables: {str(e)}")

# Helper functions for calculations
def calculate_body_fat_percentage(weight, neck, belly, height=185, gender='male', hip=None):
    """
    Calculate body fat percentage using the US Navy method.
    Default height is 185cm, and default gender is male.
    For a more accurate calculation, the app should collect height and gender from the user.
    Hip measurement is required for females for accurate calculation.
    """
    if not all([weight, neck, belly]):
        return None
    
    # Convert measurements from cm to inches
    neck_inches = neck / 2.54
    belly_inches = belly / 2.54
    height_inches = height / 2.54
    
    if gender.lower() == 'male':
        body_fat = 86.010 * np.log10(belly_inches - neck_inches) - 70.041 * np.log10(height_inches) + 36.76
    else:  # female
        # For females, we need hip measurement for accurate calculation
        if not hip:
            # Fallback to simplified formula if hip measurement is not available
            body_fat = 163.205 * np.log10(belly_inches - neck_inches) - 97.684 * np.log10(height_inches) - 78.387
        else:
            hip_inches = hip / 2.54
            body_fat = 163.205 * np.log10(belly_inches + hip_inches - neck_inches) - 97.684 * np.log10(height_inches) - 104.912
    
    # Ensure the result is within reasonable bounds
    return max(min(body_fat, 50), 3)

def calculate_muscle_mass(weight, fat_percentage):
    """
    Estimate muscle mass based on weight and body fat percentage.
    This is a simplified calculation. For more accuracy, we would need additional measurements.
    """
    if not all([weight, fat_percentage]):
        return None
    
    # First, calculate fat mass
    fat_mass = weight * (fat_percentage / 100)
    
    # Estimate essential body mass (bones, organs, etc.) - very approximate
    essential_mass = weight * 0.2
    
    # Muscle mass is what remains
    muscle_mass = weight - fat_mass - essential_mass
    
    return max(muscle_mass, 0)  # Ensure we don't return negative values

# API routes
@app.route('/api/entries', methods=['GET'])
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

@app.route('/api/entries', methods=['POST'])
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

@app.route('/api/entries/<int:entry_id>', methods=['DELETE'])
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

@app.route('/api/entries/<int:entry_id>', methods=['PUT'])
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

@app.route('/api/goals', methods=['GET'])
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

@app.route('/api/goals', methods=['POST'])
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

@app.route('/api/goals/<int:goal_id>', methods=['DELETE'])
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

@app.route('/api/goals/<int:goal_id>', methods=['PUT'])
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

@app.route('/api/progress', methods=['GET'])
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
            # Calculate days between latest entry and goal
            days_remaining = (goal.target_date - latest_entry.date).days
            
            if days_remaining <= 0:
                # Goal date has passed
                logger.debug(f"Skipping goal ID {goal.id} as target date has passed")
                continue
            
            result = {
                'goal_id': goal.id,
                'target_date': goal.target_date.strftime('%Y-%m-%d'),
                'days_remaining': days_remaining,
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

@app.route('/', methods=['GET'])
def serve():
    return app.send_static_file('index.html')

# API endpoint to check server status and get logs
@app.route('/api/debug/status', methods=['GET'])
def server_status():
    try:
        # Check if debug mode is enabled
        debug_mode_enabled = DEBUG_MODE
        
        # Return basic server status info
        status = {
            "status": "running",
            "debug_mode": debug_mode_enabled,
            "database_uri": app.config['SQLALCHEMY_DATABASE_URI']
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

# User API endpoints
@app.route('/api/users', methods=['GET'])
def get_users():
    try:
        users = User.query.order_by(User.name).all()
        return jsonify([user.to_dict() for user in users])
    except Exception as e:
        logger.error(f"Error fetching users: {e}")
        return jsonify({'error': 'Failed to fetch users'}), 500

@app.route('/api/users', methods=['POST'])
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
            height=data.get('height')
        )
        
        db.session.add(new_user)
        db.session.commit()
        
        return jsonify(new_user.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error adding user: {e}")
        return jsonify({'error': 'Failed to add user'}), 500

@app.route('/api/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify(user.to_dict())
    except Exception as e:
        logger.error(f"Error fetching user: {e}")
        return jsonify({'error': 'Failed to fetch user'}), 500

@app.route('/api/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
            
        data = request.json
        
        # Update user fields if provided
        if 'name' in data:
            user.name = data['name']
        if 'age' in data:
            user.age = data['age']
        if 'sex' in data:
            user.sex = data['sex']
        if 'height' in data:
            user.height = data['height']
            
        db.session.commit()
        return jsonify(user.to_dict())
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating user: {e}")
        return jsonify({'error': 'Failed to update user'}), 500

@app.route('/api/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Delete user's entries and goals
        Entry.query.filter_by(user_id=user_id).delete()
        Goal.query.filter_by(user_id=user_id).delete()
        
        db.session.delete(user)
        db.session.commit()
        return jsonify({'message': 'User and associated data deleted successfully'})
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting user: {e}")
        return jsonify({'error': 'Failed to delete user'}), 500

# Modified endpoints to support user filtering
@app.route('/api/entries/user/<int:user_id>', methods=['GET'])
def get_user_entries(user_id):
    try:
        entries = Entry.query.filter_by(user_id=user_id).order_by(Entry.date.desc()).all()
        return jsonify([entry.to_dict() for entry in entries])
    except Exception as e:
        logger.error(f"Error fetching entries for user {user_id}: {e}")
        return jsonify({'error': 'Failed to fetch entries'}), 500

@app.route('/api/goals/user/<int:user_id>', methods=['GET'])
def get_user_goals(user_id):
    try:
        goals = Goal.query.filter_by(user_id=user_id).order_by(Goal.target_date.desc()).all()
        return jsonify([goal.to_dict() for goal in goals])
    except Exception as e:
        logger.error(f"Error fetching goals for user {user_id}: {e}")
        return jsonify({'error': 'Failed to fetch goals'}), 500

@app.route('/api/progress/user/<int:user_id>', methods=['GET'])
def get_user_progress(user_id):
    try:
        logger.info(f"Processing GET request for progress for user {user_id}")
        # Get the latest entry and goals for this user
        latest_entry = Entry.query.filter_by(user_id=user_id).order_by(Entry.date.desc()).first()
        goals = Goal.query.filter_by(user_id=user_id).order_by(Goal.target_date).all()
        
        if not latest_entry or not goals:
            logger.warning(f"Cannot calculate progress for user {user_id}: missing entries or goals")
            return jsonify([])
        
        # Convert latest entry to dict to get calculated values
        latest_entry_dict = latest_entry.to_dict()
        latest_fat_percentage = latest_entry_dict.get('fat_percentage')
        latest_muscle_mass = latest_entry_dict.get('muscle_mass')
        
        results = []
        
        for goal in goals:
            # Calculate days between latest entry and goal
            days_remaining = (goal.target_date - latest_entry.date).days
            
            if days_remaining <= 0:
                # Goal date has passed
                logger.debug(f"Skipping goal ID {goal.id} as target date has passed")
                continue
            
            result = {
                'goal_id': goal.id,
                'target_date': goal.target_date.strftime('%Y-%m-%d'),
                'days_remaining': days_remaining,
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
        
        logger.debug(f"Calculated progress for {len(results)} goals for user {user_id}")
        return jsonify(results)
    except Exception as e:
        logger.error(f"Error calculating progress for user {user_id}: {str(e)}")
        return jsonify({"error": "Failed to calculate progress"}), 500

# Run the app
if __name__ == '__main__':
    # Use the same DEBUG_MODE variable defined at the top
    logger.info(f"Starting application with debug={DEBUG_MODE}")
    app.run(host='127.0.0.1', port=5001, debug=DEBUG_MODE) 