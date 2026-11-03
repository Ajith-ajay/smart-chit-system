import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { plansApi } from '@/lib/api/plans';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Alert } from '@/components/ui/Alert';
import { formatINR } from '@/lib/utils';
import { extractErrorMessage } from '@/lib/api/client';
import { PlanTemplate } from '@/types';
import { Layers, Calendar, ArrowRight, ShieldCheck } from 'lucide-react';

export interface PlansListPageProps {
  onNavigate: (path: string) => void;
}

export const PlansListPage: React.FC<PlansListPageProps> = ({ onNavigate }) => {
  const {
    data: plans = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['plans'],
    queryFn: () => plansApi.getAll(),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chit Plan Templates"
        description="Standard chit plans with backend-verified 20-month collection & withdrawal schedules"
      />

      {error && (
        <Alert variant="error" title="Could not load plan templates">
          {extractErrorMessage(error)}
          <div className="mt-2">
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        </Alert>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-lg" />
          ))}
        </div>
      ) : plans.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center">
          <Layers className="mx-auto h-8 w-8 text-slate-400 mb-2" />
          <h3 className="text-sm font-semibold text-slate-900">No Plan Templates Found</h3>
          <p className="text-xs text-slate-500 mt-1">
            Ensure the NestJS backend seed has executed (Standard plans: ₹50K, ₹1L, ₹2L, ₹5L).
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {plans.map((plan: PlanTemplate) => (
            <Card
              key={plan.id}
              className="p-5 flex flex-col justify-between border-slate-200 hover:border-slate-300"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="outline">Plan Template</Badge>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {plan.installmentCount} Months
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                <div className="mt-3">
                  <span className="text-xs text-slate-500">Plan Amount</span>
                  <p className="text-2xl font-black text-slate-900 tracking-tight">
                    {formatINR(Number(plan.totalAmount))}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Installments:</span>
                    <strong className="text-slate-800">{plan.installmentCount} installments</strong>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-100">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => onNavigate(`/plans/${plan.id}`)}
                >
                  <span>View {plan.installmentCount}-Month Schedule</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Financial notice */}
      <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-slate-800">Decimal-Based Financial Precision</p>
          <p className="mt-0.5 text-slate-500">
            All installment and withdrawal amounts come from the approved plan template stored in
            the database. The frontend displays the backend schedule without recalculating it.
          </p>
        </div>
      </div>
    </div>
  );
};
