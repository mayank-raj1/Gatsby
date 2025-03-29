
import { Dashboard } from '@/components/dashboard/Dashboard';
import { Layout } from '@/components/layout/Layout';
import { FinanceProvider } from '@/hooks/useFinanceData';

const Index = () => {
  return (
    <FinanceProvider>
      <Layout>
        <Dashboard />
      </Layout>
    </FinanceProvider>
  );
};

export default Index;
