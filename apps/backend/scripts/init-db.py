#!/usr/bin/env python3
"""
Database initialization script using Python + SQLite3
Creates PathLife database with all required tables
"""

import sqlite3
import os
import sys

def init_database():
    # Paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.dirname(script_dir)
    db_path = os.path.join(backend_dir, 'pathlife.db')
    sql_path = os.path.join(backend_dir, 'init-db.sql')

    print('PathLife Database Initialization')
    print('=' * 50)
    print(f'\nDatabase path: {db_path}')
    print(f'SQL script: {sql_path}\n')

    # Check if SQL file exists
    if not os.path.exists(sql_path):
        print(f'Error: {sql_path} not found!')
        sys.exit(1)

    # Read SQL script
    with open(sql_path, 'r') as f:
        sql_script = f.read()

    # Create/connect to database
    print('Creating database...')
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # Execute SQL script
        print('Executing SQL schema...')
        cursor.executescript(sql_script)
        conn.commit()
        print('✓ Database schema created successfully!')

        # Verify tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        print(f'\n✓ Created {len(tables)} tables:')
        for table in tables:
            print(f'  - {table[0]}')

        print(f'\n✓ Database initialized at: {db_path}')
        print('\nYou can now start the application!')

    except sqlite3.Error as e:
        print(f'\n✗ Error creating database: {e}')
        sys.exit(1)

    finally:
        conn.close()

if __name__ == '__main__':
    init_database()
