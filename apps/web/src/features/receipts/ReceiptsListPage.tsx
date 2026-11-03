import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { receiptsApi } from '@/lib/api/receipts';
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
import { Receipt } from '@/types';
import { Receipt as ReceiptIcon, Eye, Search, Printer } from 'lucide-react';

export interface ReceiptsListPageProps {
  onNavigate: (path: string) => void;
}

export const ReceiptsListPage: React.FC<ReceiptsListPageProps> = ({ onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const {
    data: receipts = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['receipts', searchTerm],
    queryFn: () => receiptsApi.getAll({ search: searchTerm.trim() || undefined }),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment Receipts"
        description="Formal chit fund receipts with unique sequence numbering and printable vouchers"
      />

      {error && (
        <Alert variant="error" title="Could not load receipts">
          {extractErrorMessage(error)}
          <div className="mt-2">
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        </Alert>
      )}

      {/* Search */}
      <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-200">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by receipt number (e.g. RCT-00000001)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-md" />
          ))}
        </div>
      ) : receipts.length === 0 ? (
        <EmptyState
          title="No Receipts Found"
          description="Receipts are generated automatically upon successful installment payment collection."
        />
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Receipt Number</TableHead>
                <TableHead>Payment / Ref</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {receipts.map((r: Receipt) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono font-bold text-xs text-slate-900">
                    <button
                      onClick={() => onNavigate(`/receipts/${r.id}`)}
                      className="hover:underline flex items-center gap-1.5"
                    >
                      <ReceiptIcon className="w-3.5 h-3.5 text-slate-500" />
                      <span>{r.receiptNumber}</span>
                    </button>
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 font-mono">
                    PAY-{r.paymentId.slice(0, 8)}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    {formatDate(r.issuedAt || r.createdAt)}
                  </TableCell>
                  <TableCell className="text-xs font-bold text-slate-900">
                    {formatINR(r.amount)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        r.status === 'GENERATED'
                          ? 'success'
                          : r.status === 'CANCELLED'
                            ? 'error'
                            : 'warning'
                      }
                    >
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onNavigate(`/receipts/${r.id}`)}
                      icon={<Eye className="w-3.5 h-3.5" />}
                    >
                      View / Print
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
