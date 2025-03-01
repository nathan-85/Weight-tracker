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
class Entry(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    weight = db.Column(db.Float, nullable=False)  # weight in kg
    neck = db.Column(db.Float)  # neck circumference in cm
    belly = db.Column(db.Float)  # belly circumference in cm
    # Remove calculated fields from database model
    # calculated_fat_percentage and calculated_muscle_mass are no longer stored

    def to_dict(self):
        # Calculate values on-the-fly when converting to dict
        fat_percentage = calculate_body_fat_percentage(
            self.weight, self.neck, self.belly
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
            'fat_percentage': fat_percentage,
            'muscle_mass': muscle_mass
        }

class Goal(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    target_date = db.Column(db.DateTime, nullable=False)
    target_weight = db.Column(db.Float)
    target_fat_percentage = db.Column(db.Float)
    target_muscle_mass = db.Column(db.Float)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'target_date': self.target_date.strftime('%Y-%m-%d'),
            'target_weight': self.target_weight,
            'target_fat_percentage': self.target_fat_percentage,
            'target_muscle_mass': self.target_muscle_mass,
            'created_at': self.created_at.strftime('%Y-%m-%d')
        }

# Create database tables
with app.app_context():
    try:
        db.create_all()
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Error creating database tables: {str(e)}")

# Helper functions for calculations
def calculate_body_fat_percentage(weight, neck, belly, height=185, gender='male'):
    """
    Calculate body fat percentage using the US Navy method.
    Default height is 185cm, and default gender is male.
    For a more accurate calculation, the app should collect height and gender from the user.
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
        # For females, we would need hip measurement, but we'll use a simplified formula
        # using just the available measurements
        body_fat = 163.205 * np.log10(belly_inches - neck_inches) - 97.684 * np.log10(height_inches) - 78.387
    
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
        logger.info("Processing POST request for new entry")
        data = request.json
        logger.debug(f"Received entry data: {data}")
        
        # Only store user-entered values, not calculated ones
        new_entry = Entry(
            date=datetime.strptime(data.get('date', datetime.utcnow().strftime('%Y-%m-%d')), '%Y-%m-%d'),
            weight=data.get('weight'),
            neck=data.get('neck'),
            belly=data.get('belly')
            # No longer storing calculated values
        )
        
        db.session.add(new_entry)
        db.session.commit()
        logger.info(f"New entry saved successfully with ID: {new_entry.id}")
        
        # Return the entry with calculated values included
        return jsonify(new_entry.to_dict()), 201
    except Exception as e:
        logger.error(f"Error adding entry: {str(e)}")
        return jsonify({"error": "Failed to add entry"}), 500

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
        logger.info("Processing POST request for new goal")
        data = request.json
        logger.debug(f"Received goal data: {data}")
        
        new_goal = Goal(
            target_date=datetime.strptime(data.get('target_date'), '%Y-%m-%d'),
            target_weight=data.get('target_weight'),
            target_fat_percentage=data.get('target_fat_percentage'),
            target_muscle_mass=data.get('target_muscle_mass')
        )
        
        db.session.add(new_goal)
        db.session.commit()
        logger.info(f"New goal saved successfully with ID: {new_goal.id}")
        
        return jsonify(new_goal.to_dict()), 201
    except Exception as e:
        logger.error(f"Error adding goal: {str(e)}")
        return jsonify({"error": "Failed to add goal"}), 500

@app.route('/api/goals/<int:goal_id>', methods=['DELETE'])
def delete_goal(goal_id):
    try:
        logger.info(f"Processing DELETE request for goal ID: {goal_id}")
        goal = Goal.query.get_or_404(goal_id)
        db.session.delete(goal)
        db.session.commit()
        logger.info(f"Goal ID {goal_id} deleted successfully")
        return '', 204
    except Exception as e:
        logger.error(f"Error deleting goal ID {goal_id}: {str(e)}")
        return jsonify({"error": "Failed to delete goal"}), 500

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

# Run the app
if __name__ == '__main__':
    # Use the same DEBUG_MODE variable defined at the top
    logger.info(f"Starting application with debug={DEBUG_MODE}")
    app.run(host='127.0.0.1', port=5001, debug=DEBUG_MODE) 