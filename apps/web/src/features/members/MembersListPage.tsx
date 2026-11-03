import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { membersApi } from '@/lib/api/members';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
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
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmationModal } from '@/components/common/ConfirmationModal';
import { Alert } from '@/components/ui/Alert';
import { formatDate } from '@/lib/utils';
import { extractErrorMessage } from '@/lib/api/client';
import { Member } from '@/types';
import { Plus, Search, Trash2, Eye, Edit3, Phone, Mail, Building2 } from 'lucide-react';

export interface MembersListPageProps {
  onNavigate: (path: string) => void;
}

export const MembersListPage: React.FC<MembersListPageProps> = ({ onNavigate }) => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(1);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['members', page, searchTerm, statusFilter],
    queryFn: () =>
      membersApi.getAll({
        page,
        limit: 15,
        search: searchTerm.trim() || undefined,
        isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => membersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      setMemberToDelete(null);
    },
  });

  // Normalize data response
  const membersList: Member[] = Array.isArray(data) ? data : data?.data || [];
  const totalItems = Array.isArray(data) ? data.length : data?.total || membersList.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Members Management"
        description="Register and manage chit fund participants, nominees, bank accounts, and KYC"
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => onNavigate('/members/new')}
            icon={<Plus className="w-4 h-4" />}
          >
            Add Member
          </Button>
        }
      />

      {error && (
        <Alert variant="error" title="Could not load members">
          {extractErrorMessage(error)}
          <div className="mt-2">
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        </Alert>
      )}

      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-lg border border-slate-200">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, phone, email, or member code..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
          />
        </div>

        <div className="w-full sm:w-44">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as 'all' | 'active' | 'inactive');
              setPage(1);
            }}
            className="w-full py-1.5 px-3 text-xs rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-md" />
          ))}
        </div>
      ) : membersList.length === 0 ? (
        <EmptyState
          title="No Members Found"
          description={
            searchTerm
              ? `No members match search query "${searchTerm}".`
              : 'Start by registering your first chit fund member in SCMS.'
          }
          actionLabel="Create Member"
          onAction={() => onNavigate('/members/new')}
        />
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Bank / KYC</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {membersList.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div>
                      <button
                        onClick={() => onNavigate(`/members/${member.id}`)}
                        className="font-semibold text-slate-900 hover:underline text-left block text-sm"
                      >
                        {member.firstName} {member.lastName}
                      </button>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {member.memberCode || `ID: ${member.id.slice(0, 8)}`}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{member.phone}</span>
                      </div>
                      {member.email && (
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span className="truncate max-w-[160px]">{member.email}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5 text-xs text-slate-600">
                      <p className="truncate max-w-[140px]">
                        {member.bankName ? `${member.bankName}` : 'No Bank Added'}
                      </p>
                      <div className="flex items-center gap-1">
                        <Badge
                          variant={
                            member.kycStatus === 'VERIFIED'
                              ? 'success'
                              : member.kycStatus === 'REJECTED'
                                ? 'error'
                                : 'warning'
                          }
                        >
                          KYC: {member.kycStatus || 'PENDING'}
                        </Badge>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={member.isActive ? 'success' : 'outline'}>
                      {member.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-slate-500">
                    {formatDate(member.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onNavigate(`/members/${member.id}`)}
                        title="View Member Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setMemberToDelete(member)}
                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                        title="Delete Member"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Footer stats */}
          <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {membersList.length} of {totalItems} members
            </span>
          </div>
        </div>
      )}

      {/* Confirmation modal for delete */}
      <ConfirmationModal
        isOpen={!!memberToDelete}
        onClose={() => setMemberToDelete(null)}
        onConfirm={() => {
          if (memberToDelete) deleteMutation.mutate(memberToDelete.id);
        }}
        title="Delete Member"
        description={`Are you sure you want to delete member ${memberToDelete?.firstName} ${memberToDelete?.lastName}? This performs a soft delete in the NestJS database.`}
        confirmText="Delete"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
