import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { membersApi } from '@/lib/api/members';
import { documentsApi } from '@/lib/api/documents';
import { remindersApi } from '@/lib/api/reminders';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Tabs } from '@/components/ui/Tabs';
import { Skeleton } from '@/components/ui/Skeleton';
import { Alert } from '@/components/ui/Alert';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { ConfirmationModal } from '@/components/common/ConfirmationModal';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/Table';
import { formatDate, formatDateTime, formatINR } from '@/lib/utils';
import { extractErrorMessage } from '@/lib/api/client';
import { Member, UpdateMemberDto } from '@/types';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Shield,
  Landmark,
  FileText,
  UserCheck,
  Plus,
  Clock,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

export interface MemberDetailPageProps {
  memberId: string;
  onNavigate: (path: string) => void;
}

export const MemberDetailPage: React.FC<MemberDetailPageProps> = ({ memberId, onNavigate }) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<UpdateMemberDto>({});

  const {
    data: member,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['member', memberId],
    queryFn: () => membersApi.getById(memberId),
  });

  // Query KYC documents
  const { data: kycDocs = [] } = useQuery({
    queryKey: ['member-kyc-docs', memberId],
    queryFn: () => documentsApi.getByMemberKyc(memberId),
    enabled: activeTab === 'documents',
  });

  // Edit mutation
  const editMutation = useMutation({
    mutationFn: (dto: UpdateMemberDto) => membersApi.update(memberId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member', memberId] });
      queryClient.invalidateQueries({ queryKey: ['members'] });
      setIsEditOpen(false);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => membersApi.delete(memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      onNavigate('/members');
    },
  });

  const openEditModal = () => {
    if (!member) return;
    setEditFormData({
      firstName: member.firstName,
      lastName: member.lastName,
      phone: member.phone,
      email: member.email || '',
      address: member.address || '',
      city: member.city || '',
      state: member.state || '',
      pincode: member.pincode || '',
      nomineeName: member.nomineeName || '',
      nomineeRelation: member.nomineeRelation || '',
      nomineePhone: member.nomineePhone || '',
      bankName: member.bankName || '',
      accountNumber: member.accountNumber || '',
      ifscCode: member.ifscCode || '',
      branchName: member.branchName || '',
      kycType: member.kycType || 'AADHAAR',
      kycNumber: member.kycNumber || '',
      isActive: member.isActive,
    });
    setIsEditOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNavigate('/members')}
          icon={<ArrowLeft className="w-4 h-4" />}
        >
          Back to Members
        </Button>
        <Alert variant="error" title="Member Not Found">
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

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'enrollments', label: 'Enrollments' },
    { id: 'payments', label: 'Payments' },
    { id: 'withdrawals', label: 'Withdrawals' },
    { id: 'documents', label: 'Documents / KYC' },
    { id: 'reminders', label: 'Reminders' },
    { id: 'follow-ups', label: 'Follow-ups' },
    { id: 'history', label: 'History' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNavigate('/members')}
          icon={<ArrowLeft className="w-4 h-4" />}
        >
          Back to Members
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={openEditModal}
            icon={<Edit className="w-3.5 h-3.5" />}
          >
            Edit Profile
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setIsDeleteOpen(true)}
            icon={<Trash2 className="w-3.5 h-3.5" />}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Member Header Card */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-slate-900 text-white text-base font-bold">
              {member.firstName.charAt(0)}
              {member.lastName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">
                  {member.firstName} {member.lastName}
                </h1>
                <Badge variant={member.isActive ? 'success' : 'outline'}>
                  {member.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                {member.memberCode || `ID: ${member.id}`} · Registered:{' '}
                {formatDate(member.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded border border-slate-200">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>{member.phone}</span>
            </div>
            {member.email && (
              <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded border border-slate-200">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{member.email}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded border border-slate-200">
              <span className="font-semibold text-slate-700">KYC:</span>
              <Badge
                variant={
                  member.kycStatus === 'VERIFIED'
                    ? 'success'
                    : member.kycStatus === 'REJECTED'
                      ? 'error'
                      : 'warning'
                }
              >
                {member.kycStatus || 'PENDING'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <MapPin className="w-4 h-4 text-slate-600" />
              <h3 className="font-semibold text-sm">Address & Location</h3>
            </div>
            <div className="space-y-2 text-xs text-slate-600">
              <p>
                <strong className="text-slate-800">Street:</strong>{' '}
                {member.address || 'Not specified'}
              </p>
              <p>
                <strong className="text-slate-800">City:</strong> {member.city || '-'}
              </p>
              <p>
                <strong className="text-slate-800">State:</strong> {member.state || '-'}
              </p>
              <p>
                <strong className="text-slate-800">Pincode:</strong> {member.pincode || '-'}
              </p>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <Shield className="w-4 h-4 text-slate-600" />
              <h3 className="font-semibold text-sm">Nominee Details</h3>
            </div>
            <div className="space-y-2 text-xs text-slate-600">
              <p>
                <strong className="text-slate-800">Nominee Name:</strong>{' '}
                {member.nomineeName || 'Not specified'}
              </p>
              <p>
                <strong className="text-slate-800">Relationship:</strong>{' '}
                {member.nomineeRelation || '-'}
              </p>
              <p>
                <strong className="text-slate-800">Nominee Contact:</strong>{' '}
                {member.nomineePhone || '-'}
              </p>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <Landmark className="w-4 h-4 text-slate-600" />
              <h3 className="font-semibold text-sm">Banking Information</h3>
            </div>
            <div className="space-y-2 text-xs text-slate-600">
              <p>
                <strong className="text-slate-800">Bank Name:</strong>{' '}
                {member.bankName || 'Not specified'}
              </p>
              <p>
                <strong className="text-slate-800">Account Number:</strong>{' '}
                {member.accountNumber || '-'}
              </p>
              <p>
                <strong className="text-slate-800">IFSC Code:</strong> {member.ifscCode || '-'}
              </p>
              <p>
                <strong className="text-slate-800">Branch:</strong> {member.branchName || '-'}
              </p>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <UserCheck className="w-4 h-4 text-slate-600" />
              <h3 className="font-semibold text-sm">KYC Registration</h3>
            </div>
            <div className="space-y-2 text-xs text-slate-600">
              <p>
                <strong className="text-slate-800">KYC Type:</strong> {member.kycType || '-'}
              </p>
              <p>
                <strong className="text-slate-800">KYC Number:</strong>{' '}
                {member.kycNumber || 'Not provided'}
              </p>
              <p>
                <strong className="text-slate-800">Verification Status:</strong>{' '}
                <Badge
                  variant={
                    member.kycStatus === 'VERIFIED'
                      ? 'success'
                      : member.kycStatus === 'REJECTED'
                        ? 'error'
                        : 'warning'
                  }
                >
                  {member.kycStatus || 'PENDING'}
                </Badge>
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 2: Enrollments */}
      {activeTab === 'enrollments' && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-sm text-slate-900">Member Enrollments</h3>
              <p className="text-xs text-slate-500">
                Chit fund batches this member is participating in
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onNavigate(`/enrollments/catch-up`)}
              >
                Late / Catch-up Enrollment
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={() => onNavigate(`/enrollments/new`)}
                icon={<Plus className="w-4 h-4" />}
              >
                New Enrollment
              </Button>
            </div>
          </div>
          <div className="text-xs text-slate-500 p-6 text-center border border-dashed rounded-md bg-slate-50">
            View full active batch participation in the Enrollments module or click 'New Enrollment'
            above.
          </div>
        </Card>
      )}

      {/* Tab 3: Payments */}
      {activeTab === 'payments' && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-sm text-slate-900">Payment History</h3>
              <p className="text-xs text-slate-500">
                Payments collected from this member across enrollments
              </p>
            </div>
            <Button
              size="sm"
              variant="primary"
              onClick={() => onNavigate('/payments/new')}
              icon={<Plus className="w-4 h-4" />}
            >
              Collect Payment
            </Button>
          </div>
          <p className="text-xs text-slate-500 p-6 text-center border border-dashed rounded-md bg-slate-50">
            To view detailed receipts and installment allocations, navigate to the specific
            enrollment or the centralized Payments page.
          </p>
        </Card>
      )}

      {/* Tab 4: Withdrawals */}
      {activeTab === 'withdrawals' && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-sm text-slate-900">Withdrawals & Payouts</h3>
              <p className="text-xs text-slate-500">Prize money / chit withdrawal claims</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => onNavigate('/withdrawals')}>
              All Withdrawals
            </Button>
          </div>
          <p className="text-xs text-slate-500 p-6 text-center border border-dashed rounded-md bg-slate-50">
            Eligible enrollments can request withdrawals via the Enrollment details page.
          </p>
        </Card>
      )}

      {/* Tab 5: Documents / KYC */}
      {activeTab === 'documents' && (
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm text-slate-900">KYC Documents</h3>
              <p className="text-xs text-slate-500">
                Uploaded identification proofs & verification files
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => onNavigate('/documents')}>
              Manage in Documents Hub
            </Button>
          </div>

          {kycDocs.length === 0 ? (
            <p className="text-xs text-slate-400 p-6 text-center border border-dashed rounded-md">
              No verification files directly associated. Upload KYC documents in the Documents
              module or within an enrollment.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document Type</TableHead>
                  <TableHead>File Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kycDocs.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium text-xs">{doc.documentType}</TableCell>
                    <TableCell className="text-xs">{doc.fileName}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          doc.status === 'VERIFIED'
                            ? 'success'
                            : doc.status === 'REJECTED'
                              ? 'error'
                              : 'warning'
                        }
                      >
                        {doc.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{formatDate(doc.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => documentsApi.downloadFile(doc.id, doc.fileName)}
                      >
                        Download
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      )}

      {/* Tab 6: Reminders */}
      {activeTab === 'reminders' && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-sm text-slate-900">
                Reminders & WhatsApp Dispatch
              </h3>
              <p className="text-xs text-slate-500">
                Scheduled payment alerts sent to {member.phone}
              </p>
            </div>
            <Button size="sm" variant="primary" onClick={() => onNavigate('/reminders')}>
              Open Reminders Hub
            </Button>
          </div>
          <p className="text-xs text-slate-500 p-6 text-center border border-dashed rounded-md bg-slate-50">
            Reminders are scheduled against specific installment dues. Visit Reminders to schedule
            or dispatch.
          </p>
        </Card>
      )}

      {/* Tab 7: Follow-ups */}
      {activeTab === 'follow-ups' && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-sm text-slate-900">Follow-up Call & Visit Logs</h3>
              <p className="text-xs text-slate-500">
                Communication history for payment collections
              </p>
            </div>
            <Button size="sm" variant="primary" onClick={() => onNavigate('/follow-ups')}>
              Open Follow-ups Hub
            </Button>
          </div>
          <p className="text-xs text-slate-500 p-6 text-center border border-dashed rounded-md bg-slate-50">
            Log phone calls, in-person visits, and promises to pay in the Follow-ups module.
          </p>
        </Card>
      )}

      {/* Tab 8: History */}
      {activeTab === 'history' && (
        <Card className="p-5">
          <h3 className="font-semibold text-sm text-slate-900 mb-3">Audit Record</h3>
          <div className="space-y-2 text-xs text-slate-600 font-mono">
            <p>
              <strong>Member ID:</strong> {member.id}
            </p>
            <p>
              <strong>Database Created At:</strong> {formatDateTime(member.createdAt)}
            </p>
            <p>
              <strong>Database Updated At:</strong> {formatDateTime(member.updatedAt)}
            </p>
            <p>
              <strong>Account Active:</strong> {member.isActive ? 'true' : 'false'}
            </p>
          </div>
        </Card>
      )}

      {/* Edit Member Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Member Profile"
        maxWidth="lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            editMutation.mutate(editFormData);
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name"
              value={editFormData.firstName || ''}
              onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
              required
            />
            <Input
              label="Last Name"
              value={editFormData.lastName || ''}
              onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
              required
            />
            <Input
              label="Phone"
              value={editFormData.phone || ''}
              onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
              required
            />
            <Input
              label="Email"
              type="email"
              value={editFormData.email || ''}
              onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
            />
            <Input
              label="Address"
              className="col-span-2"
              value={editFormData.address || ''}
              onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
            />
            <Input
              label="City"
              value={editFormData.city || ''}
              onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
            />
            <Input
              label="State"
              value={editFormData.state || ''}
              onChange={(e) => setEditFormData({ ...editFormData, state: e.target.value })}
            />
            <Input
              label="Bank Name"
              value={editFormData.bankName || ''}
              onChange={(e) => setEditFormData({ ...editFormData, bankName: e.target.value })}
            />
            <Input
              label="Account Number"
              value={editFormData.accountNumber || ''}
              onChange={(e) => setEditFormData({ ...editFormData, accountNumber: e.target.value })}
            />
            <Input
              label="IFSC Code"
              value={editFormData.ifscCode || ''}
              onChange={(e) => setEditFormData({ ...editFormData, ifscCode: e.target.value })}
            />
            <Input
              label="Nominee Name"
              value={editFormData.nomineeName || ''}
              onChange={(e) => setEditFormData({ ...editFormData, nomineeName: e.target.value })}
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="edit-active"
              checked={editFormData.isActive ?? true}
              onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300"
            />
            <label htmlFor="edit-active" className="text-xs text-slate-700">
              Active Member Status
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={editMutation.isPending}
              loadingText="Saving changes..."
            >
              Update Member
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Member Confirmation */}
      <ConfirmationModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="Delete Member"
        description={`Are you sure you want to delete ${member.firstName} ${member.lastName}? This will perform a soft delete in the database.`}
        confirmText="Confirm Delete"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
