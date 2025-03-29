
import { useState } from 'react';
import { useFinanceData, TransactionType } from '@/hooks/useFinanceData';
import { ArrowUpRight, ArrowDownRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import { toast } from '@/hooks/use-toast';

const CATEGORIES = {
  income: ['Salary', 'Freelance', 'Gifts', 'Investments', 'Side Hustle', 'Other'],
  expense: ['Food & Drinks', 'Transportation', 'Entertainment', 'Education', 'Shopping', 'Health', 'Bills', 'Other']
};

export const QuickAdd = () => {
  const { addTransaction, budgets } = useFinanceData();
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES.expense[0]);

  const handleTypeChange = (value: string) => {
    const newType = value as TransactionType;
    setType(newType);
    setCategory(CATEGORIES[newType][0]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || !description || !category) {
      toast({
        title: "Missing information",
        description: "Please fill out all fields",
        variant: "destructive",
      });
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid positive number",
        variant: "destructive",
      });
      return;
    }

    addTransaction({
      amount: amountNum,
      description,
      category,
      type,
      date: new Date().toISOString(),
    });

    // Reset form
    setAmount('');
    setDescription('');

    toast({
      title: `${type === 'income' ? 'Income' : 'Expense'} added`,
      description: `$${amountNum.toFixed(0)} for ${description}`,
    });
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Quick Add</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <Tabs defaultValue="expense" onValueChange={handleTypeChange}>
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="expense">
              <span className="flex items-center gap-1">
                <ArrowDownRight size={16} />
                <span>Expense</span>
              </span>
            </TabsTrigger>
            <TabsTrigger value="income">
              <span className="flex items-center gap-1">
                <ArrowUpRight size={16} />
                <span>Income</span>
              </span>
            </TabsTrigger>
          </TabsList>

          <div className="mt-4">
            <div className="mb-3">
              <label htmlFor="amount" className="block text-sm font-medium mb-1">Amount</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                  $
                </div>
                <Input
                  id="amount"
                  className="pl-7 fin-input"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  type="number"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>
            
            <div className="mb-3">
              <label htmlFor="description" className="block text-sm font-medium mb-1">Description</label>
              <Input
                id="description"
                className="fin-input"
                placeholder="What was it for?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="category" className="block text-sm font-medium mb-1">Category</label>
              <div className="grid grid-cols-2 gap-2">
                <TabsContent value="expense" className="mt-0">
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.expense.map((cat) => (
                      <motion.button
                        key={cat}
                        type="button"
                        whileTap={{ scale: 0.97 }}
                        className={`px-3 py-1.5 text-xs rounded-full transition-colors border ${
                          category === cat 
                            ? 'bg-primary text-white border-primary' 
                            : 'bg-white hover:bg-secondary border-border'
                        }`}
                        onClick={() => setCategory(cat)}
                      >
                        {cat}
                      </motion.button>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="income" className="mt-0">
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.income.map((cat) => (
                      <motion.button
                        key={cat}
                        type="button"
                        whileTap={{ scale: 0.97 }}
                        className={`px-3 py-1.5 text-xs rounded-full transition-colors border ${
                          category === cat 
                            ? 'bg-primary text-white border-primary' 
                            : 'bg-white hover:bg-secondary border-border'
                        }`}
                        onClick={() => setCategory(cat)}
                      >
                        {cat}
                      </motion.button>
                    ))}
                  </div>
                </TabsContent>
              </div>
            </div>
          </div>
        </Tabs>
        
        <Button type="submit" className="w-full">
          <Plus size={16} className="mr-1" />
          Add {type === 'income' ? 'Income' : 'Expense'}
        </Button>
      </form>
    </div>
  );
};
