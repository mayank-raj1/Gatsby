
import { useMemo } from 'react';
import { useFinanceData, Transaction } from '@/hooks/useFinanceData';
import { startOfMonth, endOfMonth, subMonths, parseISO, format, isSameMonth } from 'date-fns';

export const useAnalyticsData = () => {
  const { transactions } = useFinanceData();
  
  // Get the current month expenses
  const currentMonthExpenses = useMemo(() => {
    const now = new Date();
    const startOfCurrentMonth = startOfMonth(now);
    const endOfCurrentMonth = endOfMonth(now);
    
    return transactions.filter(t => {
      const date = parseISO(t.date);
      return t.type === 'expense' && 
             date >= startOfCurrentMonth && 
             date <= endOfCurrentMonth;
    });
  }, [transactions]);
  
  // Get the previous month expenses
  const previousMonthExpenses = useMemo(() => {
    const now = new Date();
    const lastMonth = subMonths(now, 1);
    const startOfLastMonth = startOfMonth(lastMonth);
    const endOfLastMonth = endOfMonth(lastMonth);
    
    return transactions.filter(t => {
      const date = parseISO(t.date);
      return t.type === 'expense' && 
             date >= startOfLastMonth && 
             date <= endOfLastMonth;
    });
  }, [transactions]);
  
  // Calculate month-over-month change
  const monthOverMonthChange = useMemo(() => {
    const currentTotal = currentMonthExpenses.reduce((sum, t) => sum + t.amount, 0);
    const previousTotal = previousMonthExpenses.reduce((sum, t) => sum + t.amount, 0);
    
    if (previousTotal === 0) return 0;
    return ((currentTotal - previousTotal) / previousTotal) * 100;
  }, [currentMonthExpenses, previousMonthExpenses]);
  
  // Get spending by category for current month
  const currentMonthSpendingByCategory = useMemo(() => {
    return currentMonthExpenses.reduce((acc, transaction) => {
      const existingCategory = acc.find(item => item.category === transaction.category);
      if (existingCategory) {
        existingCategory.amount += transaction.amount;
      } else {
        acc.push({ 
          category: transaction.category, 
          amount: transaction.amount,
        });
      }
      return acc;
    }, [] as { category: string, amount: number }[])
    .sort((a, b) => b.amount - a.amount);
  }, [currentMonthExpenses]);
  
  // Get transactions for last N months
  const getTransactionsForLastMonths = (numMonths: number): Transaction[] => {
    const now = new Date();
    const startDate = startOfMonth(subMonths(now, numMonths - 1));
    
    return transactions.filter(t => {
      const date = parseISO(t.date);
      return date >= startDate && date <= now;
    });
  };
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  return {
    currentMonthExpenses,
    previousMonthExpenses,
    monthOverMonthChange,
    currentMonthSpendingByCategory,
    getTransactionsForLastMonths,
    formatCurrency,
  };
};
