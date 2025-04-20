"""
Database models for the Finance Tracker application.

This module defines all database models using SQLAlchemy.
"""
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import uuid

# Initialize SQLAlchemy
db = SQLAlchemy()

def generate_id():
    """Generate a unique ID for database records."""
    return str(uuid.uuid4())

# Models
class Transaction(db.Model):
    """
    Model for financial transactions.
    Unified model that combines both expense and income transactions.
    """
    __tablename__ = 'transactions'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_id)
    amount = db.Column(db.Float, nullable=False)
    description = db.Column(db.String(255), nullable=False)
    comments = db.Column(db.Text, nullable=True)
    category = db.Column(db.String(100), nullable=False)
    type = db.Column(db.String(20), nullable=False)  # 'income' or 'expense'
    date = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    raw_merchant = db.Column(db.String(255), nullable=True)  # Original merchant name

    # Store tags as comma-separated values
    _tags = db.Column('tags', db.String(255), nullable=True)

    @property
    def tags(self):
        """Get tags as a list."""
        return self._tags.split(',') if self._tags else []

    @tags.setter
    def tags(self, value):
        """Set tags from a list."""
        if isinstance(value, list):
            self._tags = ','.join(value)
        else:
            self._tags = value

    def to_dict(self):
        """Convert transaction to dictionary."""
        return {
            'id': self.id,
            'amount': self.amount,
            'description': self.description,
            'comments': self.comments,
            'tags': self.tags,
            'category': self.category,
            'type': self.type,
            'date': self.date.isoformat(),
        }


class Budget(db.Model):
    """Model for budget categories with monthly tracking."""
    __tablename__ = 'budgets'

    id = db.Column(db.String(36), primary_key=True, default=generate_id)
    category = db.Column(db.String(100), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    spent = db.Column(db.Float, default=0.0)
    month = db.Column(db.Integer, nullable=False)  # 1-12 for Jan-Dec
    year = db.Column(db.Integer, nullable=False)
    recurring = db.Column(db.Boolean, default=True)  # Whether to recreate this budget next month
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Composite index to ensure we can quickly find budgets by category and period
    __table_args__ = (
        db.Index('idx_budget_category_period', 'category', 'month', 'year'),
    )

    def to_dict(self):
        """Convert budget to dictionary."""
        return {
            'id': self.id,
            'category': self.category,
            'amount': self.amount,
            'spent': self.spent,
            'month': self.month,
            'year': self.year,
            'recurring': self.recurring,
            'period': f"{self.year}-{self.month:02d}"
        }


class SavingsGoal(db.Model):
    """Model for savings goals."""
    __tablename__ = 'savings_goals'

    id = db.Column(db.String(36), primary_key=True, default=generate_id)
    name = db.Column(db.String(100), nullable=False)
    targetAmount = db.Column(db.Float, nullable=False)
    currentAmount = db.Column(db.Float, default=0.0)
    deadline = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        """Convert savings goal to dictionary."""
        return {
            'id': self.id,
            'name': self.name,
            'targetAmount': self.targetAmount,
            'currentAmount': self.currentAmount,
            'deadline': self.deadline.isoformat() if self.deadline else None,
        }


class MerchantMapping(db.Model):
    """
    Model for mapping raw merchant names to display names and categories.
    This helps maintain consistency in transaction descriptions and categorization.
    """
    __tablename__ = 'merchant_mapping'

    raw_name = db.Column(db.String(255), primary_key=True)
    display_name = db.Column(db.String(255), nullable=False)
    category = db.Column(db.String(100), nullable=False)

    def to_dict(self):
        """Convert merchant mapping to dictionary."""
        return {
            'raw_name': self.raw_name,
            'display_name': self.display_name,
            'category': self.category
        }