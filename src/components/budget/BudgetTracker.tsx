import { useState } from 'react';
import { Plus, ChevronLeft, ChevronRight, CalendarPlus } from 'lucide-react';
import { useFinanceData } from '@/hooks/useFinanceData';
import { BudgetCategory } from './BudgetCategory';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

const CATEGORIES = [
  'Food & Drinks', 'Transportation', 'Entertainment', 'Education',
  'Shopping', 'Health', 'Bills', 'Rent', 'Other'
];

export const BudgetTracker = () => {
  const {
    budgets,
    addBudget,
    totalExpenses,
    currentBudgetPeriod,
    setCurrentBudgetPeriod,
    createNextMonthBudgets
  } = useFinanceData();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newCategory, setNewCategory] = useState(CATEGORIES[0]);
  const [newAmount, setNewAmount] = useState('');
  const [isRecurring, setIsRecurring] = useState(true);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format month name
  const getMonthName = (month: number, year: number) => {
    const date = new Date(year, month - 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  // Navigation functions
  const goToPreviousMonth = () => {
    const prevMonth = currentBudgetPeriod.month === 1 ? 12 : currentBudgetPeriod.month - 1;
    const prevYear = currentBudgetPeriod.month === 1 ? currentBudgetPeriod.year - 1 : currentBudgetPeriod.year;
    setCurrentBudgetPeriod({month: prevMonth, year: prevYear});
  };

  const goToNextMonth = () => {
    const nextMonth = currentBudgetPeriod.month === 12 ? 1 : currentBudgetPeriod.month + 1;
    const nextYear = currentBudgetPeriod.month === 12 ? currentBudgetPeriod.year + 1 : currentBudgetPeriod.year;
    setCurrentBudgetPeriod({month: nextMonth, year: nextYear});
  };

  const goToCurrentMonth = () => {
    const now = new Date();
    setCurrentBudgetPeriod({
      month: now.getMonth() + 1,
      year: now.getFullYear()
    });
  };

  const handleCreateNextMonthBudgets = async () => {
    try {
      const result = await createNextMonthBudgets();
      toast({
        title: "Budgets created",
        description: `Created ${result.budgets.length} budgets for next month`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create next month's budgets",
        variant: "destructive",
      });
    }
  };

  const handleAddBudget = () => {
    // Check if budget already exists for this category
    if (budgets.some(budget => budget.category === newCategory)) {
      toast({
        title: "Category already exists",
        description: "You already have a budget for this category in this month",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(newAmount);

    if (!newCategory || isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid input",
        description: "Please enter a valid category and amount",
        variant: "destructive",
      });
      return;
    }

    const newBudget = {
      category: newCategory,
      amount: amount,
      month: currentBudgetPeriod.month,
      year: currentBudgetPeriod.year,
      recurring: isRecurring
    };

    addBudget(newBudget);

    // Reset form and close dialog
    setNewCategory(CATEGORIES[0]);
    setNewAmount('');
    setIsRecurring(true);
    setIsAddDialogOpen(false);

    toast({
      title: "Budget created",
      description: `${formatCurrency(amount)} budget added for ${newCategory}`,
    });
  };

  // Calculate totals for current period
  const totalBudgeted = budgets.reduce((total, budget) => total + budget.amount, 0);
  const periodTotal = budgets.reduce((total, budget) => total + budget.spent, 0);

  return (
      <div className="page-container">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-center sm:text-left">Budget Tracker</h1>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center">
              <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
                <ChevronLeft size={18} />
              </Button>

              <div className="px-4 font-medium">
                {getMonthName(currentBudgetPeriod.month, currentBudgetPeriod.year)}
              </div>

              <Button variant="outline" size="sm" onClick={goToNextMonth}>
                <ChevronRight size={18} />
              </Button>

              <Button variant="ghost" size="sm" className="ml-1" onClick={goToCurrentMonth}>
                Today
              </Button>
            </div>

            <div className="flex gap-2">
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus size={16} className="mr-2" />
                    New Budget
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Create New Budget</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Category</label>
                      <Select
                          value={newCategory}
                          onValueChange={setNewCategory}
                      >
                        <SelectTrigger className="fin-input">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map(category => (
                              <SelectItem key={category} value={category}>{category}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Monthly Budget Amount</label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                          $
                        </div>
                        <Input
                            className="pl-7 fin-input"
                            placeholder="0"
                            value={newAmount}
                            onChange={(e) => setNewAmount(e.target.value)}
                            type="number"
                            min="0"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                            id="recurring"
                            checked={isRecurring}
                            onCheckedChange={(checked) => setIsRecurring(!!checked)}
                        />
                        <label
                            htmlFor="recurring"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Recurring monthly budget
                        </label>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Recurring budgets will be automatically created for the next month
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Budget Period</label>
                      <div className="p-3 bg-muted rounded-md">
                        {getMonthName(currentBudgetPeriod.month, currentBudgetPeriod.year)}
                      </div>
                    </div>

                    <Button className="w-full" onClick={handleAddBudget}>
                      Add Budget
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Button variant="outline" onClick={handleCreateNextMonthBudgets}>
                <CalendarPlus size={16} className="mr-2" />
                Create Next Month
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="fin-card animate-on-scroll">
            <h2 className="text-lg font-semibold mb-4">Budget Summary</h2>

            <div className="space-y-4">
              <div className="bg-white/70 rounded-lg p-4">
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Budget</p>
                <p className="text-2xl font-semibold">{formatCurrency(totalBudgeted)}</p>
              </div>

              <div className="bg-white/70 rounded-lg p-4">
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Spent</p>
                <p className="text-2xl font-semibold text-fin-expense">{formatCurrency(periodTotal)}</p>
              </div>

              <div className="bg-white/70 rounded-lg p-4">
                <p className="text-sm font-medium text-muted-foreground mb-1">Remaining</p>
                <p className={`text-2xl font-semibold ${
                    totalBudgeted - periodTotal >= 0 ? 'text-fin-income' : 'text-fin-expense'
                }`}>
                  {formatCurrency(totalBudgeted - periodTotal)}
                </p>
              </div>
            </div>
          </div>

          <div className="col-span-1 lg:col-span-2 fin-card animate-on-scroll">
            <h2 className="text-lg font-semibold mb-4">Budget Allocation</h2>

            {budgets.length > 0 ? (
                <div className="space-y-3">
                  {budgets.map(budget => (
                      <BudgetCategory
                          key={budget.id}
                          budget={budget}
                      />
                  ))}
                </div>
            ) : (
                <div className="py-8 text-center text-muted-foreground">
                  No budgets created for {getMonthName(currentBudgetPeriod.month, currentBudgetPeriod.year)}.
                  Click "New Budget" to get started.
                </div>
            )}
          </div>
        </div>
      </div>
  );
};