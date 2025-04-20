"""
Main Flask application Flask.

This module provides the REST API endpoints for the Finance Tracker application.
The database schema should be initialized separately using scripts/init_db.py.
"""

import os
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
import argparse

from services.models import db
from services.db_service import DatabaseService

# Create Flask application
app = Flask(__name__)
# Replace this line:
# CORS(app)  # Enable CORS for all routes

# With this more specific configuration:
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:8080"]}})

# Configure SQLite database
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'finance.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize the database with our app (doesn't create tables)
DatabaseService.initialize_app(app)


# Routes for transactions
@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    """Get all transactions."""
    transactions = DatabaseService.get_all_transactions()
    return jsonify([transaction.to_dict() for transaction in transactions])


@app.route('/api/transactions/<transaction_id>', methods=['GET'])
def get_transaction(transaction_id):
    """Get a transaction by ID."""
    transaction = DatabaseService.get_transaction_by_id(transaction_id)
    if not transaction:
        return jsonify({"error": "Transaction not found"}), 404
    return jsonify(transaction.to_dict())


@app.route('/api/transactions', methods=['POST'])
def create_transaction():
    """Create a new transaction."""
    data = request.json
    transaction = DatabaseService.create_transaction(data)
    return jsonify(transaction.to_dict()), 201


@app.route('/api/transactions/<transaction_id>', methods=['PUT'])
def update_transaction(transaction_id):
    """Update an existing transaction."""
    data = request.json
    transaction = DatabaseService.update_transaction(transaction_id, data)
    if not transaction:
        return jsonify({"error": "Transaction not found"}), 404
    return jsonify(transaction.to_dict())


@app.route('/api/transactions/<transaction_id>', methods=['DELETE'])
def delete_transaction(transaction_id):
    """Delete a transaction."""
    success = DatabaseService.delete_transaction(transaction_id)
    if not success:
        return jsonify({"error": "Transaction not found"}), 404
    return '', 204


# Routes for budgets
@app.route('/api/budgets', methods=['GET'])
def get_budgets():
    """
    Get all budgets, optionally filtered by month and year.

    Query parameters:
    - month: Optional month (1-12)
    - year: Optional year
    """
    month = request.args.get('month', type=int)
    year = request.args.get('year', type=int)

    # If month is provided but year is not, use current year
    if month is not None and year is None:
        year = datetime.now().year

    budgets = DatabaseService.get_all_budgets(month, year)
    return jsonify([budget.to_dict() for budget in budgets])


@app.route('/api/budgets/current', methods=['GET'])
def get_current_budgets():
    """Get budgets for the current month and year."""
    today = datetime.now()
    budgets = DatabaseService.get_all_budgets(today.month, today.year)
    return jsonify([budget.to_dict() for budget in budgets])


@app.route('/api/budgets/period/<int:year>/<int:month>', methods=['GET'])
def get_budgets_by_period(year, month):
    """Get budgets for a specific month and year."""
    if month < 1 or month > 12:
        return jsonify({"error": "Invalid month. Must be between 1 and 12."}), 400

    budgets = DatabaseService.get_all_budgets(month, year)
    return jsonify([budget.to_dict() for budget in budgets])


@app.route('/api/budgets/<budget_id>', methods=['GET'])
def get_budget(budget_id):
    """Get a budget by ID."""
    budget = DatabaseService.get_budget_by_id(budget_id)
    if not budget:
        return jsonify({"error": "Budget not found"}), 404
    return jsonify(budget.to_dict())


@app.route('/api/budgets', methods=['POST'])
def create_budget():
    """Create a new budget."""
    data = request.json
    budget = DatabaseService.create_budget(data)
    return jsonify(budget.to_dict()), 201


@app.route('/api/budgets/<budget_id>', methods=['PUT'])
def update_budget(budget_id):
    """Update an existing budget."""
    data = request.json
    budget = DatabaseService.update_budget(budget_id, data)
    if not budget:
        return jsonify({"error": "Budget not found"}), 404
    return jsonify(budget.to_dict())


@app.route('/api/budgets/<budget_id>', methods=['DELETE'])
def delete_budget(budget_id):
    """Delete a budget."""
    success = DatabaseService.delete_budget(budget_id)
    if not success:
        return jsonify({"error": "Budget not found"}), 404
    return '', 204


@app.route('/api/budgets/create-next-month', methods=['POST'])
def create_next_month_budgets():
    """Create budgets for the next month based on recurring budgets from the current month."""
    new_budgets = DatabaseService.create_next_month_budgets()
    return jsonify({
        "message": f"Created {len(new_budgets)} budgets for next month",
        "budgets": [budget.to_dict() for budget in new_budgets]
    }), 201


# Routes for savings goals
@app.route('/api/savings-goals', methods=['GET'])
def get_savings_goals():
    """Get all savings goals."""
    goals = DatabaseService.get_all_savings_goals()
    return jsonify([goal.to_dict() for goal in goals])


@app.route('/api/savings-goals/<goal_id>', methods=['GET'])
def get_savings_goal(goal_id):
    """Get a savings goal by ID."""
    goal = DatabaseService.get_savings_goal_by_id(goal_id)
    if not goal:
        return jsonify({"error": "Savings goal not found"}), 404
    return jsonify(goal.to_dict())


@app.route('/api/savings-goals', methods=['POST'])
def create_savings_goal():
    """Create a new savings goal."""
    data = request.json
    goal = DatabaseService.create_savings_goal(data)
    return jsonify(goal.to_dict()), 201


@app.route('/api/savings-goals/<goal_id>', methods=['PUT'])
def update_savings_goal(goal_id):
    """Update an existing savings goal."""
    data = request.json
    goal, transaction = DatabaseService.update_savings_goal(goal_id, data)
    if not goal:
        return jsonify({"error": "Savings goal not found"}), 404
    return jsonify(goal.to_dict())


@app.route('/api/savings-goals/<goal_id>', methods=['DELETE'])
def delete_savings_goal(goal_id):
    """Delete a savings goal."""
    success, _ = DatabaseService.delete_savings_goal(goal_id)
    if not success:
        return jsonify({"error": "Savings goal not found"}), 404
    return '', 204


# Routes for merchant mappings
@app.route('/api/merchant-mappings', methods=['GET'])
def get_merchant_mappings():
    """Get all merchant mappings."""
    mappings = DatabaseService.get_all_merchant_mappings()
    return jsonify(mappings)


@app.route('/api/merchant-mappings/<raw_name>', methods=['GET'])
def get_merchant_mapping(raw_name):
    """Get a merchant mapping by raw name."""
    mapping = DatabaseService.get_merchant_mapping_by_raw_name(raw_name)
    if not mapping:
        return jsonify({"error": "Merchant mapping not found"}), 404
    return jsonify(mapping.to_dict())


@app.route('/api/merchant-mappings', methods=['POST'])
def create_merchant_mapping():
    """Create a new merchant mapping."""
    data = request.json
    mapping = DatabaseService.add_merchant_mapping(
        data['raw_name'], data['display_name'], data['category']
    )
    return jsonify(mapping.to_dict()), 201


@app.route('/api/merchant-mappings/<raw_name>', methods=['DELETE'])
def delete_merchant_mapping(raw_name):
    """Delete a merchant mapping."""
    success = DatabaseService.delete_merchant_mapping(raw_name)
    if not success:
        return jsonify({"error": "Merchant mapping not found"}), 404
    return '', 204


# Summary endpoint
@app.route('/api/summary', methods=['GET'])
def get_summary():
    """Get a summary of financial data."""
    summary = DatabaseService.get_financial_summary()
    return jsonify(summary)


# Seed data endpoint (for development)
@app.route('/api/seed', methods=['POST'])
def seed_data():
    """Seed the database with sample data."""
    result = DatabaseService.seed_data()
    return jsonify({"message": "Sample data seeded successfully", "counts": result})


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Run the Finance Tracker API.')
    parser.add_argument('--host', type=str, default='localhost', help='Host to bind to')
    parser.add_argument('--port', type=int, default=8080, help='Port to bind to')
    parser.add_argument('--debug', action='store_true', help='Run in debug mode')

    args = parser.parse_args()

    app.run(host=args.host, port=args.port, debug=args.debug)