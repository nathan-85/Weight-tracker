#!/usr/bin/env python3
"""
Database Sequence Fix Script

This script fixes PostgreSQL sequence issues that cause duplicate key violations.
Run this when you encounter "duplicate key value violates unique constraint" errors.

Usage:
    python fix_sequences.py
"""

import os
import sys
from sqlalchemy import create_engine, text
from weight_tracker.config import SQLALCHEMY_DATABASE_URI, logger

def fix_database_sequences():
    """Fix PostgreSQL sequences to match current max IDs"""
    try:
        # Create database engine
        engine = create_engine(SQLALCHEMY_DATABASE_URI)
        
        # Check if we're using PostgreSQL
        if 'postgresql' not in str(engine.url.drivername):
            print("❌ This script only works with PostgreSQL databases")
            print(f"   Current database: {engine.url.drivername}")
            return False
        
        print("🔧 Fixing database sequences...")
        print(f"   Database: {engine.url.database}")
        
        tables = ['entry', 'goal', 'user', 'account']
        
        with engine.connect() as conn:
            for table_name in tables:
                try:
                    print(f"\n📋 Processing table: {table_name}")
                    
                    # Get current max ID
                    max_id_result = conn.execute(text(f"SELECT MAX(id) FROM {table_name}"))
                    max_id = max_id_result.scalar()
                    
                    if max_id is None:
                        max_id = 0
                        print(f"   ℹ️  Table is empty, setting sequence to 1")
                    else:
                        print(f"   📊 Current max ID: {max_id}")
                    
                    # Set sequence to max_id + 1
                    new_seq_val = max_id + 1
                    sequence_name = f"{table_name}_id_seq"
                    
                    conn.execute(text(f"SELECT setval('{sequence_name}', {new_seq_val})"))
                    print(f"   ✅ Sequence '{sequence_name}' set to {new_seq_val}")
                    
                except Exception as e:
                    print(f"   ❌ Error with table {table_name}: {str(e)}")
            
            # Commit the changes
            conn.commit()
        
        print("\n🎉 Database sequence fix completed successfully!")
        print("   You can now add new entries without duplicate key errors.")
        return True
        
    except Exception as e:
        print(f"❌ Error fixing sequences: {str(e)}")
        return False

def check_sequence_status():
    """Check current sequence status"""
    try:
        engine = create_engine(SQLALCHEMY_DATABASE_URI)
        
        if 'postgresql' not in str(engine.url.drivername):
            print("This is not a PostgreSQL database")
            return
        
        print("📊 Current Database Status:")
        print(f"   Database: {engine.url.database}")
        
        tables = ['entry', 'goal', 'user', 'account']
        
        with engine.connect() as conn:
            for table_name in tables:
                try:
                    # Get max ID
                    max_id_result = conn.execute(text(f"SELECT MAX(id) FROM {table_name}"))
                    max_id = max_id_result.scalar() or 0
                    
                    # Get sequence current value
                    seq_result = conn.execute(text(f"SELECT currval('{table_name}_id_seq')"))
                    seq_val = seq_result.scalar()
                    
                    # Get next sequence value (without incrementing)
                    next_result = conn.execute(text(f"SELECT nextval('{table_name}_id_seq')"))
                    next_val = next_result.scalar()
                    
                    # Reset sequence back to what it was
                    conn.execute(text(f"SELECT setval('{table_name}_id_seq', {seq_val})"))
                    
                    status = "🟢 OK" if next_val > max_id else "🔴 NEEDS FIX"
                    print(f"\n📋 {table_name}:")
                    print(f"   Max ID: {max_id}")
                    print(f"   Next sequence value: {next_val}")
                    print(f"   Status: {status}")
                    
                except Exception as e:
                    print(f"\n📋 {table_name}: Error - {str(e)}")
                    
    except Exception as e:
        print(f"Error checking status: {str(e)}")

if __name__ == "__main__":
    print("🔍 Weight Tracker Database Sequence Fixer")
    print("=" * 50)
    
    # Check if we have a database URL
    if not SQLALCHEMY_DATABASE_URI:
        print("❌ No database URL found. Please check your configuration.")
        sys.exit(1)
    
    if len(sys.argv) > 1 and sys.argv[1] == "status":
        check_sequence_status()
    else:
        print("Checking current status first...\n")
        check_sequence_status()
        
        print("\n" + "=" * 50)
        response = input("Do you want to fix the sequences? (y/N): ")
        
        if response.lower() in ['y', 'yes']:
            success = fix_database_sequences()
            if success:
                print("\n🔍 Verifying fix...")
                check_sequence_status()
            sys.exit(0 if success else 1)
        else:
            print("No changes made.") 