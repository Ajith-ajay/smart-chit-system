import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { paymentsApi } from '@/lib/api/payments';
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
import { Payment } from '@/types';
import { Plus, CreditCard, Eye, RotateCcw, Search, Receipt as ReceiptIcon } from 'lucide-react';

export interface PaymentsListPageProps {
  onNavigate: (path: string) => void;
}

export const PaymentsListPage: React.FC<PaymentsListPageProps> = ({ onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Let's query recent collections from reports or payments
  // In SCMS payments are queried by enrollment or reports collections
  const {
    data: payments = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['payments-list', statusFilter],
    queryFn: async () => {
      // Use collection report or get payments
      const { reportsApi } = await import('@/lib/api/reports');
      const collections = await reportsApi.getCollectionsReport();
      return collections;
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment Collections"
        description="Chit installment collections, daily deposits, partial payments, and advance allocations"
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => onNavigate('/payments/new')}
            icon={<Plus className="w-4 h-4" />}
          >
            Collect Payment
          </Button>
        }
      />

      {error && (
        <Alert variant="error" title="Could not load payments">
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
            placeholder="Search payments by member, receipt, or reference..."
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
            <option value="SUCCESS">Success</option>
            <option value="REVERSED">Reversed</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-md" />
          ))}
        </div>
      ) : payments.length === 0 ? (
        <EmptyState
          title="No Payment Collections Recorded"
          description="Collect member installment dues, partial installments, or advance payments."
          actionLabel="Collect Payment"
          onAction={() => onNavigate('/payments/new')}
        />
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Receipt / Ref</TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Batch / Plan</TableHead>
                <TableHead>Payment Date</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div>
                      <button
                        onClick={() => onNavigate(`/payments/${p.id}`)}
                        className="font-semibold text-xs text-slate-900 hover:underline block text-left"
                      >
                        {p.receiptNumber || `PAY-${p.id.slice(0, 8)}`}
                      </button>
                      {p.reference && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          Ref: {p.reference}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">
                    <p className="font-semibold text-slate-900">{p.memberName}</p>
                    <p className="text-slate-500">{p.memberPhone}</p>
                  </TableCell>
                  <TableCell className="text-xs">
                    <p className="font-medium text-slate-900">{p.batchName}</p>
                    <p className="text-slate-500">{p.planName}</p>
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    {formatDate(p.paymentDate)}
                  </TableCell>
                  <TableCell className="text-xs text-slate-700 font-medium">
                    {p.paymentMethod}
                  </TableCell>
                  <TableCell className="text-xs font-bold text-slate-900">
                    {formatINR(p.amount)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.status === 'SUCCESS' ? 'success' : 'error'}>{p.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onNavigate(`/payments/${p.id}`)}
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" /> View
                      </Button>
                    </div>
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
