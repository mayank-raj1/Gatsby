
import { useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFinanceData } from '@/hooks/useFinanceData';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';
import { subMonths, format, startOfMonth, endOfMonth } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { BarChart2, CalendarDays, Calculator, LineChart } from 'lucide-react';

export const ComparisonTools = () => {
  const [activeTab, setActiveTab] = useState('budget');
  const { budgets, transactions } = useFinanceData();
  const { formatCurrency } = useAnalyticsData();

  // Budget vs. Actual data
  const budgetComparison = budgets.map(budget => {
    const spent = budget.spent || 0;
    const remaining = Math.max(0, budget.amount - spent);
    const percentUsed = (spent / budget.amount) * 100;
    const status = percentUsed > 100 ? 'over' : percentUsed > 85 ? 'warning' : 'good';

    return {
      category: budget.category,
      budgeted: budget.amount,
      spent,
      remaining,
      percentUsed,
      status
    };
  }).sort((a, b) => b.percentUsed - a.percentUsed);

  // Period comparison data (current month vs previous month)
  const now = new Date();
  const currentMonth = format(now, 'MMMM');
  const previousMonth = format(subMonths(now, 1), 'MMMM');
  
  // Helper to get expenses for a specific month
  const getMonthExpenses = (date: Date) => {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    
    return transactions.filter(t => {
      const txDate = new Date(t.date);
      return t.type === 'expense' && 
             txDate >= start && 
             txDate <= end;
    });
  };
  
  // Get expenses by category for current and previous month
  const currentMonthExpenses = getMonthExpenses(now);
  const previousMonthExpenses = getMonthExpenses(subMonths(now, 1));
  
  // Group by category
  const getExpensesByCategory = (expenses: typeof transactions) => {
    return expenses.reduce((acc, tx) => {
      if (!acc[tx.category]) {
        acc[tx.category] = 0;
      }
      acc[tx.category] += tx.amount;
      return acc;
    }, {} as Record<string, number>);
  };
  
  const currentMonthByCategory = getExpensesByCategory(currentMonthExpenses);
  const previousMonthByCategory = getExpensesByCategory(previousMonthExpenses);
  
  // Combine data for comparison
  const allCategories = [...new Set([
    ...Object.keys(currentMonthByCategory),
    ...Object.keys(previousMonthByCategory)
  ])];
  
  const periodComparisonData = allCategories.map(category => {
    const current = currentMonthByCategory[category] || 0;
    const previous = previousMonthByCategory[category] || 0;
    const difference = current - previous;
    const percentChange = previous ? (difference / previous) * 100 : 100;
    
    return {
      category,
      current,
      previous,
      difference,
      percentChange
    };
  }).sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference));
  
  // Calculate totals
  const currentTotal = Object.values(currentMonthByCategory).reduce((sum, val) => sum + val, 0);
  const previousTotal = Object.values(previousMonthByCategory).reduce((sum, val) => sum + val, 0);
  const totalDifference = currentTotal - previousTotal;
  const totalPercentChange = previousTotal ? (totalDifference / previousTotal) * 100 : 0;
  
  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="budget">
            <BarChart2 className="mr-2 h-4 w-4" />
            Budget vs. Actual
          </TabsTrigger>
          <TabsTrigger value="period">
            <CalendarDays className="mr-2 h-4 w-4" />
            Period Comparison
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="budget">
          <Card>
            <CardHeader>
              <CardTitle>Budget vs. Actual Spending</CardTitle>
              <CardDescription>See how your actual spending compares to your budget</CardDescription>
            </CardHeader>
            <CardContent>
              {budgetComparison.length > 0 ? (
                <div className="space-y-6">
                  {budgetComparison.map((item, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{item.category}</span>
                        <div className="text-right">
                          <span className={
                            item.status === 'over' ? 'text-destructive' : 
                            item.status === 'warning' ? 'text-amber-500' : 
                            'text-green-600'
                          }>
                            {formatCurrency(item.spent)} / {formatCurrency(item.budgeted)}
                          </span>
                        </div>
                      </div>
                      <Progress 
                        value={Math.min(item.percentUsed, 100)} 
                        className="h-2" 
                        indicatorClassName={
                          item.status === 'over' ? 'bg-destructive' : 
                          item.status === 'warning' ? 'bg-amber-500' : 
                          'bg-green-600'
                        }
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{item.percentUsed.toFixed(0)}% used</span>
                        {item.status === 'over' ? (
                          <span className="text-destructive">
                            Over by {formatCurrency(item.spent - item.budgeted)}
                          </span>
                        ) : (
                          <span>{formatCurrency(item.remaining)} remaining</span>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {budgetComparison.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No budget categories found</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Create budget categories to track your spending
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No budget categories found</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Create budget categories to track your spending
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="period">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Comparison</CardTitle>
              <CardDescription>
                Comparing {currentMonth} vs {previousMonth}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 p-4 rounded-lg bg-muted/50">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Total Spending</span>
                  <div className="text-right">
                    <span className={totalDifference > 0 ? 'text-destructive' : 'text-green-600'}>
                      {totalDifference > 0 ? '↑' : '↓'} {formatCurrency(Math.abs(totalDifference))}
                      ({Math.abs(totalPercentChange).toFixed(1)}%)
                    </span>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span>
                    {currentMonth}: {formatCurrency(currentTotal)}
                  </span>
                  <span>
                    {previousMonth}: {formatCurrency(previousTotal)}
                  </span>
                </div>
              </div>
              
              {periodComparisonData.length > 0 ? (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-4">Changes by Category</h4>
                  <div className="space-y-4">
                    {periodComparisonData.slice(0, 5).map((item, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <span className="flex-1">{item.category}</span>
                        <div className="flex-1 text-right">
                          <span className={item.difference > 0 ? 'text-destructive' : 'text-green-600'}>
                            {item.difference > 0 ? '+' : ''}{formatCurrency(item.difference)}
                          </span>
                        </div>
                        <div className="flex-1 text-right">
                          <span className={item.difference > 0 ? 'text-destructive' : 'text-green-600'}>
                            {item.difference > 0 ? '↑' : '↓'} {Math.abs(item.percentChange).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {periodComparisonData.length > 5 && (
                    <p className="text-xs text-muted-foreground text-center mt-4">
                      Showing top 5 of {periodComparisonData.length} categories with changes
                    </p>
                  )}
                  
                  <div className="h-[300px] mt-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={periodComparisonData.slice(0, 8)}
                        margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="category" 
                          angle={-45}
                          textAnchor="end"
                          height={70}
                        />
                        <YAxis />
                        <Tooltip 
                          formatter={(value: number) => [`$${value.toFixed(0)}`, 'Amount']}
                          labelFormatter={(label) => `${label}`}
                        />
                        <Legend />
                        <Bar dataKey="current" name={`${currentMonth}`} fill="#9b87f5" />
                        <Bar dataKey="previous" name={`${previousMonth}`} fill="#D6BCFA" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Not enough data for comparison</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    We need transaction data from both this month and last month
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
