import React, { Suspense, lazy } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load components for better performance
const SalesTeamTable = lazy(() => import('./SalesTeamTable'));
const TeamMemoSection = lazy(() => import('./TeamMemoSection'));

// Loading skeleton component
const LoadingCard = ({ title }: { title: string }) => (
  <Card className="w-full">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Skeleton className="h-6 w-6 rounded" />
        <Skeleton className="h-6 w-48 rounded" />
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        <Skeleton className="h-4 w-full rounded" />
        <Skeleton className="h-4 w-3/4 rounded" />
        <Skeleton className="h-4 w-1/2 rounded" />
      </div>
    </CardContent>
  </Card>
);

// Lazy Sales Team Table
export const LazySalesTeamTable = ({ 
  salesTeam, 
  dateRange, 
  setDateRange 
}: { 
  salesTeam: any[];
  dateRange: string;
  setDateRange: (value: string) => void;
}) => (
  <Suspense fallback={<LoadingCard title="ทีมขาย" />}>
    <SalesTeamTable salesTeam={salesTeam} dateRange={dateRange} setDateRange={setDateRange} />
  </Suspense>
);

// Lazy Team Memo Section
export const LazyTeamMemoSection = () => (
  <Suspense fallback={<LoadingCard title="บันทึกทีม" />}>
    <TeamMemoSection />
  </Suspense>
); 