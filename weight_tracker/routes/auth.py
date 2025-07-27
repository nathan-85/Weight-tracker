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

@auth_bp.route('/admin/delete-account/<int:account_id>', methods=['DELETE'])
@login_required
def admin_delete_account(account_id):
    try:
        # Check if current user is admin
        if not current_user.is_admin:
            logger.warning(f"Non-admin user {current_user.username} attempted to delete account {account_id}")
            return jsonify({'error': 'Unauthorized - Admin access required'}), 403
        
        # Find the account to delete
        account = Account.query.get(account_id)
        if not account:
            return jsonify({'error': 'Account not found'}), 404
        
        # Prevent admin from deleting their own account
        if account_id == current_user.id:
            return jsonify({'error': 'Cannot delete your own admin account'}), 400
            
        username = account.username
        logger.info(f"Admin {current_user.username} starting deletion of account ID: {account_id}, username: {username}")
        
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
        
        # Delete the account itself
        db.session.delete(account)
        db.session.commit()
        
        logger.info(f"Admin {current_user.username} successfully deleted account {username}. Deleted: {user_count} users, {entry_count} entries, {goal_count} goals")
        
        return jsonify({
            'message': f'Account {username} deleted successfully',
            'deleted_data': {
                'users': user_count,
                'entries': entry_count,
                'goals': goal_count
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Admin account deletion error: {e}")
        return jsonify({'error': 'Failed to delete account'}), 500

@auth_bp.route('/admin/accounts', methods=['GET'])
@login_required
def admin_list_accounts():
    try:
        # Check if current user is admin
        if not current_user.is_admin:
            return jsonify({'error': 'Unauthorized - Admin access required'}), 403
        
        # Get all accounts with user counts
        accounts = db.session.query(
            Account.id,
            Account.username,
            Account.is_admin,
            Account.created_at,
            db.func.count(User.id).label('user_count')
        ).outerjoin(User).group_by(Account.id).order_by(Account.id.desc()).all()
        
        account_list = []
        for account in accounts:
            account_list.append({
                'id': account.id,
                'username': account.username,
                'is_admin': account.is_admin,
                'created_at': account.created_at.isoformat() if account.created_at else None,
                'user_count': account.user_count
            })
        
        return jsonify({'accounts': account_list}), 200
        
    except Exception as e:
        logger.error(f"Error listing accounts: {e}")
        return jsonify({'error': 'Failed to fetch accounts'}), 500 