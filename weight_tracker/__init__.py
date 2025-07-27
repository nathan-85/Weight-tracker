from flask import Flask, send_from_directory
from flask_cors import CORS
from weight_tracker.config import logger, SQLALCHEMY_DATABASE_URI, SQLALCHEMY_TRACK_MODIFICATIONS, SQLALCHEMY_ECHO
from weight_tracker.models import db
from weight_tracker.routes import register_blueprints
from flask_login import LoginManager
from weight_tracker.models import Account
import os

def create_app():
    """Create and configure the Flask application"""
    # Initialize Flask app
    app = Flask(__name__, static_folder='../frontend/build', static_url_path='')
    CORS(app)
    
    # Configure database
    app.config['SQLALCHEMY_DATABASE_URI'] = SQLALCHEMY_DATABASE_URI
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = SQLALCHEMY_TRACK_MODIFICATIONS
    
    # Enable SQL query logging for PostgreSQL on Render
    if SQLALCHEMY_DATABASE_URI.startswith('postgresql'):
        app.config['SQLALCHEMY_ECHO'] = SQLALCHEMY_ECHO
        logger.info(f"PostgreSQL query logging: {'enabled' if SQLALCHEMY_ECHO else 'disabled'}")
    
    # Initialize database
    db.init_app(app)
    
    # Create database tables
    with app.app_context():
        try:
            db.create_all()
            logger.info("Database tables created successfully")
        except Exception as e:
            logger.error(f"Error creating database tables: {str(e)}")
    
    # Register blueprints
    register_blueprints(app)

    # Add secret key
    app.secret_key = os.environ.get('SECRET_KEY', 'default-secret-key-for-dev')

    # Initialize Flask-Login
    login_manager = LoginManager()
    login_manager.init_app(app)
    login_manager.login_view = 'auth.login'

    @login_manager.user_loader
    def load_user(account_id):
        return Account.query.get(int(account_id))
    
    # Frontend serving route
    @app.route('/', methods=['GET'])
    def serve():
        return app.send_static_file('index.html')
    
    logger.info("Application initialized successfully")
    return app
