import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/lib/api/reports';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/Table';
import { Skeleton } from '@/components/ui/Skeleton';
import { Alert } from '@/components/ui/Alert';
import { EmptyState } from '@/components/common/EmptyState';
import { formatINR, formatDate } from '@/lib/utils';
import { extractErrorMessage } from '@/lib/api/client';
import { WithdrawalReportItem, WithdrawalStatus } from '@/types';
import { ArrowLeft, HandCoins } from 'lucide-react';

export interface WithdrawalsReportPageProps {
  onNavigate: (path: string) => void;
}

export const WithdrawalsReportPage: React.FC<WithdrawalsReportPageProps> = ({ onNavigate }) => {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const {
    data: withdrawals = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['report-withdrawals', from, to],
    queryFn: () =>
      reportsApi.getWithdrawalsReport({
        from: from || undefined,
        to: to || undefined,
      }),
  });

  const totalRequested = withdrawals.reduce((s, w) => s + (w.requestedAmount || 0), 0);
  const totalApproved = withdrawals.reduce((s, w) => s + (w.approvedAmount || 0), 0);
  const totalPaid = withdrawals.reduce((s, w) => s + (w.paidAmount || 0), 0);
  const totalRemaining = withdrawals.reduce((s, w) => s + (w.remainingAmount || 0), 0);

  const getStatusBadge = (status: WithdrawalStatus) => {
    switch (status) {
      case 'FULLY_PAID':
      case 'APPROVED':
        return <Badge variant="success">{status}</Badge>;
      case 'PARTIALLY_PAID':
        return <Badge variant="info">PARTIAL</Badge>;
      case 'REJECTED':
        return <Badge variant="error">REJECTED</Badge>;
      case 'REQUESTED':
      default:
        return <Badge variant="warning">REQUESTED</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onNavigate('/reports')}
        icon={<ArrowLeft className="w-4 h-4" />}
      >
        Back to Reports
      </Button>

      <PageHeader
        title="Withdrawals & Payouts Financial Report"
        description="Comprehensive audit of all member prize claims, approvals, disbursements, and liabilities"
      />

      {error && (
        <Alert variant="error" title="Could not load withdrawals report">
          {extractErrorMessage(error)}
          <div className="mt-2">
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        </Alert>
      )}

      {/* Date filter */}
      <Card className="p-4 bg-white">
        <div className="flex flex-col sm:flex-row items-end gap-3 text-xs">
          <div className="w-full sm:w-48">
            <Input
              label="From Date"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-48">
            <Input label="To Date" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button
              size="md"
              variant="outline"
              onClick={() => {
                setFrom('');
                setTo('');
              }}
            >
              Clear
            </Button>
            <Button size="md" variant="primary" onClick={() => refetch()}>
              Apply Filter
            </Button>
          </div>
        </div>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <span className="text-xs text-slate-500 uppercase font-semibold block">
            Total Requested
          </span>
          <p className="text-xl font-black text-slate-900 mt-1">{formatINR(totalRequested)}</p>
        </Card>
        <Card className="p-4">
          <span className="text-xs text-slate-500 uppercase font-semibold block">
            Total Approved
          </span>
          <p className="text-xl font-black text-slate-900 mt-1">{formatINR(totalApproved)}</p>
        </Card>
        <Card className="p-4 bg-emerald-50/40 border-emerald-200">
          <span className="text-xs text-emerald-800 uppercase font-semibold block">
            Total Disbursed
          </span>
          <p className="text-xl font-black text-emerald-950 mt-1">{formatINR(totalPaid)}</p>
        </Card>
        <Card className="p-4 bg-amber-50/40 border-amber-200">
          <span className="text-xs text-amber-800 uppercase font-semibold block">
            Remaining Due
          </span>
          <p className="text-xl font-black text-amber-950 mt-1">{formatINR(totalRemaining)}</p>
        </Card>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-md" />
          ))}
        </div>
      ) : withdrawals.length === 0 ? (
        <EmptyState
          title="No Withdrawals Found in Period"
          description="Adjust your date filters or check the active batch claims."
        />
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request Date</TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Batch / Plan</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead>Approved</TableHead>
                <TableHead>Paid Payouts</TableHead>
                <TableHead>Remaining</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {withdrawals.map((w: WithdrawalReportItem) => (
                <TableRow key={w.id}>
                  <TableCell className="text-xs text-slate-600">
                    {formatDate(w.requestDate)}
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-slate-900">
                    {w.memberName}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    {w.batchName} · {w.planName}
                  </TableCell>
                  <TableCell className="text-xs text-slate-700">
                    {formatINR(w.requestedAmount)}
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-slate-900">
                    {w.approvedAmount ? formatINR(w.approvedAmount) : '—'}
                  </TableCell>
                  <TableCell className="text-xs font-bold text-emerald-700">
                    {formatINR(w.paidAmount)}
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-amber-800">
                    {formatINR(w.remainingAmount)}
                  </TableCell>
                  <TableCell className="text-right">{getStatusBadge(w.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};
