import sys
import os

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from weight_tracker import create_app
from weight_tracker.models import db, Account, User, Entry, Goal

app = create_app()

with app.app_context():
    # Create any new tables (e.g., Account)
    db.create_all()
    
    # Add account_id columns if they don't exist
    from sqlalchemy import text
    
    # For User table
    try:
        db.session.execute(text("ALTER TABLE user ADD COLUMN account_id INTEGER"))
        db.session.commit()
    except:
        db.session.rollback()  # Column might already exist
    
    # For Entry table
    try:
        db.session.execute(text("ALTER TABLE entry ADD COLUMN account_id INTEGER"))
        db.session.commit()
    except:
        db.session.rollback()
    
    # For Goal table
    try:
        db.session.execute(text("ALTER TABLE goal ADD COLUMN account_id INTEGER"))
        db.session.commit()
    except:
        db.session.rollback()
    
    # Now proceed with account creation and assignment
    username = input("Enter username for new account: ")
    password = input("Enter password: ")
    
    if Account.query.filter_by(username=username).first():
        print("Username taken")
        exit(1)
    
    account = Account(username=username)
    account.set_password(password)
    db.session.add(account)
    db.session.commit()
    
    # Assign all existing users, entries, goals to this account
    users = User.query.filter_by(account_id=None).all()
    for user in users:
        user.account_id = account.id
    
    entries = Entry.query.filter_by(account_id=None).all()
    for entry in entries:
        entry.account_id = account.id
    
    goals = Goal.query.filter_by(account_id=None).all()
    for goal in goals:
        goal.account_id = account.id
    
    db.session.commit()
    print(f"Data migrated to account {username} (ID: {account.id})") 