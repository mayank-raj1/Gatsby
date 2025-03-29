
import { useState } from 'react';
import { useFinanceData, Budget } from '@/hooks/useFinanceData';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { motion } from 'framer-motion';

interface BudgetCategoryProps {
  budget: Budget;
}

export const BudgetCategory = ({ budget }: BudgetCategoryProps) => {
  const { updateBudget, deleteBudget } = useFinanceData();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editAmount, setEditAmount] = useState(budget.amount.toString());

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Calculate percentage
  const spentPercentage = Math.min(Math.round((budget.spent / budget.amount) * 100), 100);
  
  // Determine status color
  const getStatusColor = () => {
    if (spentPercentage < 50) return 'bg-fin-income';
    if (spentPercentage < 75) return 'bg-fin-chart-3';
    return 'bg-fin-expense';
  };

  const handleUpdateBudget = () => {
    const newAmount = parseFloat(editAmount);
    
    if (isNaN(newAmount) || newAmount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid positive number",
        variant: "destructive",
      });
      return;
    }

    updateBudget(budget.id, { amount: newAmount });
    setIsEditDialogOpen(false);
    
    toast({
      title: "Budget updated",
      description: `${budget.category} budget updated to ${formatCurrency(newAmount)}`,
    });
  };

  const handleDeleteBudget = () => {
    deleteBudget(budget.id);
    setIsDeleteDialogOpen(false);
    
    toast({
      title: "Budget deleted",
      description: `${budget.category} budget has been removed`,
    });
  };

  return (
    <motion.div 
      className="bg-white/70 rounded-lg p-4 hover:shadow-sm transition-all duration-300"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium">{budget.category}</h3>
        <div className="flex items-center gap-1">
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full">
                <Pencil size={14} />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Edit Budget</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Input 
                    value={budget.category} 
                    disabled 
                    className="fin-input"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Monthly Budget Amount</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                      $
                    </div>
                    <Input
                      className="pl-7 fin-input"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      type="number"
                      min="0"
                    />
                  </div>
                </div>
                <Button className="w-full" onClick={handleUpdateBudget}>
                  Update Budget
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full">
                <Trash2 size={14} />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Delete Budget</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <p className="text-muted-foreground">
                  Are you sure you want to delete the {budget.category} budget? This action cannot be undone.
                </p>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button variant="destructive" onClick={handleDeleteBudget}>
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <div className="mb-2">
        <Progress 
          value={spentPercentage} 
          className="h-2 bg-secondary"
          indicatorClassName={getStatusColor()}
        />
      </div>
      
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">
          {formatCurrency(budget.spent)} spent
        </span>
        <span>
          <span className={spentPercentage >= 100 ? 'text-fin-expense font-medium' : ''}>
            {formatCurrency(budget.spent)}
          </span>
          <span className="text-muted-foreground"> / {formatCurrency(budget.amount)}</span>
        </span>
      </div>
    </motion.div>
  );
};
