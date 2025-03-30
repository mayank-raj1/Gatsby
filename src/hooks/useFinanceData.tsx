// src/hooks/useFinanceData.tsx
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { transactionsApi, budgetsApi, savingsGoalsApi, summaryApi } from '@/services/api';

// Define types for our financial data
export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  comments: string;
  tags: string[];
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

interface FinanceContextValue {
  transactions: Transaction[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  loading: boolean;
  error: string | null;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  addBudget: (budget: Omit<Budget, 'id' | 'spent'>) => Promise<void>;
  updateBudget: (id: string, data: Partial<Budget>) => Promise<void>;
  addSavingsGoal: (goal: Omit<SavingsGoal, 'id' | 'currentAmount'>) => Promise<void>;
  updateSavingsGoal: (id: string, data: Partial<SavingsGoal>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  deleteSavingsGoal: (id: string) => Promise<void>;
  totalIncome: number;
  totalExpenses: number;
  totalSavings: number;
  availableBalance: number;
  refreshData: () => Promise<void>;
}

// Create a context for our finance data
const FinanceContext = createContext<FinanceContextValue | undefined>(undefined);

// Provider component
export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Financial summary
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalSavings, setTotalSavings] = useState(0);
  const [availableBalance, setAvailableBalance] = useState(0);

  // Fetch all data from API
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [transactionData, budgetData, savingsData, summaryData] = await Promise.all([
        transactionsApi.getAll(),
        budgetsApi.getAll(),
        savingsGoalsApi.getAll(),
        summaryApi.get()
      ]);

      setTransactions(transactionData);
      setBudgets(budgetData);
      setSavingsGoals(savingsData);

      // Set financial summary
      setTotalIncome(summaryData.totalIncome);
      setTotalExpenses(summaryData.totalExpenses);
      setTotalSavings(summaryData.totalSavings);
      setAvailableBalance(summaryData.availableBalance);
    } catch (err) {
      console.error('Error fetching finance data:', err);
      setError('Failed to load financial data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial data load
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // CRUD functions for transactions
  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    try {
      const newTransaction = await transactionsApi.create(transaction);
      setTransactions(prev => [newTransaction, ...prev]);

      // Refresh budgets and summary since they might have changed
      const [budgetData, summaryData] = await Promise.all([
        budgetsApi.getAll(),
        summaryApi.get()
      ]);

      setBudgets(budgetData);
      setTotalIncome(summaryData.totalIncome);
      setTotalExpenses(summaryData.totalExpenses);
      setAvailableBalance(summaryData.availableBalance);
    } catch (err) {
      console.error('Error adding transaction:', err);
      setError('Failed to add transaction');
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      await transactionsApi.delete(id);
      setTransactions(prev => prev.filter(t => t.id !== id));

      // Refresh budgets and summary
      const [budgetData, summaryData] = await Promise.all([
        budgetsApi.getAll(),
        summaryApi.get()
      ]);

      setBudgets(budgetData);
      setTotalIncome(summaryData.totalIncome);
      setTotalExpenses(summaryData.totalExpenses);
      setAvailableBalance(summaryData.availableBalance);
    } catch (err) {
      console.error('Error deleting transaction:', err);
      setError('Failed to delete transaction');
    }
  };

  // CRUD functions for budgets
  const addBudget = async (budget: Omit<Budget, 'id' | 'spent'>) => {
    try {
      const newBudget = await budgetsApi.create(budget);
      setBudgets(prev => [...prev, newBudget]);
    } catch (err) {
      console.error('Error adding budget:', err);
      setError('Failed to add budget');
    }
  };

  const updateBudget = async (id: string, budgetData: Partial<Budget>) => {
    try {
      const updatedBudget = await budgetsApi.update(id, budgetData);
      setBudgets(prev => prev.map(budget =>
          budget.id === id ? updatedBudget : budget
      ));
    } catch (err) {
      console.error('Error updating budget:', err);
      setError('Failed to update budget');
    }
  };

  const deleteBudget = async (id: string) => {
    try {
      await budgetsApi.delete(id);
      setBudgets(prev => prev.filter(b => b.id !== id));
    } catch (err) {
      console.error('Error deleting budget:', err);
      setError('Failed to delete budget');
    }
  };

  // CRUD functions for savings goals
  const addSavingsGoal = async (goal: Omit<SavingsGoal, 'id' | 'currentAmount'>) => {
    try {
      const newGoal = await savingsGoalsApi.create(goal);
      setSavingsGoals(prev => [...prev, newGoal]);
    } catch (err) {
      console.error('Error adding savings goal:', err);
      setError('Failed to add savings goal');
    }
  };

  const updateSavingsGoal = async (id: string, goalData: Partial<SavingsGoal>) => {
    try {
      const updatedGoal = await savingsGoalsApi.update(id, goalData);
      setSavingsGoals(prev => prev.map(goal =>
          goal.id === id ? updatedGoal : goal
      ));

      // If we're contributing to a savings goal, we need to refresh transactions and summary
      if (goalData.currentAmount) {
        const [transactionData, summaryData] = await Promise.all([
          transactionsApi.getAll(),
          summaryApi.get()
        ]);

        setTransactions(transactionData);
        setTotalExpenses(summaryData.totalExpenses);
        setTotalSavings(summaryData.totalSavings);
        setAvailableBalance(summaryData.availableBalance);
      }
    } catch (err) {
      console.error('Error updating savings goal:', err);
      setError('Failed to update savings goal');
    }
  };

  const deleteSavingsGoal = async (id: string) => {
    try {
      await savingsGoalsApi.delete(id);
      setSavingsGoals(prev => prev.filter(g => g.id !== id));

      // Refresh transactions and summary since a transfer transaction might have been created
      const [transactionData, summaryData] = await Promise.all([
        transactionsApi.getAll(),
        summaryApi.get()
      ]);

      setTransactions(transactionData);
      setTotalIncome(summaryData.totalIncome);
      setTotalSavings(summaryData.totalSavings);
      setAvailableBalance(summaryData.availableBalance);
    } catch (err) {
      console.error('Error deleting savings goal:', err);
      setError('Failed to delete savings goal');
    }
  };

  return (
      <FinanceContext.Provider
          value={{
            transactions,
            budgets,
            savingsGoals,
            loading,
            error,
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
            refreshData: fetchAllData,
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