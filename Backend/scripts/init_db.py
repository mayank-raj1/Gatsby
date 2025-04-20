"""
Database initialization script for the Finance Tracker application.

This script initializes the database schema and can optionally seed it with sample data.
It should be run once to create the database, not on every application startup.
"""

import os
import sys
import argparse
from flask import Flask
from services.models import db
from services.db_service import DatabaseService


def init_db(seed=False, db_path=None):
    """
    Initialize the database schema and optionally seed it with sample data.
    
    Args:
        seed (bool): Whether to seed the database with sample data
        db_path (str): Optional custom path for the database file
        
    Returns:
        None
    """
    # Create a Flask app just for DB initialization
    app = Flask(__name__)
    
    # Configure SQLite database
    basedir = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
    
    if db_path:
        # Use provided database path
        app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
    else:
        # Use default database path
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'finance.db')
        
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Initialize with database
    DatabaseService.initialize_app(app)
    
    # Create tables
    with app.app_context():
        db.create_all()
        print("Database tables created successfully.")
        
        if seed:
            # Seed the database with sample data
            result = DatabaseService.seed_data()
            print(f"Database seeded with:")
            print(f"  - {result['transactions']} transactions")
            print(f"  - {result['budgets']} budgets")
            print(f"  - {result['savings_goals']} savings goals")
            print(f"  - {result['merchant_mappings']} merchant mappings")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Initialize the Finance Tracker database.')
    parser.add_argument('--seed', action='store_true', help='Seed the database with sample data')
    parser.add_argument('--db-path', type=str, help='Custom path for the database file')
    
    args = parser.parse_args()
    
    init_db(seed=args.seed, db_path=args.db_path)
    
    print("\nDatabase initialization complete.")
    print("You can now run the Flask application with 'python app.py'.")
