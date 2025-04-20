"""
Script to create budgets for the next month.

This script can be run on a schedule (e.g., cron job) near the end of each month
to automatically create budget entries for the next month based on recurring budgets.
"""

import os
import sys
import argparse
from datetime import datetime
from flask import Flask

# Add parent directory to path to import from services
sys.path.append(os.path.abspath(os.path.dirname(os.path.dirname(__file__))))

from services.models import db
from services.db_service import DatabaseService


def create_next_month_budgets(db_path=None):
    """
    Create budgets for the next month based on recurring budgets from the current month.
    
    Args:
        db_path (str): Optional custom path for the database file
        
    Returns:
        List of newly created Budget objects
    """
    # Create a Flask app just for DB operations
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
    
    # Create next month's budgets
    with app.app_context():
        new_budgets = DatabaseService.create_next_month_budgets()
        
        # Get current and next month info for display
        today = datetime.now()
        current_month = today.month
        current_year = today.year
        
        next_month = current_month + 1 if current_month < 12 else 1
        next_year = current_year if next_month > 1 else current_year + 1
        
        # Convert month numbers to names for better output
        month_names = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ]
        current_month_name = month_names[current_month - 1]
        next_month_name = month_names[next_month - 1]
        
        if new_budgets:
            print(f"Successfully created {len(new_budgets)} budget entries for {next_month_name} {next_year}")
            
            # Display summary of created budgets
            for budget in new_budgets:
                print(f"  - {budget.category}: {budget.amount:.2f}")
        else:
            print(f"No budgets created. Budgets for {next_month_name} {next_year} may already exist.")

        return new_budgets


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Create budgets for the next month based on recurring budgets.')
    parser.add_argument('--db-path', type=str, help='Custom path for the database file')
    
    args = parser.parse_args()
    
    create_next_month_budgets(db_path=args.db_path)
