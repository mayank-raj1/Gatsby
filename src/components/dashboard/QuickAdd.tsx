// src/components/dashboard/QuickAdd.tsx
import { useState } from 'react';
import { useFinanceData, TransactionType } from '@/hooks/useFinanceData';
import { ArrowUpRight, ArrowDownRight, Plus, MessageSquare, Tag, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

const CATEGORIES = {
  income: ['Salary', 'Freelance', 'Gifts', 'Investments', 'Side Hustle', 'Other'],
  expense: ['Food & Drinks', 'Transportation', 'Entertainment', 'Education', 'Shopping', 'Health', 'Bills', 'Other']
};

export const QuickAdd = () => {
  const { addTransaction, budgets } = useFinanceData();
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [comments, setComments] = useState('');
  const [category, setCategory] = useState(CATEGORIES.expense[0]);
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [showTags, setShowTags] = useState(false);

  const handleTypeChange = (value: string) => {
    const newType = value as TransactionType;
    setType(newType);
    setCategory(CATEGORIES[newType][0]);
  };

  const handleAddTag = () => {
    if (!currentTag.trim()) return;
    if (!tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()]);
    }
    setCurrentTag('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || !description || !category) {
      toast({
        title: "Missing information",
        description: "Please fill out all required fields",
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

    try {
      await addTransaction({
        amount: amountNum,
        description,
        comments,
        tags,
        category,
        type,
        date: new Date().toISOString(),
      });

      // Reset form
      setAmount('');
      setDescription('');
      setComments('');
      setTags([]);
      setShowComments(false);
      setShowTags(false);

      toast({
        title: `${type === 'income' ? 'Income' : 'Expense'} added`,
        description: `$${amountNum.toFixed(0)} for ${description}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add transaction",
        variant: "destructive",
      });
    }
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
                <label htmlFor="amount" className="block text-sm font-medium mb-1">Amount <span className="text-red-500">*</span></label>
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
                      required
                  />
                </div>
              </div>

              <div className="mb-3">
                <label htmlFor="description" className="block text-sm font-medium mb-1">Description <span className="text-red-500">*</span></label>
                <Input
                    id="description"
                    className="fin-input"
                    placeholder="What was it for?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                />
              </div>

              <div className="mb-3">
                <label htmlFor="category" className="block text-sm font-medium mb-1">Category <span className="text-red-500">*</span></label>
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

              {/* Optional Fields Controls */}
              <div className="flex gap-2 mb-3">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={showComments ? "bg-secondary" : ""}
                    onClick={() => setShowComments(!showComments)}
                >
                  <MessageSquare size={14} className="mr-1" />
                  Comments
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={showTags ? "bg-secondary" : ""}
                    onClick={() => setShowTags(!showTags)}
                >
                  <Tag size={14} className="mr-1" />
                  Tags
                </Button>
              </div>

              {/* Comments Field */}
              {showComments && (
                  <div className="mb-3">
                    <label htmlFor="comments" className="block text-sm font-medium mb-1">Comments</label>
                    <Textarea
                        id="comments"
                        className="fin-input min-h-[80px]"
                        placeholder="Add any additional notes here..."
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                    />
                  </div>
              )}

              {/* Tags Field */}
              {showTags && (
                  <div className="mb-3">
                    <label htmlFor="tags" className="block text-sm font-medium mb-1">Tags</label>
                    <div className="flex gap-2">
                      <Input
                          id="tags"
                          className="fin-input"
                          placeholder="Add a tag and press Enter"
                          value={currentTag}
                          onChange={(e) => setCurrentTag(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddTag();
                            }
                          }}
                      />
                      <Button type="button" variant="outline" onClick={handleAddTag}>
                        Add
                      </Button>
                    </div>

                    {tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {tags.map((tag, index) => (
                              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                {tag}
                                <button
                                    type="button"
                                    onClick={() => handleRemoveTag(tag)}
                                    className="text-muted-foreground hover:text-foreground"
                                >
                                  <X size={12} />
                                </button>
                              </Badge>
                          ))}
                        </div>
                    )}
                  </div>
              )}
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