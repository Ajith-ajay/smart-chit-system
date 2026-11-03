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
import { formatINR, formatDate, toInputDate } from '@/lib/utils';
import { extractErrorMessage } from '@/lib/api/client';
import { CollectionReportItem } from '@/types';
import { ArrowLeft, CreditCard, Filter, Download } from 'lucide-react';

export interface CollectionsReportPageProps {
  onNavigate: (path: string) => void;
}

export const CollectionsReportPage: React.FC<CollectionsReportPageProps> = ({ onNavigate }) => {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const {
    data: collections = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['report-collections', from, to],
    queryFn: () =>
      reportsApi.getCollectionsReport({
        from: from || undefined,
        to: to || undefined,
      }),
  });

  const totalCollected = collections.reduce((sum, item) => sum + (item.amount || 0), 0);

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
        title="Collections Financial Report"
        description="Filter and analyze all member payments, cash and bank deposits, and receipts"
      />

      {error && (
        <Alert variant="error" title="Could not load collections report">
          {extractErrorMessage(error)}
          <div className="mt-2">
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        </Alert>
      )}

      {/* Filter Bar */}
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
              Clear Filter
            </Button>
            <Button size="md" variant="primary" onClick={() => refetch()}>
              Apply Filter
            </Button>
          </div>
        </div>
      </Card>

      {/* Summary KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-emerald-50/40 border-emerald-200">
          <span className="text-xs text-emerald-800 font-semibold block uppercase">
            Total Collections in Period
          </span>
          <p className="text-2xl font-black text-emerald-950 mt-1">{formatINR(totalCollected)}</p>
        </Card>
        <Card className="p-4">
          <span className="text-xs text-slate-500 font-semibold block uppercase">
            Transaction Count
          </span>
          <p className="text-2xl font-black text-slate-900 mt-1">{collections.length}</p>
        </Card>
        <Card className="p-4">
          <span className="text-xs text-slate-500 font-semibold block uppercase">
            Average Collection
          </span>
          <p className="text-2xl font-black text-slate-900 mt-1">
            {collections.length > 0 ? formatINR(totalCollected / collections.length) : '₹0'}
          </p>
        </Card>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-md" />
          ))}
        </div>
      ) : collections.length === 0 ? (
        <EmptyState
          title="No Collections in Selected Period"
          description="Adjust your date filters or record new installment collections."
        />
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payment Date</TableHead>
                <TableHead>Receipt #</TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Batch / Plan</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount (₹)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {collections.map((item: CollectionReportItem) => (
                <TableRow key={item.id}>
                  <TableCell className="text-xs text-slate-600">
                    {formatDate(item.paymentDate)}
                  </TableCell>
                  <TableCell className="font-mono text-xs font-semibold text-slate-900">
                    {item.receiptNumber || `PAY-${item.id.slice(0, 8)}`}
                  </TableCell>
                  <TableCell className="text-xs font-medium text-slate-900">
                    {item.memberName}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    {item.batchName} · {item.planName}
                  </TableCell>
                  <TableCell className="text-xs font-medium text-slate-700">
                    {item.paymentMethod}
                  </TableCell>
                  <TableCell className="text-xs text-slate-500 font-mono">
                    {item.reference || '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.status === 'SUCCESS' ? 'success' : 'error'}>
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-xs font-bold text-slate-900">
                    {formatINR(item.amount)}
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
