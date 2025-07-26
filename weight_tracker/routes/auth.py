from flask import Blueprint, request, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from weight_tracker.models import db, Account, User
from weight_tracker.config import logger

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.json
    if not data.get('username') or not data.get('password'):
        return jsonify({'error': 'Username and password required'}), 400
    
    if Account.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username taken'}), 409
    
    account = Account(username=data['username'])
    account.set_password(data['password'])
    db.session.add(account)
    db.session.commit()
    
    return jsonify({'message': 'Account created'}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    account = Account.query.filter_by(username=data.get('username')).first()
    if account and account.check_password(data.get('password')):
        login_user(account)
        return jsonify({'message': 'Logged in', 'account': account.to_dict()}), 200
    return jsonify({'error': 'Invalid credentials'}), 401

@auth_bp.route('/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({'message': 'Logged out'}), 200

@auth_bp.route('/status', methods=['GET'])
def status():
    if current_user.is_authenticated:
        return jsonify({'authenticated': True, 'account': current_user.to_dict()}), 200
    return jsonify({'authenticated': False}), 200 