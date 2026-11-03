import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { plansApi } from '@/lib/api/plans';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Alert } from '@/components/ui/Alert';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/Table';
import { formatINR } from '@/lib/utils';
import { extractErrorMessage } from '@/lib/api/client';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

export interface PlanDetailPageProps {
  planId: string;
  onNavigate: (path: string) => void;
}

export const PlanDetailPage: React.FC<PlanDetailPageProps> = ({ planId, onNavigate }) => {
  const {
    data: plan,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['plan', planId],
    queryFn: () => plansApi.getById(planId),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNavigate('/plans')}
          icon={<ArrowLeft className="w-4 h-4" />}
        >
          Back to Plans
        </Button>
        <Alert variant="error" title="Plan Template Not Found">
          {extractErrorMessage(error)}
          <div className="mt-2">
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onNavigate('/plans')}
        icon={<ArrowLeft className="w-4 h-4" />}
      >
        Back to Plans
      </Button>

      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900">{plan.name}</h1>
              <Badge variant="outline">Active plan</Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Approved fixed collection and withdrawal schedule
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div>
              <span className="text-xs text-slate-400">Plan amount</span>
              <p className="text-2xl font-black text-slate-900">
                {formatINR(Number(plan.totalAmount))}
              </p>
            </div>
            <div className="border-l border-slate-200 pl-6">
              <span className="text-xs text-slate-400">Duration</span>
              <p className="text-xl font-bold text-slate-900">{plan.installmentCount} Months</p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-sm text-slate-900">Predefined schedule</h3>
            <p className="text-xs text-slate-500">
              Amounts are read directly from the stored plan template
            </p>
          </div>
          <Badge variant="info">{plan.schedules.length} schedule rows</Badge>
        </div>
        {plan.schedules.length !== plan.installmentCount && (
          <Alert variant="error" title="Schedule configuration needs attention">
            The stored schedule contains {plan.schedules.length} rows, but this plan declares{' '}
            {plan.installmentCount} installments. Do not use this plan to create a batch until the
            data is corrected.
          </Alert>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Installment</TableHead>
              <TableHead>Collection amount</TableHead>
              <TableHead className="text-right">Withdrawal amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plan.schedules.map((item) => (
              <TableRow key={item.installmentNumber}>
                <TableCell className="font-mono font-semibold text-xs text-slate-900">
                  #{item.installmentNumber}
                </TableCell>
                <TableCell className="text-xs text-slate-700 font-medium">
                  {formatINR(Number(item.installmentAmount))}
                </TableCell>
                <TableCell className="text-right text-xs font-bold text-slate-900">
                  {formatINR(Number(item.withdrawalAmount))}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />
        <span>
          Plan templates are read-only in this showcase. When a batch is created, the backend copies
          this schedule into batch installments; later template edits do not rewrite historical
          batch schedules.
        </span>
      </div>
    </div>
  );
};
