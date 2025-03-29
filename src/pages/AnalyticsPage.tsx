
import { Layout } from '@/components/layout/Layout';
import { FinanceProvider } from '@/hooks/useFinanceData';
import { ExpenseAnalytics } from '@/components/analytics/ExpenseAnalytics';

const AnalyticsPage = () => {
  return (
    <FinanceProvider>
      <Layout>
        <ExpenseAnalytics />
      </Layout>
    </FinanceProvider>
  );
};

export default AnalyticsPage;
