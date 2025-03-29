
import { useState } from 'react';
import { Calendar, Clock, BarChart2, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFinanceData } from '@/hooks/useFinanceData';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';
import { format, parseISO, getDay } from 'date-fns';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

export const SpendingPatterns = () => {
  const [activeTab, setActiveTab] = useState('heatmap');
  const { currentMonthExpenses, formatCurrency } = useAnalyticsData();
  const { transactions } = useFinanceData();
  
  // Prepare data for weekly pattern analysis
  const weekdayData = Array(7).fill(0).map((_, index) => ({
    name: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][index],
    amount: 0,
    count: 0,
    average: 0,
  }));
  
  transactions
    .filter(t => t.type === 'expense')
    .forEach(transaction => {
      const date = parseISO(transaction.date);
      const dayOfWeek = getDay(date);
      weekdayData[dayOfWeek].amount += transaction.amount;
      weekdayData[dayOfWeek].count += 1;
    });
  
  // Calculate averages
  weekdayData.forEach(day => {
    day.average = day.count > 0 ? day.amount / day.count : 0;
  });
  
  // Find highest spending day for coloring
  const maxAmount = Math.max(...weekdayData.map(day => day.amount));
  
  // Get hour of day from transaction dates (simplified version)
  const hourlyData = Array(24).fill(0).map((_, index) => ({
    hour: index,
    count: 0,
    amount: 0,
    label: index === 0 ? '12am' : 
           index < 12 ? `${index}am` : 
           index === 12 ? '12pm' : 
           `${index-12}pm`
  }));
  
  transactions
    .filter(t => t.type === 'expense')
    .forEach(transaction => {
      const date = parseISO(transaction.date);
      const hour = date.getHours();
      hourlyData[hour].count += 1;
      hourlyData[hour].amount += transaction.amount;
    });
  
  // Group transactions by merchant name to find potential recurring expenses
  const merchantTransactions = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, transaction) => {
      const merchant = transaction.description;
      if (!acc[merchant]) {
        acc[merchant] = [];
      }
      acc[merchant].push(transaction);
      return acc;
    }, {} as Record<string, typeof transactions>);
  
  // Find potential recurring expenses (merchants with multiple transactions of similar amounts)
  const potentialRecurring = Object.entries(merchantTransactions)
    .filter(([_, txs]) => txs.length >= 2)
    .map(([merchant, txs]) => {
      const amounts = txs.map(t => t.amount);
      const avgAmount = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
      // Check if amounts are consistent (within 10% of average)
      const consistent = amounts.every(amt => 
        Math.abs(amt - avgAmount) / avgAmount < 0.1
      );
      
      return {
        merchant,
        transactions: txs,
        frequency: txs.length,
        avgAmount,
        consistent,
        lastTransaction: txs[0].date, // Assuming transactions are sorted by date desc
        annualImpact: avgAmount * (12 / (txs.length < 3 ? 1 : 3)) // Simple projection
      };
    })
    .filter(item => item.consistent)
    .sort((a, b) => b.avgAmount - a.avgAmount);
  
  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="heatmap">
            <Calendar className="mr-2 h-4 w-4" />
            Spending Heatmap
          </TabsTrigger>
          <TabsTrigger value="timeofday">
            <Clock className="mr-2 h-4 w-4" />
            Time-of-Day
          </TabsTrigger>
          <TabsTrigger value="weekday">
            <BarChart2 className="mr-2 h-4 w-4" />
            Weekly Patterns
          </TabsTrigger>
          <TabsTrigger value="recurring">
            <RefreshCw className="mr-2 h-4 w-4" />
            Recurring Expenses
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="heatmap">
          <Card>
            <CardHeader>
              <CardTitle>Spending Heatmap</CardTitle>
              <CardDescription>See your spending intensity throughout the month</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center">
              <div className="text-center space-y-2">
                <p className="text-muted-foreground">
                  Spending heatmap will show your daily spending patterns in a calendar view
                </p>
                <p className="text-sm text-muted-foreground">
                  Collecting more data will enable this feature soon
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="timeofday">
          <Card>
            <CardHeader>
              <CardTitle>Time-of-Day Analysis</CardTitle>
              <CardDescription>When do you typically spend money?</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              {hourlyData.some(data => data.count > 0) ? (
                <ChartContainer 
                  config={{
                    transactions: {
                      label: "Transactions",
                      color: "#9b87f5"
                    },
                    spending: {
                      label: "Spending",
                      color: "#6E59A5"
                    }
                  }}
                >
                  <BarChart
                    data={hourlyData.filter(d => d.count > 0)}
                    margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis yAxisId="left" orientation="left" label={{ value: 'Count', angle: -90, position: 'insideLeft' }} />
                    <YAxis yAxisId="right" orientation="right" label={{ value: 'Amount ($)', angle: 90, position: 'insideRight' }} />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Bar yAxisId="left" dataKey="count" name="transactions" fill="var(--color-transactions)" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="right" dataKey="amount" name="spending" fill="var(--color-spending)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-muted-foreground">
                    Not enough data to analyze time-of-day spending patterns
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="weekday">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Pattern Analysis</CardTitle>
              <CardDescription>Which days do you spend the most?</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              {weekdayData.some(day => day.amount > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={weekdayData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [`$${value.toFixed(0)}`, 'Amount']}
                      labelFormatter={(label) => `${label}`}
                    />
                    <Bar dataKey="amount" name="Spending" radius={[4, 4, 0, 0]}>
                      {weekdayData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.amount === maxAmount ? '#8B5CF6' : '#9b87f5'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-muted-foreground">
                    Not enough data to analyze weekly spending patterns
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="recurring">
          <Card>
            <CardHeader>
              <CardTitle>Recurring Expenses</CardTitle>
              <CardDescription>Detected subscriptions and regular payments</CardDescription>
            </CardHeader>
            <CardContent>
              {potentialRecurring.length > 0 ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    We've identified these potential recurring expenses based on your transaction history.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left pb-2">Merchant</th>
                          <th className="text-right pb-2">Amount</th>
                          <th className="text-right pb-2">Frequency</th>
                          <th className="text-right pb-2">Est. Annual Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {potentialRecurring.map((item, i) => (
                          <tr key={i} className="border-b hover:bg-muted/50">
                            <td className="py-3">{item.merchant}</td>
                            <td className="text-right py-3">{formatCurrency(item.avgAmount)}</td>
                            <td className="text-right py-3">{item.frequency} times</td>
                            <td className="text-right py-3">{formatCurrency(item.annualImpact)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-muted-foreground mt-4">
                    Note: Estimates are based on limited data and may become more accurate over time.
                  </p>
                </div>
              ) : (
                <div className="h-[250px] flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <p className="text-muted-foreground">
                      No recurring expenses detected yet
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Add more transaction data for better detection
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
