
import { FinancialSummary } from './FinancialSummary';
import { TransactionLog } from './TransactionLog';
import { QuickAdd } from './QuickAdd';
import { useFinanceData } from '@/hooks/useFinanceData';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const Dashboard = () => {
  const { 
    transactions, 
    budgets, 
    totalIncome, 
    totalExpenses, 
    totalSavings, 
    availableBalance 
  } = useFinanceData();
  
  // Calculate expense data by category for the pie chart
  const expensesByCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, transaction) => {
      const existingCategory = acc.find(item => item.category === transaction.category);
      if (existingCategory) {
        existingCategory.value += transaction.amount;
      } else {
        acc.push({ category: transaction.category, value: transaction.amount });
      }
      return acc;
    }, [] as { category: string, value: number }[]);

  // Sort by value (highest first) and limit to top 4
  const topExpenses = [...expensesByCategory]
    .sort((a, b) => b.value - a.value)
    .slice(0, 4);

  // Add "Other" category if needed
  if (expensesByCategory.length > 4) {
    const otherExpenses = expensesByCategory
      .slice(4)
      .reduce((total, item) => total + item.value, 0);
    
    if (otherExpenses > 0) {
      topExpenses.push({ category: 'Other', value: otherExpenses });
    }
  }

  const COLORS = ['#1a73e8', '#34a853', '#fbbc05', '#ea4335', '#b3b3b3'];
  
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
    <div className="page-container">
      <h1 className="text-3xl font-bold mb-8 text-center sm:text-left">Financial Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <FinancialSummary 
          income={totalIncome}
          expenses={totalExpenses}
          savings={totalSavings}
          balance={availableBalance}
        />
        
        <div className="col-span-1 md:col-span-2 fin-card animate-on-scroll">
          <h2 className="text-lg font-semibold mb-4">Expense Distribution</h2>
          
          {topExpenses.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={topExpenses}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      paddingAngle={2}
                      animationBegin={200}
                      animationDuration={1000}
                    >
                      {topExpenses.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value), 'Amount']}
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        borderRadius: '8px',
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="flex flex-col justify-center">
                <div className="space-y-3">
                  {topExpenses.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <div className="flex justify-between w-full">
                        <span className="text-sm font-medium">{entry.category}</span>
                        <span className="text-sm font-medium">{formatCurrency(entry.value)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              No expense data available
            </div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-1 lg:col-span-2 fin-card animate-on-scroll">
          <Tabs defaultValue="transactions">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Transaction History</h2>
              <TabsList>
                <TabsTrigger value="transactions">All</TabsTrigger>
                <TabsTrigger value="income">Income</TabsTrigger>
                <TabsTrigger value="expenses">Expenses</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="transactions">
              <TransactionLog transactions={transactions} />
            </TabsContent>
            
            <TabsContent value="income">
              <TransactionLog 
                transactions={transactions.filter(t => t.type === 'income')} 
              />
            </TabsContent>
            
            <TabsContent value="expenses">
              <TransactionLog 
                transactions={transactions.filter(t => t.type === 'expense')} 
              />
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="fin-card animate-on-scroll">
          <QuickAdd />
        </div>
      </div>
    </div>
  );
};
