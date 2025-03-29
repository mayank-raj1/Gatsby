
import { useState } from 'react';
import { useFinanceData, Transaction } from '@/hooks/useFinanceData';
import { ArrowUpRight, ArrowDownRight, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';

interface TransactionLogProps {
  transactions: Transaction[];
}

export const TransactionLog = ({ transactions }: TransactionLogProps) => {
  const { deleteTransaction } = useFinanceData();
  const [search, setSearch] = useState('');
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric',
    }).format(date);
  };

  // Filter transactions based on search term
  const filteredTransactions = transactions.filter(transaction => 
    transaction.description.toLowerCase().includes(search.toLowerCase()) ||
    transaction.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = (id: string, description: string) => {
    deleteTransaction(id);
    toast({
      title: "Transaction deleted",
      description: `"${description}" has been removed`,
    });
  };

  return (
    <div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
        <Input
          className="pl-9 py-2 fin-input"
          placeholder="Search transactions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      
      <div className="overflow-hidden rounded-lg">
        {filteredTransactions.length > 0 ? (
          <div className="max-h-[400px] overflow-y-auto pr-1">
            <div className="space-y-2">
              {filteredTransactions.map((transaction) => (
                <div 
                  key={transaction.id}
                  className="group p-3 rounded-lg bg-white hover:bg-secondary/50 transition-all duration-300"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${
                        transaction.type === 'income' ? 'bg-fin-income/10 text-fin-income' : 'bg-fin-expense/10 text-fin-expense'
                      }`}>
                        {transaction.type === 'income' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                      </div>
                      
                      <div>
                        <p className="font-medium text-sm">{transaction.description}</p>
                        <p className="text-xs text-muted-foreground">{transaction.category}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className={`font-semibold ${
                          transaction.type === 'income' ? 'text-fin-income' : 'text-fin-expense'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </p>
                        <p className="text-xs text-muted-foreground">{formatDate(transaction.date)}</p>
                      </div>
                      
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                          >
                            <Trash2 size={16} className="text-muted-foreground hover:text-destructive" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-4">
                          <div className="space-y-4">
                            <h4 className="font-medium">Delete transaction</h4>
                            <p className="text-sm text-muted-foreground">
                              Are you sure you want to delete this transaction? This action cannot be undone.
                            </p>
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="sm">Cancel</Button>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => handleDelete(transaction.id, transaction.description)}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            {search ? 'No transactions match your search' : 'No transactions yet'}
          </div>
        )}
      </div>
    </div>
  );
};
