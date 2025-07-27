from flask import Flask, send_from_directory, jsonify
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
    # Use absolute path to ensure it works regardless of working directory
    import os
    static_folder = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'build')
    app = Flask(__name__, static_folder=static_folder, static_url_path='')
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
    
    # Add secret key
    app.secret_key = os.environ.get('SECRET_KEY', 'default-secret-key-for-dev')

    # Initialize Flask-Login
    login_manager = LoginManager()
    login_manager.init_app(app)
    login_manager.login_view = 'auth.login'

    @login_manager.user_loader
    def load_user(account_id):
        return Account.query.get(int(account_id))
    
    # Register blueprints BEFORE frontend routes
    register_blueprints(app)
    
    # Frontend serving route
    @app.route('/', methods=['GET'])
    def serve():
        return app.send_static_file('index.html')
    
    # Frontend routes - serve React app for all frontend paths
    frontend_routes = [
        '/goals', '/profile', '/settings', '/progress', '/new-entry', '/login', '/register', '/debug', '/admin',
        '/profile/new', '/profile/edit/<int:user_id>', '/edit-entry/<int:entry_id>'
    ]
    
    def serve_frontend():
        try:
            return app.send_static_file('index.html')
        except Exception as e:
            logger.error(f"Error serving frontend: {str(e)}")
            return jsonify({'error': 'Frontend not found'}), 404
    
    # Register each frontend route explicitly
    for route in frontend_routes:
        app.add_url_rule(route, f'frontend_{route.replace("/", "").replace("-", "_")}', serve_frontend, methods=['GET'])
    
    # Catch-all route for any other paths
    @app.route('/<path:path>', methods=['GET'])
    def catch_all(path):
        logger.info(f"Catch-all route hit with path: {path}")
        # Don't serve React app for API routes
        if path.startswith('api/'):
            return jsonify({'error': 'Not found'}), 404
        # Serve React app for all other routes
        return serve_frontend()
    
    logger.info("Application initialized successfully")
    return app
