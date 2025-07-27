#!/usr/bin/env python3
"""
WSGI entry point for production deployment with Gunicorn.
This file creates the Flask application instance that Gunicorn can serve.
"""

from weight_tracker import create_app

# Create the Flask application instance
application = create_app()

# For backwards compatibility, also expose as 'app'
app = application

if __name__ == "__main__":
    # This allows the file to be run directly for testing
    application.run() 