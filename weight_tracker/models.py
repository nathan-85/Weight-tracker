from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

from weight_tracker.utils import calculate_body_fat_percentage, calculate_muscle_mass

# Initialize SQLAlchemy instance
# NOTE: the db object is used by other modules to initialise the app's database
# and must remain at module level


# SQLAlchemy instance used by the application
# It will be bound to the Flask app in the factory (create_app)
db = SQLAlchemy()


class User(db.Model):
    """
    Represents a registered user of the weight tracker application.

    Each user has a unique username and a hashed password used for authentication.
    Additional profile information such as their display name, age, sex and height
    is also stored.  The created_at timestamp records when the user registered.

    Relationships:
        entries (list[Entry]): weight/measurement entries made by this user.
        goals (list[Goal]): fitness/weight goals defined by this user.
    """
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)

    # optional profile fields
    name = db.Column(db.String(100), nullable=False)
    age = db.Column(db.Integer)
    sex = db.Column(db.String(10))  # 'male', 'female', or 'other'
    height = db.Column(db.Float)  # height in cm
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    # establish ORM relationships to entries and goals
    entries = db.relationship('Entry', backref='user', lazy=True)
    goals = db.relationship('Goal', backref='user', lazy=True)

    def set_password(self, password: str) -> None:
        """Hash and store a password for the user using Werkzeug's secure hash function."""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        """Check a plaintext password against the stored password hash."""
        return check_password_hash(self.password_hash, password)

    def to_dict(self) -> dict:
        """Return a serialisable representation of the user (excluding the password hash)."""
        return {
            'id': self.id,
            'username': self.username,
            'name': self.name,
            'age': self.age,
            'sex': self.sex,
            'height': self.height,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Entry(db.Model):
    """
    Represents a single measurement entry made by a user.

    Each entry records various body measurements at a particular date.  The
    user_id foreign key links the entry back to the user who created it.
    """
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    weight = db.Column(db.Float, nullable=False)  # weight in kg
    neck = db.Column(db.Float)  # neck circumference in cm
    belly = db.Column(db.Float)  # belly circumference in cm
    hip = db.Column(db.Float)  # hip circumference in cm for female users

    # associate entry with a user – must not be null now that authentication is required
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    def to_dict(self) -> dict:
        """Return a serialisable representation of this entry including derived metrics."""
        # Calculate values on-the-fly when converting to dict
        # Get user details if available (there should always be a user now)
        user = User.query.get(self.user_id) if self.user_id else None
        height = user.height if user else None
        gender = user.sex if user else None

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
    """
    Represents a goal set by a user, such as reaching a target weight or body fat
    percentage by a certain date.  Goals belong to users via the user_id foreign key.
    """
    id = db.Column(db.Integer, primary_key=True)

    target_date = db.Column(db.DateTime, nullable=False)
    target_weight = db.Column(db.Float)
    target_fat_percentage = db.Column(db.Float)
    target_muscle_mass = db.Column(db.Float)

    description = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    # Start date for goal tracking – optional.  If provided, progress tracking will
    # begin on this date; otherwise the created_at timestamp is used.
    start_date = db.Column(db.DateTime, nullable=True)

    def to_dict(self) -> dict:
        """Return a serialisable representation of this goal."""
        # If start_date is None, use created_at as fallback
        start_date_value = self.start_date if self.start_date else self.created_at

        return {
            'id': self.id,
            'target_date': self.target_date.strftime('%Y-%m-%d'),
            'target_weight': self.target_weight,
            'target_fat_percentage': self.target_fat_percentage,
            'target_muscle_mass': self.target_muscle_mass,
            'description': self.description if self.description is not None else '',
            'created_at': self.created_at.strftime('%Y-%m-%d'),
            'user_id': self.user_id,
            'start_date': start_date_value.strftime('%Y-%m-%d')
        }
