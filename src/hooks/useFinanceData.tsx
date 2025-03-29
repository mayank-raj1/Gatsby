
import React, { createContext, useState, useContext, useEffect } from 'react';

// Define types for our financial data
export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  category: string;
  type: TransactionType;
  date: string;
}

export interface Budget {
  id: string;
  category: string;
  amount: number;
  spent: number;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
}

interface FinanceData {
  transactions: Transaction[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
}

interface FinanceContextValue {
  transactions: Transaction[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  addBudget: (budget: Omit<Budget, 'id' | 'spent'>) => void;
  updateBudget: (id: string, data: Partial<Budget>) => void;
  addSavingsGoal: (goal: Omit<SavingsGoal, 'id' | 'currentAmount'>) => void;
  updateSavingsGoal: (id: string, data: Partial<SavingsGoal>) => void;
  deleteTransaction: (id: string) => void;
  deleteBudget: (id: string) => void;
  deleteSavingsGoal: (id: string) => void;
  totalIncome: number;
  totalExpenses: number;
  totalSavings: number;
  availableBalance: number;
}

// Create a context for our finance data
const FinanceContext = createContext<FinanceContextValue | undefined>(undefined);

// Initialize with sample data
const initialData: FinanceData = {
  transactions: [
    {
      id: '1',
      amount: 1500,
      description: 'Internship Stipend',
      category: 'Salary',
      type: 'income',
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '2',
      amount: 25,
      description: 'Coffee shop',
      category: 'Food & Drinks',
      type: 'expense',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '3',
      amount: 50,
      description: 'Textbooks',
      category: 'Education',
      type: 'expense',
      date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '4',
      amount: 200,
      description: 'Freelance project',
      category: 'Side Hustle',
      type: 'income',
      date: new Date().toISOString(),
    },
  ],
  budgets: [
    { id: '1', category: 'Food & Drinks', amount: 300, spent: 150 },
    { id: '2', category: 'Transportation', amount: 200, spent: 80 },
    { id: '3', category: 'Entertainment', amount: 100, spent: 35 },
    { id: '4', category: 'Education', amount: 150, spent: 50 },
  ],
  savingsGoals: [
    {
      id: '1',
      name: 'Emergency Fund',
      targetAmount: 1000,
      currentAmount: 500,
      deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '2',
      name: 'New Laptop',
      targetAmount: 1200,
      currentAmount: 300,
      deadline: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
};

// Provider component
export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize state from localStorage or use initial data
  const [data, setData] = useState<FinanceData>(() => {
    const savedData = localStorage.getItem('financeData');
    return savedData ? JSON.parse(savedData) : initialData;
  });

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('financeData', JSON.stringify(data));
  }, [data]);

  // Calculate totals
  const totalIncome = data.transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = data.transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalSavings = data.savingsGoals.reduce((sum, goal) => sum + goal.currentAmount, 0);

  const availableBalance = totalIncome - totalExpenses - totalSavings;

  // CRUD functions
  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction = {
      ...transaction,
      id: Date.now().toString(),
    };
    
    // Update budget spent amount if it's an expense
    if (transaction.type === 'expense') {
      const updatedBudgets = data.budgets.map(budget => {
        if (budget.category === transaction.category) {
          return { ...budget, spent: budget.spent + transaction.amount };
        }
        return budget;
      });
      
      setData(prev => ({
        ...prev,
        transactions: [newTransaction, ...prev.transactions],
        budgets: updatedBudgets,
      }));
    } else {
      setData(prev => ({
        ...prev,
        transactions: [newTransaction, ...prev.transactions],
      }));
    }
  };

  const deleteTransaction = (id: string) => {
    const transaction = data.transactions.find(t => t.id === id);
    if (!transaction) return;

    // If it's an expense, update the budget spent amount
    if (transaction.type === 'expense') {
      const updatedBudgets = data.budgets.map(budget => {
        if (budget.category === transaction.category) {
          return { 
            ...budget, 
            spent: Math.max(0, budget.spent - transaction.amount)
          };
        }
        return budget;
      });
      
      setData(prev => ({
        ...prev,
        transactions: prev.transactions.filter(t => t.id !== id),
        budgets: updatedBudgets,
      }));
    } else {
      setData(prev => ({
        ...prev,
        transactions: prev.transactions.filter(t => t.id !== id),
      }));
    }
  };

  const addBudget = (budget: Omit<Budget, 'id' | 'spent'>) => {
    const newBudget = {
      ...budget,
      id: Date.now().toString(),
      spent: 0,
    };
    setData(prev => ({
      ...prev,
      budgets: [...prev.budgets, newBudget],
    }));
  };

  const updateBudget = (id: string, budgetData: Partial<Budget>) => {
    setData(prev => ({
      ...prev,
      budgets: prev.budgets.map(budget => 
        budget.id === id ? { ...budget, ...budgetData } : budget
      ),
    }));
  };

  const deleteBudget = (id: string) => {
    setData(prev => ({
      ...prev,
      budgets: prev.budgets.filter(b => b.id !== id),
    }));
  };

  const addSavingsGoal = (goal: Omit<SavingsGoal, 'id' | 'currentAmount'>) => {
    const newGoal = {
      ...goal,
      id: Date.now().toString(),
      currentAmount: 0,
    };
    setData(prev => ({
      ...prev,
      savingsGoals: [...prev.savingsGoals, newGoal],
    }));
  };

  const updateSavingsGoal = (id: string, goalData: Partial<SavingsGoal>) => {
    setData(prev => ({
      ...prev,
      savingsGoals: prev.savingsGoals.map(goal => 
        goal.id === id ? { ...goal, ...goalData } : goal
      ),
    }));
  };

  const deleteSavingsGoal = (id: string) => {
    // Get the amount saved in this goal to add back to available balance
    const goalToDelete = data.savingsGoals.find(g => g.id === id);
    
    if (goalToDelete) {
      // Create a "transfer back" transaction if there was money in the goal
      if (goalToDelete.currentAmount > 0) {
        const transferTransaction = {
          id: Date.now().toString(),
          amount: goalToDelete.currentAmount,
          description: `Transferred from ${goalToDelete.name} savings goal`,
          category: 'Savings Transfer',
          type: 'income' as TransactionType,
          date: new Date().toISOString(),
        };
        
        setData(prev => ({
          ...prev,
          savingsGoals: prev.savingsGoals.filter(g => g.id !== id),
          transactions: [transferTransaction, ...prev.transactions],
        }));
      } else {
        setData(prev => ({
          ...prev,
          savingsGoals: prev.savingsGoals.filter(g => g.id !== id),
        }));
      }
    }
  };

  return (
    <FinanceContext.Provider
      value={{
        transactions: data.transactions,
        budgets: data.budgets,
        savingsGoals: data.savingsGoals,
        addTransaction,
        addBudget,
        updateBudget,
        addSavingsGoal,
        updateSavingsGoal,
        deleteTransaction,
        deleteBudget,
        deleteSavingsGoal,
        totalIncome,
        totalExpenses,
        totalSavings,
        availableBalance,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

// Custom hook to use the finance context
export const useFinanceData = () => {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinanceData must be used within a FinanceProvider');
  }
  return context;
};
