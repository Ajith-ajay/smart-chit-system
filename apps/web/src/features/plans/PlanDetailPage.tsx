import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { plansApi } from '@/lib/api/plans';
import { PageHeader } from '@/components/common/PageHeader';
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
import { ArrowLeft, Layers, ShieldCheck, Calendar } from 'lucide-react';

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

  // Fallback visual 20-schedule calculation if backend doesn't supply array in JSON directly
  const installmentCount = plan.totalInstallments || 20;
  const nominalMonthly = plan.monthlyContribution || plan.chitValue / installmentCount;

  const schedules =
    plan.installmentSchedule && plan.installmentSchedule.length > 0
      ? plan.installmentSchedule
      : Array.from({ length: installmentCount }, (_, i) => ({
          installmentNumber: i + 1,
          dueAmount: nominalMonthly,
          dividendAmount: 0,
          netPayableAmount: nominalMonthly,
        }));

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

      {/* Overview header */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900">{plan.name}</h1>
              <Badge variant="outline">20-Month Standard</Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Authoritative plan blueprint with fixed installment calculations
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div>
              <span className="text-xs text-slate-400">Total Chit Value</span>
              <p className="text-2xl font-black text-slate-900">{formatINR(plan.chitValue)}</p>
            </div>
            <div className="border-l border-slate-200 pl-6">
              <span className="text-xs text-slate-400">Duration</span>
              <p className="text-xl font-bold text-slate-900">{installmentCount} Months</p>
            </div>
          </div>
        </div>
      </Card>

      {/* 20-Installment Schedule Table */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-sm text-slate-900">20-Installment Schedule</h3>
            <p className="text-xs text-slate-500">
              Prescribed collection schedule for all enrolled seats in this plan
            </p>
          </div>
          <Badge variant="info">Fixed Scheme</Badge>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Month #</TableHead>
              <TableHead>Installment Name</TableHead>
              <TableHead>Gross Scheduled</TableHead>
              <TableHead>Dividend Offset</TableHead>
              <TableHead className="text-right">Net Payable Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schedules.map((item) => (
              <TableRow key={item.installmentNumber}>
                <TableCell className="font-mono font-semibold text-xs text-slate-900">
                  #{item.installmentNumber}
                </TableCell>
                <TableCell className="text-xs text-slate-700">
                  Installment {item.installmentNumber} of {installmentCount}
                </TableCell>
                <TableCell className="text-xs text-slate-600 font-medium">
                  {formatINR(item.dueAmount)}
                </TableCell>
                <TableCell className="text-xs text-emerald-700 font-medium">
                  {item.dividendAmount ? formatINR(item.dividendAmount) : '—'}
                </TableCell>
                <TableCell className="text-right text-xs font-bold text-slate-900">
                  {formatINR(item.netPayableAmount || item.dueAmount)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Notice */}
      <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />
        <span>
          Plan configurations are read-only templates. Financial allocations and late penalties are
          computed dynamically upon batch enrollment.
        </span>
      </div>
    </div>
  );
};
