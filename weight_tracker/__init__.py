from flask import Flask, send_from_directory
from flask_cors import CORS
from weight_tracker.config import logger, SQLALCHEMY_DATABASE_URI, SQLALCHEMY_TRACK_MODIFICATIONS
from weight_tracker.models import db
from weight_tracker.routes import register_blueprints

def create_app():
    """Create and configure the Flask application"""
    # Initialize Flask app
    app = Flask(__name__, static_folder='../frontend/build', static_url_path='')
    CORS(app)
    
    # Configure SQLite database
    app.config['SQLALCHEMY_DATABASE_URI'] = SQLALCHEMY_DATABASE_URI
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = SQLALCHEMY_TRACK_MODIFICATIONS
    
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
    
    # Frontend serving route
    @app.route('/', methods=['GET'])
    def serve():
        return app.send_static_file('index.html')
    
    logger.info("Application initialized successfully")
    return app
