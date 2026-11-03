import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { withdrawalsApi } from '@/lib/api/withdrawals';
import { reportsApi } from '@/lib/api/reports';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
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
import { Withdrawal, WithdrawalStatus } from '@/types';
import { HandCoins, Eye, Search, CheckCircle, Clock, XCircle } from 'lucide-react';

export interface WithdrawalsListPageProps {
  onNavigate: (path: string) => void;
}

export const WithdrawalsListPage: React.FC<WithdrawalsListPageProps> = ({ onNavigate }) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const {
    data: withdrawals = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['withdrawals-list', statusFilter],
    queryFn: async () => {
      const reports = await reportsApi.getWithdrawalsReport();
      return reports;
    },
  });

  const getStatusBadge = (status: WithdrawalStatus) => {
    switch (status) {
      case 'FULLY_PAID':
      case 'APPROVED':
        return <Badge variant="success">{status}</Badge>;
      case 'PARTIALLY_PAID':
        return <Badge variant="info">PARTIALLY PAID</Badge>;
      case 'REJECTED':
        return <Badge variant="error">REJECTED</Badge>;
      case 'REQUESTED':
      default:
        return <Badge variant="warning">REQUESTED</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chit Fund Withdrawals & Payouts"
        description="Prize claims, approvals, multi-part split payouts, and payout reversals"
      />

      {error && (
        <Alert variant="error" title="Could not load withdrawals">
          {extractErrorMessage(error)}
          <div className="mt-2">
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        </Alert>
      )}

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-lg border border-slate-200">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by member or batch..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
        </div>

        <div className="w-full sm:w-44">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full py-1.5 px-3 text-xs rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="all">All Statuses</option>
            <option value="REQUESTED">Requested</option>
            <option value="APPROVED">Approved</option>
            <option value="PARTIALLY_PAID">Partially Paid</option>
            <option value="FULLY_PAID">Fully Paid</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-md" />
          ))}
        </div>
      ) : withdrawals.length === 0 ? (
        <EmptyState
          title="No Withdrawal Claims Found"
          description="Eligible members can submit withdrawal requests from their enrollment details page."
        />
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Claim ID</TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Batch / Plan</TableHead>
                <TableHead>Request Date</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead>Approved</TableHead>
                <TableHead>Paid Payouts</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {withdrawals.map((w) => (
                <TableRow key={w.id}>
                  <TableCell className="font-mono text-xs font-semibold text-slate-900">
                    <button
                      onClick={() => onNavigate(`/withdrawals/${w.id}`)}
                      className="hover:underline"
                    >
                      WTH-{w.id.slice(0, 8)}
                    </button>
                  </TableCell>
                  <TableCell className="text-xs font-medium text-slate-900">
                    {w.memberName}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    <p className="font-medium text-slate-900">{w.batchName}</p>
                    <p className="text-slate-500">{w.planName}</p>
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    {formatDate(w.requestDate)}
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
                  <TableCell>{getStatusBadge(w.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onNavigate(`/withdrawals/${w.id}`)}
                      icon={<Eye className="w-3.5 h-3.5" />}
                    >
                      Manage
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};
