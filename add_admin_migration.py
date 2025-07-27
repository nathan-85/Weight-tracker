#!/usr/bin/env python3
"""
Migration script to add is_admin column to Account table
Run this script to update existing databases with the new admin functionality.
"""

import sys
import os
from sqlalchemy import text

# Add the project root to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from weight_tracker import create_app
from weight_tracker.models import db

def add_admin_column():
    """Add is_admin column to Account table if it doesn't exist"""
    app = create_app()
    
    with app.app_context():
        try:
            # Check if column already exists (PostgreSQL version)
            result = db.session.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'account' AND column_name = 'is_admin'
            """))
            column_exists = result.fetchone() is not None
            
            if not column_exists:
                print("Adding is_admin column to Account table...")
                db.session.execute(text("ALTER TABLE account ADD COLUMN is_admin BOOLEAN DEFAULT FALSE NOT NULL"))
                db.session.commit()
                print("✅ Successfully added is_admin column")
                
                # Optionally, make the first account an admin
                first_account = db.session.execute(text("SELECT id, username FROM account ORDER BY id LIMIT 1")).fetchone()
                if first_account:
                    account_id, username = first_account
                    response = input(f"Make '{username}' (ID: {account_id}) an admin? (y/N): ").strip().lower()
                    if response in ['y', 'yes']:
                        db.session.execute(text("UPDATE account SET is_admin = TRUE WHERE id = :id"), {"id": account_id})
                        db.session.commit()
                        print(f"✅ Made '{username}' an admin")
            else:
                print("✅ is_admin column already exists")
                
        except Exception as e:
            print(f"❌ Error during migration: {e}")
            db.session.rollback()
            raise

if __name__ == "__main__":
    print("Weight Tracker - Admin Column Migration")
    print("=" * 40)
    add_admin_column()
    print("\nMigration completed!")
    print("\nTo make an account admin, you can either:")
    print("1. Run this script again to make the first account admin")
    print("2. Update directly in database: UPDATE account SET is_admin = TRUE WHERE username = 'your_username';")
    print("3. Use the admin endpoints once you have at least one admin account") 