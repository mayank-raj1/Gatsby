
import { useState } from 'react';
import { useFinanceData } from '@/hooks/useFinanceData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SpendingDashboard } from './SpendingDashboard';
import { TrendAnalysis } from './TrendAnalysis';
import { SpendingPatterns } from './SpendingPatterns';
import { AnomalyDetection } from './AnomalyDetection';
import { ComparisonTools } from './ComparisonTools';

export const ExpenseAnalytics = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="page-container">
      <h1 className="text-3xl font-bold mb-8 text-center sm:text-left">Expense Analytics</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 mb-6">
          <TabsTrigger value="dashboard">Spending Dashboard</TabsTrigger>
          <TabsTrigger value="trends">Trend Analysis</TabsTrigger>
          <TabsTrigger value="patterns">Spending Patterns</TabsTrigger>
          <TabsTrigger value="anomalies">Anomaly Detection</TabsTrigger>
          <TabsTrigger value="comparison">Comparison Tools</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard">
          <SpendingDashboard />
        </TabsContent>
        
        <TabsContent value="trends">
          <TrendAnalysis />
        </TabsContent>
        
        <TabsContent value="patterns">
          <SpendingPatterns />
        </TabsContent>
        
        <TabsContent value="anomalies">
          <AnomalyDetection />
        </TabsContent>
        
        <TabsContent value="comparison">
          <ComparisonTools />
        </TabsContent>
      </Tabs>
    </div>
  );
};
