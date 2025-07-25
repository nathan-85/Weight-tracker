from flask import Blueprint, request, session, jsonify
from weight_tracker.models import db, User

# Blueprint for authentication routes
auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/api/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    username = data.get('username')
    password = data.get('password')
    name = data.get('name')
    age = data.get('age')
    sex = data.get('sex')
    height = data.get('height')

    # Validate required fields
    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400

    # Ensure username is unique
    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already taken'}), 400

    # Create user and hash password
    user = User(username=username, name=name or username, age=age, sex=sex, height=height)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    # Log the user in by storing their ID in the session
    session['user_id'] = user.id
    return jsonify({'message': 'User registered', 'user': user.to_dict()}), 201

@auth_bp.route('/api/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username).first()
    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid credentials'}), 401

    session['user_id'] = user.id
    return jsonify({'message': 'Logged in', 'user': user.to_dict()})

@auth_bp.route('/api/logout', methods=['POST'])
def logout():
    # Remove user ID from session
    session.pop('user_id', None)
    return jsonify({'message': 'Logged out'})

@auth_bp.route('/api/status', methods=['GET'])
def status():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'logged_in': False}), 200
    user = User.query.get(user_id)
    return jsonify({'logged_in': True, 'user': user.to_dict()})
