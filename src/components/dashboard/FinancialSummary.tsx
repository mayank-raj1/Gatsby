
import { ArrowUpRight, ArrowDownRight, Wallet, PiggyBank } from 'lucide-react';
import { motion } from 'framer-motion';

interface FinancialSummaryProps {
  income: number;
  expenses: number;
  savings: number;
  balance: number;
}

export const FinancialSummary = ({ income, expenses, savings, balance }: FinancialSummaryProps) => {
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const summaryItems = [
    {
      title: 'Available Balance',
      amount: balance,
      icon: <Wallet size={20} />,
      color: 'bg-white',
      textColor: balance >= 0 ? 'text-black' : 'text-fin-expense',
      delay: 0,
    },
    {
      title: 'Total Income',
      amount: income,
      icon: <ArrowUpRight size={20} />,
      color: 'bg-fin-income/10',
      textColor: 'text-fin-income',
      iconColor: 'text-fin-income',
      delay: 0.1,
    },
    {
      title: 'Total Expenses',
      amount: expenses,
      icon: <ArrowDownRight size={20} />,
      color: 'bg-fin-expense/10',
      textColor: 'text-fin-expense',
      iconColor: 'text-fin-expense',
      delay: 0.2,
    },
    {
      title: 'Total Savings',
      amount: savings,
      icon: <PiggyBank size={20} />,
      color: 'bg-fin-savings/10',
      textColor: 'text-fin-savings',
      iconColor: 'text-fin-savings',
      delay: 0.3,
    },
  ];

  return (
    <div className="fin-card animate-on-scroll">
      <h2 className="text-lg font-semibold mb-4">Financial Summary</h2>
      
      <div className="space-y-4">
        {summaryItems.map((item, index) => (
          <motion.div
            key={index}
            className={`relative overflow-hidden rounded-lg p-4 ${item.color}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.5, 
              delay: item.delay, 
              ease: [0.4, 0, 0.2, 1] 
            }}
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">{item.title}</p>
                <p className={`text-xl font-semibold mt-1 ${item.textColor}`}>
                  {formatCurrency(item.amount)}
                </p>
              </div>
              <div className={`p-2 rounded-full ${item.color} ${item.iconColor}`}>
                {item.icon}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
