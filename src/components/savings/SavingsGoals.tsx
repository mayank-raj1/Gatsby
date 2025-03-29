
import { useState } from 'react';
import { useFinanceData, SavingsGoal } from '@/hooks/useFinanceData';
import { Plus, Pencil, Trash2, Target, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogClose 
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

export const SavingsGoals = () => {
  const { savingsGoals, addSavingsGoal, updateSavingsGoal, deleteSavingsGoal, availableBalance } = useFinanceData();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalAmount, setNewGoalAmount] = useState('');
  const [newGoalDeadline, setNewGoalDeadline] = useState('');
  
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [isContributeDialogOpen, setIsContributeDialogOpen] = useState(false);
  const [contributionAmount, setContributionAmount] = useState('');
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<SavingsGoal | null>(null);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No deadline';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric',
      month: 'short', 
      day: 'numeric'
    }).format(date);
  };

  // Calculate days remaining
  const getDaysRemaining = (deadlineString?: string) => {
    if (!deadlineString) return null;
    
    const deadline = new Date(deadlineString);
    const today = new Date();
    
    // Reset time part for accurate day calculation
    deadline.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  const handleAddGoal = () => {
    const targetAmount = parseFloat(newGoalAmount);
    
    if (!newGoalName || isNaN(targetAmount) || targetAmount <= 0) {
      toast({
        title: "Invalid input",
        description: "Please enter a valid name and target amount",
        variant: "destructive",
      });
      return;
    }

    const newGoal = {
      name: newGoalName,
      targetAmount: targetAmount,
      deadline: newGoalDeadline || undefined,
    };

    addSavingsGoal(newGoal);
    
    // Reset form and close dialog
    setNewGoalName('');
    setNewGoalAmount('');
    setNewGoalDeadline('');
    setIsAddDialogOpen(false);
    
    toast({
      title: "Savings goal created",
      description: `New goal for ${formatCurrency(targetAmount)} added`,
    });
  };

  const handleOpenContribute = (goal: SavingsGoal) => {
    setSelectedGoal(goal);
    setContributionAmount('');
    setIsContributeDialogOpen(true);
  };

  const handleContribute = () => {
    if (!selectedGoal) return;
    
    const amount = parseFloat(contributionAmount);
    
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid positive number",
        variant: "destructive",
      });
      return;
    }

    if (amount > availableBalance) {
      toast({
        title: "Insufficient balance",
        description: "You don't have enough available balance",
        variant: "destructive",
      });
      return;
    }

    const newAmount = selectedGoal.currentAmount + amount;
    updateSavingsGoal(selectedGoal.id, { currentAmount: newAmount });
    
    // Create a transaction for this contribution
    // This is handled internally in the updateSavingsGoal function
    
    setIsContributeDialogOpen(false);
    
    toast({
      title: "Contribution added",
      description: `${formatCurrency(amount)} added to ${selectedGoal.name}`,
    });
  };

  const handleOpenDelete = (goal: SavingsGoal) => {
    setGoalToDelete(goal);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteGoal = () => {
    if (!goalToDelete) return;
    
    deleteSavingsGoal(goalToDelete.id);
    setIsDeleteDialogOpen(false);
    
    toast({
      title: "Savings goal deleted",
      description: `${goalToDelete.name} has been removed`,
    });
  };

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-center sm:text-left">Savings Goals</h1>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus size={16} className="mr-2" />
              New Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Savings Goal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Goal Name</label>
                <Input
                  className="fin-input"
                  placeholder="e.g., Emergency Fund"
                  value={newGoalName}
                  onChange={(e) => setNewGoalName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Target Amount</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                    $
                  </div>
                  <Input
                    className="pl-7 fin-input"
                    placeholder="0"
                    value={newGoalAmount}
                    onChange={(e) => setNewGoalAmount(e.target.value)}
                    type="number"
                    min="0"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Target Date (Optional)</label>
                <Input
                  className="fin-input"
                  type="date"
                  value={newGoalDeadline}
                  onChange={(e) => setNewGoalDeadline(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <Button className="w-full" onClick={handleAddGoal}>
                Create Goal
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {savingsGoals.length > 0 ? (
          savingsGoals.map((goal) => {
            const percentage = Math.min(Math.round((goal.currentAmount / goal.targetAmount) * 100), 100);
            const daysRemaining = getDaysRemaining(goal.deadline);
            
            return (
              <motion.div 
                key={goal.id}
                className="fin-card animate-on-scroll"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center">
                    <div className="p-2 rounded-full bg-fin-savings/10 text-fin-savings mr-3">
                      <Target size={20} />
                    </div>
                    <h3 className="font-semibold text-lg">{goal.name}</h3>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-full"
                    onClick={() => handleOpenDelete(goal)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
                
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-1 text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span>{percentage}%</span>
                  </div>
                  <Progress 
                    value={percentage} 
                    className="h-2 bg-secondary"
                    indicatorClassName="bg-fin-savings"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-white/70 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Saved</p>
                    <p className="font-semibold">{formatCurrency(goal.currentAmount)}</p>
                  </div>
                  <div className="bg-white/70 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Target</p>
                    <p className="font-semibold">{formatCurrency(goal.targetAmount)}</p>
                  </div>
                </div>
                
                {goal.deadline && (
                  <div className="bg-white/70 rounded-lg p-3 mb-4">
                    <p className="text-xs text-muted-foreground mb-1">Deadline</p>
                    <p className="font-semibold flex justify-between">
                      <span>{formatDate(goal.deadline)}</span>
                      {daysRemaining !== null && (
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          daysRemaining < 7 ? 'bg-fin-expense/10 text-fin-expense' :
                          daysRemaining < 30 ? 'bg-fin-chart-3/10 text-fin-chart-3' :
                          'bg-fin-income/10 text-fin-income'
                        }`}>
                          {daysRemaining > 0 ? `${daysRemaining} days left` : 'Due today'}
                        </span>
                      )}
                    </p>
                  </div>
                )}
                
                <Button 
                  className="w-full"
                  onClick={() => handleOpenContribute(goal)}
                >
                  <PlusCircle size={16} className="mr-2" />
                  Add Money
                </Button>
              </motion.div>
            );
          })
        ) : (
          <div className="col-span-full fin-card text-center py-12">
            <Target size={48} className="mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No savings goals yet</h3>
            <p className="text-muted-foreground mb-6">Create your first savings goal to start building your financial future</p>
            <Button 
              onClick={() => setIsAddDialogOpen(true)} 
              className="mx-auto"
            >
              <Plus size={16} className="mr-2" />
              Create Your First Goal
            </Button>
          </div>
        )}
      </div>
      
      {/* Contribute Dialog */}
      {selectedGoal && (
        <Dialog open={isContributeDialogOpen} onOpenChange={setIsContributeDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add to {selectedGoal.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Available Balance:</span>
                <span className="font-medium">{formatCurrency(availableBalance)}</span>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount to add</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                    $
                  </div>
                  <Input
                    className="pl-7 fin-input"
                    placeholder="0"
                    value={contributionAmount}
                    onChange={(e) => setContributionAmount(e.target.value)}
                    type="number"
                    min="0"
                    max={availableBalance.toString()}
                  />
                </div>
              </div>
              <Button 
                className="w-full"
                onClick={handleContribute}
                disabled={availableBalance <= 0}
              >
                Add to Savings
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Delete Dialog */}
      {goalToDelete && (
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Delete Savings Goal</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-muted-foreground mb-4">
                Are you sure you want to delete the "{goalToDelete.name}" savings goal?
                {goalToDelete.currentAmount > 0 && (
                  <span className="block mt-2 font-medium">
                    The current savings of {formatCurrency(goalToDelete.currentAmount)} will be returned to your available balance.
                  </span>
                )}
              </p>
              <div className="flex justify-end gap-2">
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button variant="destructive" onClick={handleDeleteGoal}>
                  Delete Goal
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
