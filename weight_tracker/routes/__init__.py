from weight_tracker.routes.entries import entries_bp
from weight_tracker.routes.goals import goals_bp
from weight_tracker.routes.users import users_bp
from weight_tracker.routes.progress import progress_bp
from weight_tracker.routes.debug import debug_bp

def register_blueprints(app):
    app.register_blueprint(entries_bp)
    app.register_blueprint(goals_bp)
    app.register_blueprint(users_bp)
    app.register_blueprint(progress_bp)
    app.register_blueprint(debug_bp)
