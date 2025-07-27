from flask import Blueprint, request, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from weight_tracker.models import db, Account, User, Entry, Goal
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

@auth_bp.route('/delete-account', methods=['DELETE'])
@login_required
def delete_account():
    try:
        account_id = current_user.id
        username = current_user.username
        
        logger.info(f"Starting account deletion for account ID: {account_id}, username: {username}")
        
        # Count data before deletion for logging
        user_count = User.query.filter_by(account_id=account_id).count()
        entry_count = Entry.query.filter_by(account_id=account_id).count()
        goal_count = Goal.query.filter_by(account_id=account_id).count()
        
        # Delete all entries associated with this account
        Entry.query.filter_by(account_id=account_id).delete()
        
        # Delete all goals associated with this account
        Goal.query.filter_by(account_id=account_id).delete()
        
        # Delete all users associated with this account
        User.query.filter_by(account_id=account_id).delete()
        
        # Log out the user before deleting the account
        logout_user()
        
        # Get the account from the database to delete it
        account = Account.query.get(account_id)
        if account:
            db.session.delete(account)
        
        db.session.commit()
        
        logger.info(f"Account deletion completed for {username}. Deleted: {user_count} users, {entry_count} entries, {goal_count} goals")
        
        return jsonify({'message': 'Account and all associated data deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting account: {e}")
        return jsonify({'error': 'Failed to delete account'}), 500 