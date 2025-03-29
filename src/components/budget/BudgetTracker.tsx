
import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useFinanceData } from '@/hooks/useFinanceData';
import { BudgetCategory } from './BudgetCategory';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';

const CATEGORIES = [
  'Food & Drinks', 'Transportation', 'Entertainment', 'Education', 
  'Shopping', 'Health', 'Bills', 'Rent', 'Other'
];

export const BudgetTracker = () => {
  const { budgets, addBudget, totalExpenses } = useFinanceData();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newCategory, setNewCategory] = useState(CATEGORIES[0]);
  const [newAmount, setNewAmount] = useState('');

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleAddBudget = () => {
    // Check if budget already exists for this category
    if (budgets.some(budget => budget.category === newCategory)) {
      toast({
        title: "Category already exists",
        description: "You already have a budget for this category",
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

    addBudget({
      category: newCategory,
      amount: amount,
    });

    // Reset form and close dialog
    setNewCategory(CATEGORIES[0]);
    setNewAmount('');
    setIsAddDialogOpen(false);

    toast({
      title: "Budget created",
      description: `${formatCurrency(amount)} budget added for ${newCategory}`,
    });
  };

  // Calculate totals
  const totalBudgeted = budgets.reduce((total, budget) => total + budget.amount, 0);
  
  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-center sm:text-left">Budget Tracker</h1>
        
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
                <select 
                  className="fin-input w-full"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                >
                  {CATEGORIES.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
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
              <Button className="w-full" onClick={handleAddBudget}>
                Add Budget
              </Button>
            </div>
          </DialogContent>
        </Dialog>
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
              <p className="text-2xl font-semibold text-fin-expense">{formatCurrency(totalExpenses)}</p>
            </div>
            
            <div className="bg-white/70 rounded-lg p-4">
              <p className="text-sm font-medium text-muted-foreground mb-1">Remaining</p>
              <p className={`text-2xl font-semibold ${
                totalBudgeted - totalExpenses >= 0 ? 'text-fin-income' : 'text-fin-expense'
              }`}>
                {formatCurrency(totalBudgeted - totalExpenses)}
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
              No budgets created yet. Click "New Budget" to get started.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
