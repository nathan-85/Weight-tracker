import os
import sys
import sqlite3
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def migrate_database():
    """
    Add hip column to Entry table for female user measurements
    """
    db_path = os.path.join('instance', 'weight_tracker.db')
    
    # Check if database exists
    if not os.path.exists(db_path):
        logger.error(f"Database not found at {db_path}")
        return False
    
    logger.info(f"Starting migration for database: {db_path}")
    
    try:
        # Connect to the database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if the 'hip' column already exists in the Entry table
        cursor.execute("PRAGMA table_info(entry);")
        columns = cursor.fetchall()
        column_names = [col[1] for col in columns]
        
        if 'hip' in column_names:
            logger.info("Hip column already exists in Entry table. No migration needed.")
            conn.close()
            return True
        
        # Add 'hip' column to Entry table
        logger.info("Adding 'hip' column to Entry table...")
        cursor.execute("ALTER TABLE entry ADD COLUMN hip FLOAT;")
        
        # Commit changes and close connection
        conn.commit()
        conn.close()
        
        logger.info("Migration completed successfully!")
        return True
        
    except sqlite3.Error as e:
        logger.error(f"SQLite error: {e}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return False

if __name__ == "__main__":
    success = migrate_database()
    if success:
        print("Migration completed successfully!")
        sys.exit(0)
    else:
        print("Migration failed. See logs for details.")
        sys.exit(1) 