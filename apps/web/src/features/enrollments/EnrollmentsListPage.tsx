import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { enrollmentsApi } from '@/lib/api/enrollments';
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
import { formatINR } from '@/lib/utils';
import { extractErrorMessage } from '@/lib/api/client';
import { Enrollment } from '@/types';
import { Plus, Search, CreditCard, Clock } from 'lucide-react';

export interface EnrollmentsListPageProps {
  onNavigate: (path: string) => void;
}

export const EnrollmentsListPage: React.FC<EnrollmentsListPageProps> = ({ onNavigate }) => {
  const [selectedBatchId, setSelectedBatchId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data: batches = [] } = useQuery({
    queryKey: ['batches-dropdown'],
    queryFn: async () => {
      const res = await batchesApi.getAll({ limit: 100 });
      return Array.isArray(res) ? res : res.data || [];
    },
  });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['enrollments', page, selectedBatchId, statusFilter, search],
    queryFn: () =>
      enrollmentsApi.getAll({
        page,
        limit: 20,
        search: search.trim() || undefined,
        batchId: selectedBatchId === 'all' ? undefined : selectedBatchId,
        status: statusFilter === 'all' ? undefined : statusFilter,
      }),
  });

  const enrollmentsList: Enrollment[] = data?.data || [];
  const totalPages = data?.meta.totalPages ?? 1;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Member Enrollments"
        description="Active member seats in chit fund batches with real-time financial balances"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('/enrollments/catch-up')}
              icon={<Clock className="w-3.5 h-3.5" />}
            >
              Late / Catch-up Enrollment
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onNavigate('/enrollments/new')}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              New Enrollment
            </Button>
          </div>
        }
      />

      {error && (
        <Alert variant="error" title="Could not load enrollments">
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
        <div className="relative w-full sm:flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search enrollment, member name or phone"
            className="w-full py-1.5 pl-9 pr-3 text-xs rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
        </div>
        <div className="w-full sm:w-60">
          <select
            value={selectedBatchId}
            onChange={(e) => {
              setSelectedBatchId(e.target.value);
              setPage(1);
            }}
            className="w-full py-1.5 px-3 text-xs rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="all">All Batches</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.status})
              </option>
            ))}
          </select>
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
            <option value="all">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-md" />
          ))}
        </div>
      ) : enrollmentsList.length === 0 ? (
        <EmptyState
          title="No Enrollments Found"
          description="Enroll a registered member into a batch to establish their ledger and installment schedule."
          actionLabel="Enroll Member"
          onAction={() => onNavigate('/enrollments/new')}
        />
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Enrollment</TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Batch & Plan</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Outstanding</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrollmentsList.map((enr) => (
                <TableRow key={enr.id}>
                  <TableCell>
                    <div>
                      <button
                        onClick={() => onNavigate(`/enrollments/${enr.id}`)}
                        className="font-semibold text-slate-900 hover:underline text-left block text-sm"
                      >
                        {enr.enrollmentNumber || `ENR-${enr.id.slice(0, 8)}`}
                      </button>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Added {new Date(enr.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs">
                      <p className="font-semibold text-slate-800">
                        {enr.member
                          ? `${enr.member.firstName} ${enr.member.lastName}`
                          : 'Member ' + enr.memberId.slice(0, 8)}
                      </p>
                      <p className="text-slate-500">{enr.member?.phone}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs">
                      <p className="font-medium text-slate-900">
                        {enr.batch?.name || 'Batch ' + enr.batchId.slice(0, 6)}
                      </p>
                      <p className="text-slate-500">
                        {enr.batchPlan?.planTemplate?.name || 'Chit Plan'}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-medium text-slate-700">
                    {formatINR(enr.scheduledAmount)}
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-emerald-700">
                    {formatINR(enr.paidAmount)}
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-rose-700">
                    {formatINR(enr.outstandingAmount)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={enr.status === 'ACTIVE' ? 'success' : 'outline'}>
                      {enr.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onNavigate(`/payments/new?enrollmentId=${enr.id}`)}
                        title="Collect Payment"
                        className="text-emerald-700"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onNavigate(`/enrollments/${enr.id}`)}
                      >
                        View
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {!isLoading && enrollmentsList.length > 0 && (
        <div className="flex items-center justify-between text-xs text-slate-600">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((current) => current - 1)}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((current) => current + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
