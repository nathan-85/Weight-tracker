from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from weight_tracker.utils import calculate_body_fat_percentage, calculate_muscle_mass

# Initialize SQLAlchemy instance
db = SQLAlchemy()

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
