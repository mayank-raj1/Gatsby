
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useFinanceData } from '@/hooks/useFinanceData';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Progress } from '@/components/ui/progress';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { ArrowUp, ArrowDown, CircleDollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';

export const SpendingDashboard = () => {
  const { 
    transactions, 
    totalExpenses,
    budgets 
  } = useFinanceData();
  
  // Calculate expense data by category for the pie chart
  const expensesByCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, transaction) => {
      const existingCategory = acc.find(item => item.category === transaction.category);
      if (existingCategory) {
        existingCategory.value += transaction.amount;
      } else {
        acc.push({ 
          category: transaction.category, 
          value: transaction.amount,
          name: transaction.category // For Recharts naming
        });
      }
      return acc;
    }, [] as { category: string, value: number, name: string }[]);

  // Sort by value (highest first)
  const sortedExpenses = [...expensesByCategory].sort((a, b) => b.value - a.value);
  
  // Get the highest spending category
  const highestSpendingCategory = sortedExpenses.length > 0 ? sortedExpenses[0] : null;
  const percentageOfTotal = highestSpendingCategory 
    ? Math.round((highestSpendingCategory.value / totalExpenses) * 100)
    : 0;
  
  // Find the largest single transaction
  const largestTransaction = [...transactions]
    .filter(t => t.type === 'expense')
    .sort((a, b) => b.amount - a.amount)[0];
  
  // Calculate average daily spend
  const uniqueDays = new Set(
    transactions
      .filter(t => t.type === 'expense')
      .map(t => format(new Date(t.date), 'yyyy-MM-dd'))
  );
  
  const avgDailySpend = uniqueDays.size 
    ? Math.round(totalExpenses / uniqueDays.size) 
    : 0;
  
  // Mock data for month-over-month comparison
  // In a real app, this would be calculated from actual historical data
  const previousMonthTotal = totalExpenses * 0.9;
  const monthOverMonthChange = ((totalExpenses - previousMonthTotal) / previousMonthTotal) * 100;
  
  // Calculate overall budget
  const totalBudgetAmount = budgets.reduce((total, budget) => total + budget.amount, 0);
  const budgetPercentage = totalBudgetAmount > 0 
    ? Math.min(100, Math.round((totalExpenses / totalBudgetAmount) * 100)) 
    : 0;
  
  // Find most active spending day
  const spendingByDay = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, transaction) => {
      const day = format(new Date(transaction.date), 'EEEE'); // Get day name
      if (!acc[day]) acc[day] = { count: 0, amount: 0 };
      acc[day].count += 1;
      acc[day].amount += transaction.amount;
      return acc;
    }, {} as Record<string, { count: number, amount: number }>);
  
  const mostActiveDay = Object.entries(spendingByDay)
    .sort((a, b) => b[1].count - a[1].count)[0]?.[0] || 'N/A';
  
  // Chart colors
  const COLORS = ['#1a73e8', '#34a853', '#fbbc05', '#ea4335', '#b3b3b3', '#9334ea', '#13c2c2'];
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Category Breakdown */}
      <Card className="md:col-span-2 h-[400px]">
        <CardHeader>
          <CardTitle>Category Breakdown</CardTitle>
          <CardDescription>How your spending is distributed across categories</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          {expensesByCategory.length > 0 ? (
            <ChartContainer config={{ 
              expenses: { label: 'Expenses' },
              category: { label: 'Category' }
            }}>
              <PieChart>
                <Pie
                  data={expensesByCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="category"
                  paddingAngle={2}
                  label={({ category, value }) => `${category}: ${formatCurrency(value)}`}
                  labelLine={false}
                >
                  {expensesByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip 
                  content={
                    <ChartTooltipContent 
                      formatter={(value: any) => formatCurrency(value)}
                    />
                  }
                />
                <Legend />
              </PieChart>
            </ChartContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              No expense data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Summary</CardTitle>
          <CardDescription>Your spending this month</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Total Spending</span>
              <span className="text-sm font-medium">{formatCurrency(totalExpenses)}</span>
            </div>
            <div className="flex items-center">
              <span className="mr-2 text-xs text-muted-foreground">vs. last month</span>
              <div className={`flex items-center ${monthOverMonthChange > 0 ? 'text-red-500' : 'text-green-500'}`}>
                {monthOverMonthChange > 0 ? (
                  <TrendingUp className="h-4 w-4 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 mr-1" />
                )}
                <span className="text-xs">{Math.abs(Math.round(monthOverMonthChange))}%</span>
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Budget Progress</span>
              <span className="text-sm font-medium">{budgetPercentage}%</span>
            </div>
            <Progress 
              value={budgetPercentage} 
              className={`h-2 ${budgetPercentage > 80 ? 'bg-red-200' : 'bg-slate-200'}`} 
              indicatorClassName={`${budgetPercentage > 80 ? 'bg-red-500' : budgetPercentage > 60 ? 'bg-amber-500' : 'bg-green-500'}`}
            />
            <div className="flex justify-between mt-1">
              <span className="text-xs text-muted-foreground">0%</span>
              <span className="text-xs text-muted-foreground">100%</span>
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="text-sm font-medium mb-2">Overview</div>
            <div className="space-y-3">
              <div className="flex items-center">
                <div className="flex-1">Highest category</div>
                <div className="font-medium">
                  {highestSpendingCategory ? `${highestSpendingCategory.category} (${percentageOfTotal}%)` : 'N/A'}
                </div>
              </div>
              <div className="flex items-center">
                <div className="flex-1">Largest expense</div>
                <div className="font-medium">
                  {largestTransaction ? formatCurrency(largestTransaction.amount) : 'N/A'}
                </div>
              </div>
              <div className="flex items-center">
                <div className="flex-1">Daily average</div>
                <div className="font-medium">{formatCurrency(avgDailySpend)}</div>
              </div>
              <div className="flex items-center">
                <div className="flex-1">Most active day</div>
                <div className="font-medium">{mostActiveDay}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
