
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const AnomalyDetection = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Unusual Transactions</CardTitle>
          <CardDescription>Flagged transactions that don't match your typical spending patterns</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">Coming soon: Anomaly detection for unusual transactions</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Category Spending Spikes</CardTitle>
          <CardDescription>Categories where spending has significantly increased</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">Coming soon: Category spending spike detection</p>
        </CardContent>
      </Card>
    </div>
  );
};
