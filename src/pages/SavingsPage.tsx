
import { SavingsGoals } from '@/components/savings/SavingsGoals';
import { Layout } from '@/components/layout/Layout';
import { FinanceProvider } from '@/hooks/useFinanceData';

const SavingsPage = () => {
  return (
    <FinanceProvider>
      <Layout>
        <SavingsGoals />
      </Layout>
    </FinanceProvider>
  );
};

export default SavingsPage;
