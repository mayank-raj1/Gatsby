"""
Database service for the Finance Tracker application.

This module provides a service layer for database operations,
centralizing all database access in one place.
"""
from datetime import datetime
from .models import db, Transaction, Budget, SavingsGoal, MerchantMapping, generate_id


class DatabaseService:
    """
    Service class for database operations.
    Provides methods for CRUD operations on all models.
    """
    
    @staticmethod
    def initialize_app(app):
        """
        Initialize the Flask app with the database.
        
        Args:
            app: Flask application instance
        """
        db.init_app(app)

    # Transaction methods
    @staticmethod
    def get_all_transactions():
        """Get all transactions ordered by date descending."""
        return Transaction.query.order_by(Transaction.date.desc()).all()
    
    @staticmethod
    def get_transaction_by_id(transaction_id):
        """Get a transaction by ID."""
        return Transaction.query.get(transaction_id)
    
    @staticmethod
    def create_transaction(data):
        """
        Create a new transaction.
        
        Args:
            data: Dictionary containing transaction data
            
        Returns:
            The created Transaction object
        """
        # Convert date string to datetime
        date = datetime.fromisoformat(data['date'].replace('Z', '+00:00'))
        
        transaction = Transaction(
            id=generate_id(),
            amount=data['amount'],
            description=data['description'],
            comments=data.get('comments', ''),
            category=data['category'],
            type=data['type'],
            date=date,
            raw_merchant=data.get('raw_merchant', None)
        )
        
        # Handle tags
        transaction.tags = data.get('tags', [])
        
        # If it's an expense, update the corresponding budget for the transaction's month/year
        if data['type'] == 'expense':
            transaction_month = date.month
            transaction_year = date.year

            # Find budget for this category and month/year
            budget = DatabaseService.get_budget_by_category_and_period(
                data['category'],
                transaction_month,
                transaction_year
            )

            # Update the budget if found
            if budget:
                budget.spent += data['amount']
            else:
                # Optionally create a budget if it doesn't exist
                # Uncomment this if you want to automatically create budgets
                # when transactions are added to a category without a budget
                """
                DatabaseService.create_budget({
                    'category': data['category'],
                    'amount': data['amount'] * 2,  # Just an estimate
                    'month': transaction_month,
                    'year': transaction_year
                })
                """
                pass

        db.session.add(transaction)
        db.session.commit()
        return transaction

    @staticmethod
    def update_transaction(transaction_id, data):
        """
        Update an existing transaction.

        Args:
            transaction_id: ID of the transaction to update
            data: Dictionary containing updated transaction data

        Returns:
            The updated Transaction object
        """
        transaction = Transaction.query.get(transaction_id)
        if not transaction:
            return None

        # Store original values for comparison
        orig_amount = transaction.amount
        orig_category = transaction.category
        orig_date = transaction.date
        orig_month = orig_date.month
        orig_year = orig_date.year

        # Handle basic field updates
        if 'description' in data:
            transaction.description = data['description']

        if 'comments' in data:
            transaction.comments = data['comments']

        if 'tags' in data:
            transaction.tags = data['tags']

        # Handle date change
        new_date = None
        if 'date' in data:
            new_date = datetime.fromisoformat(data['date'].replace('Z', '+00:00'))
            transaction.date = new_date

        # If this is an expense transaction, we need to handle budget updates
        if transaction.type == 'expense':
            # Get new month/year if date changed
            new_month = new_date.month if new_date else orig_month
            new_year = new_date.year if new_date else orig_year

            # If amount changed, update the budget
            if 'amount' in data and data['amount'] != orig_amount:
                # Get the budget for original month/year and category
                old_budget = DatabaseService.get_budget_by_category_and_period(
                    orig_category, orig_month, orig_year
                )
                if old_budget:
                    old_budget.spent = max(0, old_budget.spent - orig_amount)

                # Update amount for the transaction
                transaction.amount = data['amount']

                # If we're updating the category as well, use the new category
                category_to_use = data.get('category', orig_category)

                # Get the budget for the target month/year and category
                target_budget = DatabaseService.get_budget_by_category_and_period(
                    category_to_use, new_month, new_year
                )
                if target_budget:
                    target_budget.spent += data['amount']

            # If category changed but amount didn't, need to move the amount between budgets
            elif 'category' in data and data['category'] != orig_category:
                # Remove from old budget
                old_budget = DatabaseService.get_budget_by_category_and_period(
                    orig_category, orig_month, orig_year
                )
                if old_budget:
                    old_budget.spent = max(0, old_budget.spent - orig_amount)

                # Add to new budget
                new_budget = DatabaseService.get_budget_by_category_and_period(
                    data['category'], new_month, new_year
                )
                if new_budget:
                    new_budget.spent += orig_amount

                # Update category
                transaction.category = data['category']

            # If only the date changed (which affects month/year), move the amount between budgets
            elif new_date and (new_month != orig_month or new_year != orig_year):
                # Remove from old budget
                old_budget = DatabaseService.get_budget_by_category_and_period(
                    orig_category, orig_month, orig_year
                )
                if old_budget:
                    old_budget.spent = max(0, old_budget.spent - orig_amount)

                # Add to new budget
                new_budget = DatabaseService.get_budget_by_category_and_period(
                    orig_category, new_month, new_year
                )
                if new_budget:
                    new_budget.spent += orig_amount

            # If we're changing both category and date, it gets more complex
            elif ('category' in data and data['category'] != orig_category) and \
                 new_date and (new_month != orig_month or new_year != orig_year):
                # Remove from old budget (original category, original month/year)
                old_budget = DatabaseService.get_budget_by_category_and_period(
                    orig_category, orig_month, orig_year
                )
                if old_budget:
                    old_budget.spent = max(0, old_budget.spent - orig_amount)

                # Add to new budget (new category, new month/year)
                new_budget = DatabaseService.get_budget_by_category_and_period(
                    data['category'], new_month, new_year
                )
                if new_budget:
                    new_budget.spent += orig_amount

                # Update category
                transaction.category = data['category']
        else:
            # For non-expense transactions, handle fields normally
            if 'amount' in data:
                transaction.amount = data['amount']

            if 'category' in data:
                transaction.category = data['category']

        db.session.commit()
        return transaction

    @staticmethod
    def delete_transaction(transaction_id):
        """
        Delete a transaction.

        Args:
            transaction_id: ID of the transaction to delete

        Returns:
            True if successful, False otherwise
        """
        transaction = Transaction.query.get(transaction_id)
        if not transaction:
            return False

        # If it's an expense, update the budget for that specific month/year
        if transaction.type == 'expense':
            transaction_month = transaction.date.month
            transaction_year = transaction.date.year

            budget = DatabaseService.get_budget_by_category_and_period(
                transaction.category,
                transaction_month,
                transaction_year
            )

            if budget:
                budget.spent = max(0, budget.spent - transaction.amount)

        db.session.delete(transaction)
        db.session.commit()
        return True

    # Budget methods
    @staticmethod
    def get_all_budgets(month=None, year=None):
        """
        Get all budgets, optionally filtered by month and year.

        Args:
            month: Optional month (1-12) to filter by
            year: Optional year to filter by

        Returns:
            List of Budget objects
        """
        query = Budget.query

        # Filter by month and year if provided
        if month is not None and year is not None:
            query = query.filter_by(month=month, year=year)

        # Order by category
        return query.order_by(Budget.category).all()

    @staticmethod
    def get_budget_by_id(budget_id):
        """Get a budget by ID."""
        return Budget.query.get(budget_id)

    @staticmethod
    def get_budget_by_category_and_period(category, month, year):
        """
        Get a budget by category for a specific month and year.

        Args:
            category: Budget category
            month: Month (1-12)
            year: Year

        Returns:
            Budget object or None if not found
        """
        return Budget.query.filter_by(
            category=category,
            month=month,
            year=year
        ).first()

    @staticmethod
    def create_budget(data):
        """
        Create a new budget.

        Args:
            data: Dictionary containing budget data

        Returns:
            The created Budget object
        """
        # If month/year not provided, use current month/year
        today = datetime.now()
        month = data.get('month', today.month)
        year = data.get('year', today.year)

        budget = Budget(
            id=generate_id(),
            category=data['category'],
            amount=data['amount'],
            spent=0,
            month=month,
            year=year,
            recurring=data.get('recurring', True)
        )

        db.session.add(budget)
        db.session.commit()
        return budget

    @staticmethod
    def update_budget(budget_id, data):
        """
        Update an existing budget.

        Args:
            budget_id: ID of the budget to update
            data: Dictionary containing updated budget data

        Returns:
            The updated Budget object
        """
        budget = Budget.query.get(budget_id)
        if not budget:
            return None

        if 'amount' in data:
            budget.amount = data['amount']

        if 'spent' in data:
            budget.spent = data['spent']

        if 'recurring' in data:
            budget.recurring = data['recurring']

        if 'month' in data:
            budget.month = data['month']

        if 'year' in data:
            budget.year = data['year']

        db.session.commit()
        return budget

    @staticmethod
    def delete_budget(budget_id):
        """
        Delete a budget.

        Args:
            budget_id: ID of the budget to delete

        Returns:
            True if successful, False otherwise
        """
        budget = Budget.query.get(budget_id)
        if not budget:
            return False

        db.session.delete(budget)
        db.session.commit()
        return True

    @staticmethod
    def create_next_month_budgets():
        """
        Create budget entries for the next month based on recurring budgets from the current month.

        Returns:
            List of newly created Budget objects
        """
        # Get current month and year
        today = datetime.now()
        current_month = today.month
        current_year = today.year

        # Calculate next month and year
        next_month = current_month + 1 if current_month < 12 else 1
        next_year = current_year if next_month > 1 else current_year + 1

        # Check if budgets already exist for next month
        existing_next_month = Budget.query.filter_by(month=next_month, year=next_year).first()
        if existing_next_month:
            # Budgets already exist for next month
            return []

        # Get current month's recurring budgets
        current_budgets = Budget.query.filter_by(
            month=current_month,
            year=current_year,
            recurring=True
        ).all()

        # Create new budgets for next month
        new_budgets = []
        for budget in current_budgets:
            new_budget = Budget(
                id=generate_id(),
                category=budget.category,
                amount=budget.amount,
                spent=0,
                month=next_month,
                year=next_year,
                recurring=budget.recurring
            )
            db.session.add(new_budget)
            new_budgets.append(new_budget)

        db.session.commit()
        return new_budgets

    # Savings goal methods
    @staticmethod
    def get_all_savings_goals():
        """Get all savings goals."""
        return SavingsGoal.query.all()

    @staticmethod
    def get_savings_goal_by_id(goal_id):
        """Get a savings goal by ID."""
        return SavingsGoal.query.get(goal_id)

    @staticmethod
    def create_savings_goal(data):
        """
        Create a new savings goal.

        Args:
            data: Dictionary containing savings goal data

        Returns:
            The created SavingsGoal object
        """
        goal = SavingsGoal(
            id=generate_id(),
            name=data['name'],
            targetAmount=data['targetAmount'],
            currentAmount=data.get('currentAmount', 0)
        )

        if 'deadline' in data and data['deadline']:
            goal.deadline = datetime.fromisoformat(data['deadline'].replace('Z', '+00:00'))

        db.session.add(goal)
        db.session.commit()
        return goal

    @staticmethod
    def update_savings_goal(goal_id, data):
        """
        Update an existing savings goal.

        Args:
            goal_id: ID of the savings goal to update
            data: Dictionary containing updated savings goal data

        Returns:
            The updated SavingsGoal object and any created transaction
        """
        goal = SavingsGoal.query.get(goal_id)
        if not goal:
            return None, None

        created_transaction = None

        if 'name' in data:
            goal.name = data['name']

        if 'targetAmount' in data:
            goal.targetAmount = data['targetAmount']

        if 'currentAmount' in data:
            # If adding money to a savings goal, create a transaction
            if data['currentAmount'] > goal.currentAmount:
                contribution_amount = data['currentAmount'] - goal.currentAmount

                transaction = Transaction(
                    id=generate_id(),
                    amount=contribution_amount,
                    description=f"Contribution to {goal.name}",
                    comments="Automatic transaction for savings goal contribution",
                    category="Savings",
                    type="expense",
                    date=datetime.utcnow()
                )
                transaction.tags = ["savings", "automatic"]

                db.session.add(transaction)
                created_transaction = transaction

            goal.currentAmount = data['currentAmount']

        if 'deadline' in data:
            if data['deadline']:
                goal.deadline = datetime.fromisoformat(data['deadline'].replace('Z', '+00:00'))
            else:
                goal.deadline = None

        db.session.commit()
        return goal, created_transaction

    @staticmethod
    def delete_savings_goal(goal_id):
        """
        Delete a savings goal.

        Args:
            goal_id: ID of the savings goal to delete

        Returns:
            True and any created transaction if successful, False and None otherwise
        """
        goal = SavingsGoal.query.get(goal_id)
        if not goal:
            return False, None

        created_transaction = None

        # If there was money in the goal, create a "transfer back" transaction
        if goal.currentAmount > 0:
            transaction = Transaction(
                id=generate_id(),
                amount=goal.currentAmount,
                description=f"Transferred from {goal.name} savings goal",
                comments="Automatic transaction for savings goal deletion",
                category="Savings Transfer",
                type="income",
                date=datetime.utcnow()
            )
            transaction.tags = ["savings", "transfer", "automatic"]

            db.session.add(transaction)
            created_transaction = transaction

        db.session.delete(goal)
        db.session.commit()
        return True, created_transaction

    # Merchant mapping methods
    @staticmethod
    def get_all_merchant_mappings():
        """
        Get all merchant mappings.

        Returns:
            Dictionary of raw_name -> {"display_name": str, "category": str}
        """
        mappings = MerchantMapping.query.all()
        return {mapping.raw_name: {"display_name": mapping.display_name, "category": mapping.category}
                for mapping in mappings}

    @staticmethod
    def get_merchant_mapping_by_raw_name(raw_name):
        """Get a merchant mapping by raw name."""
        return MerchantMapping.query.get(raw_name)

    @staticmethod
    def add_merchant_mapping(raw_name, display_name, category):
        """
        Add or update a merchant mapping.

        Args:
            raw_name: Raw merchant name pattern
            display_name: User-friendly display name
            category: Expense category

        Returns:
            The created or updated MerchantMapping object
        """
        mapping = MerchantMapping.query.get(raw_name)

        if mapping:
            mapping.display_name = display_name
            mapping.category = category
        else:
            mapping = MerchantMapping(
                raw_name=raw_name,
                display_name=display_name,
                category=category
            )
            db.session.add(mapping)

        db.session.commit()
        return mapping

    @staticmethod
    def add_merchant_mappings(mappings):
        """
        Add or update multiple merchant mappings.

        Args:
            mappings: Dictionary of raw_name -> {"display_name": str, "category": str}

        Returns:
            List of created or updated MerchantMapping objects
        """
        updated_mappings = []

        for raw_name, data in mappings.items():
            mapping = MerchantMapping.query.get(raw_name)

            if mapping:
                mapping.display_name = data["display_name"]
                mapping.category = data["category"]
            else:
                mapping = MerchantMapping(
                    raw_name=raw_name,
                    display_name=data["display_name"],
                    category=data["category"]
                )
                db.session.add(mapping)

            updated_mappings.append(mapping)

        db.session.commit()
        return updated_mappings

    @staticmethod
    def delete_merchant_mapping(raw_name):
        """
        Delete a merchant mapping.

        Args:
            raw_name: Raw merchant name pattern

        Returns:
            True if successful, False otherwise
        """
        mapping = MerchantMapping.query.get(raw_name)
        if not mapping:
            return False

        db.session.delete(mapping)
        db.session.commit()
        return True

    # Summary methods
    @staticmethod
    def get_financial_summary():
        """
        Get a summary of financial data.

        Returns:
            Dictionary with total income, expenses, savings, and available balance
        """
        total_income = db.session.query(db.func.sum(Transaction.amount)).filter(
            Transaction.type == 'income').scalar() or 0
        total_expenses = db.session.query(db.func.sum(Transaction.amount)).filter(
            Transaction.type == 'expense').scalar() or 0
        total_savings = db.session.query(db.func.sum(SavingsGoal.currentAmount)).scalar() or 0

        return {
            'totalIncome': total_income,
            'totalExpenses': total_expenses,
            'totalSavings': total_savings,
            'availableBalance': total_income - total_expenses - total_savings
        }

    # Seed data for development
    @staticmethod
    def seed_data():
        """
        Seed the database with sample data.

        Returns:
            Dictionary with counts of seeded items
        """
        # Clear existing data
        Transaction.query.delete()
        Budget.query.delete()
        SavingsGoal.query.delete()

        # Add sample transactions
        transactions = [
            Transaction(
                id=generate_id(),
                amount=1500,
                description='Internship Stipend',
                comments='Monthly stipend',
                category='Salary',
                type='income',
                date=datetime.now()
            ),
            Transaction(
                id=generate_id(),
                amount=25,
                description='Coffee shop',
                comments='Morning coffee with friends',
                category='Food & Drinks',
                type='expense',
                date=datetime.now()
            ),
            Transaction(
                id=generate_id(),
                amount=50,
                description='Textbooks',
                comments='Computer Science textbook',
                category='Education',
                type='expense',
                date=datetime.now()
            ),
            Transaction(
                id=generate_id(),
                amount=200,
                description='Freelance project',
                comments='Website design for local business',
                category='Side Hustle',
                type='income',
                date=datetime.now()
            )
        ]

        # Set tags for transactions
        transactions[0].tags = ['income', 'work']
        transactions[1].tags = ['food', 'social']
        transactions[2].tags = ['education', 'books']
        transactions[3].tags = ['income', 'freelance']

        # Get current month/year
        today = datetime.now()
        current_month = today.month
        current_year = today.year

        # Add sample budgets for current month
        budgets = [
            Budget(
                id=generate_id(),
                category='Food & Drinks',
                amount=300,
                spent=25,
                month=current_month,
                year=current_year,
                recurring=True
            ),
            Budget(
                id=generate_id(),
                category='Transportation',
                amount=200,
                spent=0,
                month=current_month,
                year=current_year,
                recurring=True
            ),
            Budget(
                id=generate_id(),
                category='Entertainment',
                amount=100,
                spent=0,
                month=current_month,
                year=current_year,
                recurring=True
            ),
            Budget(
                id=generate_id(),
                category='Education',
                amount=150,
                spent=50,
                month=current_month,
                year=current_year,
                recurring=True
            )
        ]

        # Add sample savings goals
        goals = [
            SavingsGoal(
                id=generate_id(),
                name='Emergency Fund',
                targetAmount=1000,
                currentAmount=500,
                deadline=datetime.now()
            ),
            SavingsGoal(
                id=generate_id(),
                name='New Laptop',
                targetAmount=1200,
                currentAmount=300,
                deadline=datetime.now()
            )
        ]

        # Add sample merchant mappings
        mappings = [
            MerchantMapping(
                raw_name="IC* INSTACART",
                display_name="Instacart",
                category="Food & Drinks"
            ),
            MerchantMapping(
                raw_name="TIM HORTONS #",
                display_name="Tim Hortons",
                category="Food & Drinks"
            ),
            MerchantMapping(
                raw_name="PRESTO APPL/",
                display_name="Presto Transit",
                category="Transportation"
            )
        ]

        db.session.add_all(transactions)
        db.session.add_all(budgets)
        db.session.add_all(goals)
        db.session.add_all(mappings)
        db.session.commit()

        return {
            "transactions": len(transactions),
            "budgets": len(budgets),
            "savings_goals": len(goals),
            "merchant_mappings": len(mappings)
        }