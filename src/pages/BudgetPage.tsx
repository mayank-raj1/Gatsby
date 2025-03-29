
import { BudgetTracker } from '@/components/budget/BudgetTracker';
import { Layout } from '@/components/layout/Layout';
import { FinanceProvider } from '@/hooks/useFinanceData';

const BudgetPage = () => {
  return (
    <FinanceProvider>
      <Layout>
        <BudgetTracker />
      </Layout>
    </FinanceProvider>
  );
};

export default BudgetPage;
