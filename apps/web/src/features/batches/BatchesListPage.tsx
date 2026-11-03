import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { batchesApi } from '@/lib/api/batches';
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
import { formatDate, formatINR } from '@/lib/utils';
import { extractErrorMessage } from '@/lib/api/client';
import { Batch, BatchStatus } from '@/types';
import { Plus, Search, Calendar, Eye, PlayCircle, CheckCircle, XCircle } from 'lucide-react';

export interface BatchesListPageProps {
  onNavigate: (path: string) => void;
}

export const BatchesListPage: React.FC<BatchesListPageProps> = ({ onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['batches', page, searchTerm, statusFilter],
    queryFn: () =>
      batchesApi.getAll({
        page,
        limit: 15,
        search: searchTerm.trim() || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
      }),
  });

  const batchesList: Batch[] = Array.isArray(data) ? data : data?.data || [];

  const getStatusBadge = (status: BatchStatus) => {
    switch (status) {
      case 'RUNNING':
        return <Badge variant="info">RUNNING</Badge>;
      case 'COMPLETED':
        return <Badge variant="success">COMPLETED</Badge>;
      case 'CANCELLED':
        return <Badge variant="error">CANCELLED</Badge>;
      case 'PLANNED':
      default:
        return <Badge variant="outline">PLANNED</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chit Batches"
        description="Batches execute multi-plan 20-month financial cycles with monthly installment processing"
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => onNavigate('/batches/new')}
            icon={<Plus className="w-4 h-4" />}
          >
            Create Batch
          </Button>
        }
      />

      {error && (
        <Alert variant="error" title="Could not load batches">
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
            placeholder="Search batches by name..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
        </div>

        <div className="w-full sm:w-44">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full py-1.5 px-3 text-xs rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="all">All Batches</option>
            <option value="PLANNED">Planned</option>
            <option value="RUNNING">Running</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-md" />
          ))}
        </div>
      ) : batchesList.length === 0 ? (
        <EmptyState
          title="No Batches Found"
          description={
            searchTerm
              ? `No batch matches "${searchTerm}".`
              : 'Create a chit batch to start enrolling members into monthly plans.'
          }
          actionLabel="Create Batch"
          onAction={() => onNavigate('/batches/new')}
        />
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch Name</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Plans / Seats</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batchesList.map((batch) => (
                <TableRow key={batch.id}>
                  <TableCell>
                    <div>
                      <button
                        onClick={() => onNavigate(`/batches/${batch.id}`)}
                        className="font-semibold text-slate-900 hover:underline text-left block text-sm"
                      >
                        {batch.name}
                      </button>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {batch.code || `ID: ${batch.id.slice(0, 8)}`}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    {formatDate(batch.startDate)}
                  </TableCell>
                  <TableCell>
                    <div className="text-xs text-slate-700">
                      <span className="font-semibold">
                        Installment {batch.currentInstallment || 0}
                      </span>{' '}
                      / {batch.totalInstallments || 20}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs text-slate-600">
                      <span>{batch.batchPlans?.length || 0} Plans</span>
                      {batch.enrollmentsCount !== undefined && (
                        <span className="text-slate-400"> · {batch.enrollmentsCount} Enrolled</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(batch.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onNavigate(`/batches/${batch.id}`)}
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
