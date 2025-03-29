import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useFinanceData } from '@/hooks/useFinanceData';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth, parseISO, isSameMonth, getMonth, getYear } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const TrendAnalysis = () => {
  const { transactions } = useFinanceData();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showIncome, setShowIncome] = useState(false);
  const [selectedView, setSelectedView] = useState('all');
  
  // Get unique categories from transactions
  const uniqueCategories = Array.from(
    new Set(transactions.filter(t => t.type === 'expense').map(t => t.category))
  );
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Generate data for the last 6 months
  const generateMonthlyData = () => {
    const monthlyData = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const month = subMonths(now, i);
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      const monthName = format(month, 'MMM');
      
      // Initialize data for this month
      const monthData: any = {
        name: monthName,
        month: format(month, 'yyyy-MM'),
        total: 0,
      };
      
      // Initialize category amounts
      uniqueCategories.forEach(category => {
        monthData[category] = 0;
      });
      
      // Sum expenses for each category in this month
      transactions
        .filter(t => {
          const transactionDate = parseISO(t.date);
          return t.type === 'expense' && 
                 transactionDate >= monthStart && 
                 transactionDate <= monthEnd;
        })
        .forEach(t => {
          monthData.total += t.amount;
          if (monthData[t.category] !== undefined) {
            monthData[t.category] += t.amount;
          }
        });
      
      // Calculate income for this month if showing income
      if (showIncome) {
        monthData.income = transactions
          .filter(t => {
            const transactionDate = parseISO(t.date);
            return t.type === 'income' && 
                   transactionDate >= monthStart && 
                   transactionDate <= monthEnd;
          })
          .reduce((sum, t) => sum + t.amount, 0);
        
        monthData.net = monthData.income - monthData.total;
      }
      
      monthlyData.push(monthData);
    }
    
    return monthlyData;
  };
  
  const monthlyData = generateMonthlyData();
  
  // Generate weekly spending data
  const generateWeeklyData = () => {
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const weeklyData = daysOfWeek.map(day => ({
      name: day,
      amount: 0,
      count: 0,
      average: 0
    }));
    
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const dayOfWeek = new Date(t.date).getDay(); // 0 = Sunday, 6 = Saturday
        weeklyData[dayOfWeek].amount += t.amount;
        weeklyData[dayOfWeek].count += 1;
      });
    
    // Calculate average when there are transactions
    weeklyData.forEach(day => {
      if (day.count > 0) {
        day.average = day.amount / day.count;
      } else {
        day.average = 0;
      }
    });
    
    return weeklyData;
  };
  
  const weeklyData = generateWeeklyData();
  
  // Generate category trend data
  const generateCategoryTrendData = () => {
    const monthsToShow = 6;
    const now = new Date();
    const categoryData = [];
    
    // If no categories selected, use top 3 by total amount
    const categoriesToShow = selectedCategories.length > 0 
      ? selectedCategories 
      : uniqueCategories
          .map(category => {
            const total = transactions
              .filter(t => t.type === 'expense' && t.category === category)
              .reduce((sum, t) => sum + t.amount, 0);
            return { category, total };
          })
          .sort((a, b) => b.total - a.total)
          .slice(0, 3)
          .map(c => c.category);
    
    for (let i = monthsToShow - 1; i >= 0; i--) {
      const month = subMonths(now, i);
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      const monthName = format(month, 'MMM');
      
      const monthData: any = {
        name: monthName,
        month: format(month, 'yyyy-MM'),
      };
      
      categoriesToShow.forEach(category => {
        const categoryTotal = transactions
          .filter(t => {
            const transactionDate = parseISO(t.date);
            return t.type === 'expense' && 
                   t.category === category && 
                   transactionDate >= monthStart && 
                   transactionDate <= monthEnd;
          })
          .reduce((sum, t) => sum + t.amount, 0);
        
        monthData[category] = categoryTotal;
      });
      
      categoryData.push(monthData);
    }
    
    return { data: categoryData, categories: categoriesToShow };
  };
  
  const { data: categoryTrendData, categories: shownCategories } = generateCategoryTrendData();
  
  // Handle category selection
  const handleCategoryToggle = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else {
      if (selectedCategories.length < 5) {
        setSelectedCategories([...selectedCategories, category]);
      }
    }
  };
  
  // Get colors for categories
  const COLORS = ['#1a73e8', '#34a853', '#fbbc05', '#ea4335', '#9334ea'];
  
  return (
    <div className="space-y-8">
      {/* Monthly Comparison Chart */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between">
            <div>
              <CardTitle>Monthly Spending Trends</CardTitle>
              <CardDescription>Compare your spending over the last 6 months</CardDescription>
            </div>
            <div className="flex items-center mt-2 sm:mt-0 space-x-2">
              <Select defaultValue={selectedView} onValueChange={setSelectedView}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="View" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="byCategory">By Category</SelectItem>
                </SelectContent>
              </Select>
              
              {selectedView === 'all' && (
                <ToggleGroup 
                  type="single" 
                  defaultValue={showIncome ? 'income' : 'expenses'}
                  onValueChange={(value) => {
                    if (value === 'income') setShowIncome(true);
                    if (value === 'expenses') setShowIncome(false);
                  }}
                >
                  <ToggleGroupItem value="expenses" aria-label="Expenses only">Expenses</ToggleGroupItem>
                  <ToggleGroupItem value="income" aria-label="Show Income">+Income</ToggleGroupItem>
                </ToggleGroup>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthlyData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis 
                tickFormatter={(value) => formatCurrency(value).replace('$', '')}
              />
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
              <Legend />
              
              {selectedView === 'all' ? (
                <>
                  <Bar dataKey="total" name="Expenses" fill="#f87171" />
                  {showIncome && (
                    <>
                      <Bar dataKey="income" name="Income" fill="#4ade80" />
                      <Bar dataKey="net" name="Net" fill="#60a5fa" />
                    </>
                  )}
                </>
              ) : (
                uniqueCategories.map((category, index) => (
                  <Bar 
                    key={category} 
                    dataKey={category} 
                    name={category}
                    stackId="a"
                    fill={COLORS[index % COLORS.length]} 
                  />
                ))
              )}
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      {/* Category Trend + Weekly Pattern */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category Trend Tracker */}
        <Card>
          <CardHeader>
            <CardTitle>Category Trend Tracker</CardTitle>
            <CardDescription>Compare spending across different categories over time</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            <div className="flex flex-wrap gap-2 mb-4">
              {uniqueCategories.map((category, index) => (
                <div 
                  key={category}
                  onClick={() => handleCategoryToggle(category)}
                  className={`px-3 py-1 rounded-full text-xs cursor-pointer transition-colors ${
                    selectedCategories.includes(category) 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {category}
                </div>
              ))}
            </div>
            
            <ResponsiveContainer width="100%" height="80%">
              <LineChart
                data={categoryTrendData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => formatCurrency(value).replace('$', '')} />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Legend />
                {shownCategories.map((category, index) => (
                  <Line 
                    key={category}
                    type="monotone"
                    dataKey={category}
                    name={category}
                    stroke={COLORS[index % COLORS.length]}
                    activeDot={{ r: 8 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Weekly Pattern Analyzer */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Spending Pattern</CardTitle>
            <CardDescription>See which days of the week you spend the most</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={weeklyData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => formatCurrency(value).replace('$', '')} />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Legend />
                <Bar 
                  dataKey="amount" 
                  name="Total Spending" 
                  fill="#f87171"
                  background={{ fill: '#eee' }}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
