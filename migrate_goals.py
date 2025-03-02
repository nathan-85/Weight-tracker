#!/usr/bin/env python3

import os
import sys
import sqlite3
from datetime import datetime

# Path to the SQLite database
DB_PATH = "instance/weight_tracker.db"

def log(message):
    """Log a message with timestamp"""
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {message}")

def migrate_goals():
    """Migrate goals to assign them to the default user (Nathan)"""
    try:
        # Check if database file exists
        if not os.path.exists(DB_PATH):
            log(f"Error: Database file not found at {DB_PATH}")
            return False
            
        # Connect to the database
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Check if user 'Nathan' exists, create if not
        cursor.execute("SELECT id FROM user WHERE name = ?", ("Nathan",))
        user = cursor.fetchone()
        
        if user:
            user_id = user[0]
            log(f"Found user 'Nathan' with ID: {user_id}")
        else:
            # Create the user 'Nathan'
            cursor.execute(
                "INSERT INTO user (name, created_at) VALUES (?, ?)",
                ("Nathan", datetime.utcnow())
            )
            conn.commit()
            user_id = cursor.lastrowid
            log(f"Created user 'Nathan' with ID: {user_id}")
        
        # Update all goals that have NULL user_id
        cursor.execute("SELECT COUNT(*) FROM goal WHERE user_id IS NULL")
        null_goals_count = cursor.fetchone()[0]
        
        if null_goals_count > 0:
            cursor.execute("UPDATE goal SET user_id = ? WHERE user_id IS NULL", (user_id,))
            conn.commit()
            log(f"Updated {null_goals_count} goals to user 'Nathan' (ID: {user_id})")
        else:
            log("No goals with NULL user_id found. No migration needed.")
        
        # Close connection
        conn.close()
        log("Migration completed successfully!")
        return True
        
    except Exception as e:
        log(f"Error during migration: {str(e)}")
        return False

if __name__ == "__main__":
    log("Starting goals migration...")
    success = migrate_goals()
    log(f"Migration {'successful' if success else 'failed'}")
    sys.exit(0 if success else 1) 