import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/lib/api/reports';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
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
import { formatINR, formatDate } from '@/lib/utils';
import { extractErrorMessage } from '@/lib/api/client';
import { ArrowLeft, CalendarDays, PieChart, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export interface BatchReportPageProps {
  batchId: string;
  onNavigate: (path: string) => void;
}

export const BatchReportPage: React.FC<BatchReportPageProps> = ({ batchId, onNavigate }) => {
  const {
    data: report,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['report-batch', batchId],
    queryFn: () => reportsApi.getBatchReport(batchId),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-44 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNavigate('/batches')}
          icon={<ArrowLeft className="w-4 h-4" />}
        >
          Back to Batches
        </Button>
        <Alert variant="error" title="Batch Report Not Found">
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

  const chartData =
    report.plans?.map((p) => ({
      name: p.planName,
      collected: p.collected,
      outstanding: p.outstanding,
    })) || [];

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onNavigate(`/batches/${batchId}`)}
        icon={<ArrowLeft className="w-4 h-4" />}
      >
        Back to Batch
      </Button>

      <PageHeader
        title={`Batch Report: ${report.batch?.name || batchId}`}
        description={`Status: ${report.batch?.status} · Current Installment #${report.batch?.currentInstallment || 0} of ${report.batch?.totalInstallments || 20}`}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-emerald-50/40 border-emerald-200">
          <span className="text-xs text-emerald-800 uppercase font-semibold block">
            Total Collected
          </span>
          <p className="text-xl font-black text-emerald-950 mt-1">
            {formatINR(report.totalActualCollection || 0)}
          </p>
        </Card>
        <Card className="p-4">
          <span className="text-xs text-slate-500 uppercase font-semibold block">
            Expected Target
          </span>
          <p className="text-xl font-black text-slate-900 mt-1">
            {formatINR(report.totalExpectedCollection || 0)}
          </p>
        </Card>
        <Card className="p-4 bg-sky-50/40 border-sky-200">
          <span className="text-xs text-sky-800 uppercase font-semibold block">
            Approved Claims
          </span>
          <p className="text-xl font-black text-sky-950 mt-1">
            {formatINR(report.totalWithdrawalApproved || 0)}
          </p>
        </Card>
        <Card className="p-4">
          <span className="text-xs text-slate-500 uppercase font-semibold block">
            Payouts Disbursed
          </span>
          <p className="text-xl font-black text-slate-900 mt-1">
            {formatINR(report.totalPayoutsDistributed || 0)}
          </p>
        </Card>
      </div>

      {/* Plans breakdown chart & table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h3 className="font-semibold text-sm text-slate-900 mb-3">
            Plan-wise Financial Progress
          </h3>
          <div className="h-64 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `₹${v / 1000}k`} />
                  <Tooltip
                    formatter={(val: unknown) => [formatINR(Number(val)), 'Amount']}
                    contentStyle={{
                      backgroundColor: '#fff',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                    }}
                  />
                  <Bar dataKey="collected" fill="#0f172a" name="Collected" radius={[4, 4, 0, 0]} />
                  <Bar
                    dataKey="outstanding"
                    fill="#e11d48"
                    name="Outstanding"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">
                No plan data recorded.
              </div>
            )}
          </div>
        </Card>

        <Card className="p-5 space-y-3">
          <h3 className="font-semibold text-sm text-slate-900">Plan Seat Statistics</h3>
          {report.plans && report.plans.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan</TableHead>
                  <TableHead>Chit Value</TableHead>
                  <TableHead>Seats</TableHead>
                  <TableHead className="text-right">Collected</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.plans.map((p, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-semibold text-xs text-slate-900">
                      {p.planName}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 font-medium">
                      {formatINR(p.chitValue)}
                    </TableCell>
                    <TableCell className="text-xs text-slate-700">{p.enrollmentCount}</TableCell>
                    <TableCell className="text-right text-xs font-bold text-emerald-800">
                      {formatINR(p.collected)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-xs text-slate-400 py-6 text-center">No plans attached.</p>
          )}
        </Card>
      </div>
    </div>
  );
};
