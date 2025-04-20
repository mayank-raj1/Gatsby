// src/hooks/useFinanceData.tsx
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import {
  transactionsApi,
  budgetsApi,
  savingsGoalsApi,
  summaryApi
} from '@/services/api';

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
  month: number;
  year: number;
  recurring: boolean;
  period: string; // Formatted as "YYYY-MM"
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
}

// Define response type for next month budgets
interface NextMonthBudgetsResponse {
  message: string;
  budgets: Budget[];
}

interface FinanceContextValue {
  transactions: Transaction[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  loading: boolean;
  error: string | null;
  currentBudgetPeriod: { month: number; year: number };
  setCurrentBudgetPeriod: (period: { month: number; year: number }) => void;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  addBudget: (budget: Omit<Budget, 'id' | 'spent' | 'period'>) => Promise<void>;
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
  createNextMonthBudgets: () => Promise<NextMonthBudgetsResponse>;
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

  // Current budget period (month/year)
  const [currentBudgetPeriod, setCurrentBudgetPeriod] = useState<{ month: number; year: number }>(() => {
    const now = new Date();
    return { month: now.getMonth() + 1, year: now.getFullYear() };
  });

  // Financial summary
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalSavings, setTotalSavings] = useState(0);
  const [availableBalance, setAvailableBalance] = useState(0);

  // Helper function to handle API errors
  const handleApiError = (err: unknown, message: string) => {
    console.error(`${message}:`, err);
    setError(`Failed to ${message.toLowerCase()}`);
    setLoading(false);
  };

  // Fetch all data from API
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [transactionData, budgetData, savingsData, summaryData] = await Promise.all([
        transactionsApi.getAll(),
        budgetsApi.getByPeriod(currentBudgetPeriod.year, currentBudgetPeriod.month),
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
      handleApiError(err, 'load financial data');
    } finally {
      setLoading(false);
    }
  }, [currentBudgetPeriod]);

  // Effect to fetch data when component mounts or period changes
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData, currentBudgetPeriod]);

  // CRUD functions for transactions
  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    try {
      const newTransaction = await transactionsApi.create(transaction);
      setTransactions(prev => [newTransaction, ...prev]);

      // Refresh budgets and summary since they might have changed
      const [budgetData, summaryData] = await Promise.all([
        budgetsApi.getByPeriod(currentBudgetPeriod.year, currentBudgetPeriod.month),
        summaryApi.get()
      ]);

      setBudgets(budgetData);
      setTotalIncome(summaryData.totalIncome);
      setTotalExpenses(summaryData.totalExpenses);
      setAvailableBalance(summaryData.availableBalance);
    } catch (err) {
      handleApiError(err, 'add transaction');
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      await transactionsApi.delete(id);
      setTransactions(prev => prev.filter(t => t.id !== id));

      // Refresh budgets and summary
      const [budgetData, summaryData] = await Promise.all([
        budgetsApi.getByPeriod(currentBudgetPeriod.year, currentBudgetPeriod.month),
        summaryApi.get()
      ]);

      setBudgets(budgetData);
      setTotalIncome(summaryData.totalIncome);
      setTotalExpenses(summaryData.totalExpenses);
      setAvailableBalance(summaryData.availableBalance);
    } catch (err) {
      handleApiError(err, 'delete transaction');
    }
  };

  // CRUD functions for budgets
  const addBudget = async (budget: Omit<Budget, 'id' | 'spent' | 'period'>) => {
    try {
      const periodStr = `${budget.year}-${String(budget.month).padStart(2, '0')}`;
      const budgetWithPeriod = { ...budget, period: periodStr };
      const newBudget = await budgetsApi.create(budgetWithPeriod);
      setBudgets(prev => [...prev, newBudget]);
    } catch (err) {
      handleApiError(err, 'add budget');
    }
  };

  const updateBudget = async (id: string, budgetData: Partial<Budget>) => {
    try {
      const updatedBudget = await budgetsApi.update(id, budgetData);
      setBudgets(prev => prev.map(budget =>
          budget.id === id ? updatedBudget : budget
      ));
    } catch (err) {
      handleApiError(err, 'update budget');
    }
  };

  const deleteBudget = async (id: string) => {
    try {
      await budgetsApi.delete(id);
      setBudgets(prev => prev.filter(b => b.id !== id));
    } catch (err) {
      handleApiError(err, 'delete budget');
    }
  };

  // Create next month's budgets
  const createNextMonthBudgets = async (): Promise<NextMonthBudgetsResponse> => {
    try {
      const result = await budgetsApi.createNextMonth();

      // If we're viewing the next month already, refresh the budgets
      const today = new Date();
      const nextMonth = today.getMonth() + 2 > 12 ? 1 : today.getMonth() + 2;
      const nextYear = nextMonth === 1 ? today.getFullYear() + 1 : today.getFullYear();

      if (currentBudgetPeriod.month === nextMonth && currentBudgetPeriod.year === nextYear) {
        const budgetData = await budgetsApi.getByPeriod(nextYear, nextMonth);
        setBudgets(budgetData);
      }

      return result;
    } catch (err) {
      handleApiError(err, 'create next month budgets');
      throw err as Error;
    }
  };

  // CRUD functions for savings goals
  const addSavingsGoal = async (goal: Omit<SavingsGoal, 'id' | 'currentAmount'>) => {
    try {
      const newGoal = await savingsGoalsApi.create(goal);
      setSavingsGoals(prev => [...prev, newGoal]);
    } catch (err) {
      handleApiError(err, 'add savings goal');
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
      handleApiError(err, 'update savings goal');
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
      handleApiError(err, 'delete savings goal');
    }
  };

  // Context value
  const contextValue: FinanceContextValue = {
    transactions,
    budgets,
    savingsGoals,
    loading,
    error,
    currentBudgetPeriod,
    setCurrentBudgetPeriod,
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
    createNextMonthBudgets,
  };

  return (
      <FinanceContext.Provider value={contextValue}>
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