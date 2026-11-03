import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentsApi } from '@/lib/api/documents';
import { enrollmentsApi } from '@/lib/api/enrollments';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
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
import { ConfirmationModal } from '@/components/common/ConfirmationModal';
import { formatDate, formatDateTime } from '@/lib/utils';
import { extractErrorMessage } from '@/lib/api/client';
import { KycDocument, KycDocumentStatus, Enrollment } from '@/types';
import {
  FileText,
  Upload,
  Download,
  CheckCircle,
  XCircle,
  ShieldCheck,
  AlertTriangle,
  Search,
} from 'lucide-react';

export interface DocumentsListPageProps {
  onNavigate: (path: string) => void;
}

export const DocumentsListPage: React.FC<DocumentsListPageProps> = ({ onNavigate }) => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Upload modal state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [targetEnrollmentId, setTargetEnrollmentId] = useState('');
  const [docType, setDocType] = useState('AADHAAR');
  const [docNumber, setDocNumber] = useState('');
  const [docFile, setDocFile] = useState<File | null>(null);

  // Reject modal state
  const [rejectingDocId, setRejectingDocId] = useState<string | null>(null);

  // Fetch enrollments for dropdown
  const { data: enrollmentsData } = useQuery({
    queryKey: ['enrollments-dropdown'],
    queryFn: async () => {
      const res = await enrollmentsApi.getAll({ limit: 100 });
      return Array.isArray(res) ? res : res.data || [];
    },
  });
  const enrollments: Enrollment[] = enrollmentsData || [];

  // Query documents - if an enrollment is chosen or all
  const {
    data: documents = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['documents-list', targetEnrollmentId],
    queryFn: async () => {
      if (targetEnrollmentId) {
        return documentsApi.getByEnrollment(targetEnrollmentId);
      }
      if (enrollments.length > 0) {
        // Collect documents from first enrollment or all
        return documentsApi.getByEnrollment(enrollments[0].id);
      }
      return [];
    },
    enabled: enrollments.length > 0 || Boolean(targetEnrollmentId),
  });

  const uploadMutation = useMutation({
    mutationFn: () => {
      if (!docFile) throw new Error('Please select a file to upload');
      if (!targetEnrollmentId) throw new Error('Please select target enrollment');
      return documentsApi.upload(targetEnrollmentId, docFile, docType, docNumber);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents-list'] });
      setIsUploadOpen(false);
      setDocFile(null);
      setDocNumber('');
    },
  });

  const verifyMutation = useMutation({
    mutationFn: (id: string) => documentsApi.verify(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents-list'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      documentsApi.reject(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents-list'] });
      setRejectingDocId(null);
    },
  });

  const getStatusBadge = (status: KycDocumentStatus) => {
    switch (status) {
      case 'VERIFIED':
        return <Badge variant="success">VERIFIED</Badge>;
      case 'REJECTED':
        return <Badge variant="error">REJECTED</Badge>;
      case 'PENDING':
      default:
        return <Badge variant="warning">PENDING</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="KYC & Document Verification"
        description="Verify identity, residence proofs, bank passes, and legal agreements with 20MB local upload support"
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsUploadOpen(true)}
            icon={<Upload className="w-4 h-4" />}
          >
            Upload Document
          </Button>
        }
      />

      {error && (
        <Alert variant="error" title="Could not load documents">
          {extractErrorMessage(error)}
          <div className="mt-2">
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        </Alert>
      )}

      {/* Filter and selector */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-lg border border-slate-200">
        <div className="w-full sm:w-80">
          <select
            value={targetEnrollmentId}
            onChange={(e) => setTargetEnrollmentId(e.target.value)}
            className="w-full py-1.5 px-3 text-xs rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="">-- View by Enrollment --</option>
            {enrollments.map((enr) => (
              <option key={enr.id} value={enr.id}>
                {enr.enrollmentNumber || enr.id.slice(0, 8)}: {enr.member?.firstName}{' '}
                {enr.member?.lastName}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full sm:w-44">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full py-1.5 px-3 text-xs rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="all">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="VERIFIED">Verified</option>
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
      ) : documents.length === 0 ? (
        <EmptyState
          title="No Documents Found"
          description="Upload identity proof (Aadhaar, PAN, Passport, Bank Passbook) up to 20MB."
          actionLabel="Upload Document"
          onAction={() => setIsUploadOpen(true)}
        />
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Document #</TableHead>
                <TableHead>File Name</TableHead>
                <TableHead>Uploaded Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-semibold text-xs text-slate-900">
                    {doc.documentType}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-600">
                    {doc.documentNumber || '—'}
                  </TableCell>
                  <TableCell className="text-xs text-slate-700">
                    <span className="truncate max-w-[200px] block">{doc.fileName}</span>
                  </TableCell>
                  <TableCell className="text-xs text-slate-500">
                    {formatDate(doc.createdAt)}
                  </TableCell>
                  <TableCell>{getStatusBadge(doc.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => documentsApi.downloadFile(doc.id, doc.fileName)}
                        title="Download Document"
                      >
                        <Download className="w-3.5 h-3.5 mr-1" /> View/Download
                      </Button>
                      {doc.status === 'PENDING' && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50"
                            onClick={() => verifyMutation.mutate(doc.id)}
                            title="Verify Document"
                          >
                            <CheckCircle className="w-3.5 h-3.5 mr-1" /> Verify
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                            onClick={() => setRejectingDocId(doc.id)}
                            title="Reject Document"
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Compliance Note */}
      <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-slate-800">KYC Verification Rule</p>
          <p className="mt-0.5 text-slate-500">
            Once a KYC document is verified, it cannot simply be silently downgraded. Any status
            change requires explicit audit trail logging in the backend.
          </p>
        </div>
      </div>

      {/* Upload Modal (Multipart/form-data) */}
      <Modal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        title="Upload KYC / Supporting Document"
        maxWidth="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            uploadMutation.mutate();
          }}
          className="space-y-4"
        >
          <Select
            label="Target Member Enrollment"
            value={targetEnrollmentId}
            onChange={(e) => setTargetEnrollmentId(e.target.value)}
            required
          >
            <option value="">-- Select Enrollment --</option>
            {enrollments.map((enr) => (
              <option key={enr.id} value={enr.id}>
                {enr.enrollmentNumber || enr.id.slice(0, 8)} ({enr.member?.firstName}{' '}
                {enr.member?.lastName})
              </option>
            ))}
          </Select>

          <Select
            label="Document Category"
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            required
          >
            <option value="AADHAAR">Aadhaar Card</option>
            <option value="PAN">PAN Card</option>
            <option value="PASSPORT">Passport</option>
            <option value="VOTER_ID">Voter ID</option>
            <option value="DRIVING_LICENSE">Driving License</option>
            <option value="BANK_STATEMENT">Bank Passbook / Statement</option>
            <option value="CHIT_AGREEMENT">Chit Agreement Form</option>
            <option value="OTHER">Other Proof</option>
          </Select>

          <Input
            label="Document Identification Number"
            placeholder="e.g. 1234 5678 9012"
            value={docNumber}
            onChange={(e) => setDocNumber(e.target.value)}
          />

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">
              Select Document File (Max 20 MB) <span className="text-rose-500">*</span>
            </label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
              onChange={(e) => setDocFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
              required
            />
            <p className="text-[11px] text-slate-400">
              Files are sent as multipart/form-data to POST
              /api/v1/documents/enrollments/:id/upload.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsUploadOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!docFile || !targetEnrollmentId}
              isLoading={uploadMutation.isPending}
              loadingText="Uploading (Multipart)..."
            >
              Upload Document
            </Button>
          </div>
        </form>
      </Modal>

      {/* Reject Modal */}
      <ConfirmationModal
        isOpen={!!rejectingDocId}
        onClose={() => setRejectingDocId(null)}
        onConfirm={(reason) => {
          if (rejectingDocId) {
            rejectMutation.mutate({ id: rejectingDocId, reason });
          }
        }}
        title="Reject KYC Document"
        description="Are you sure you want to reject this document? Provide a reason for the record."
        confirmText="Confirm Rejection"
        variant="danger"
        requireReason
        reasonLabel="Rejection Reason"
        reasonPlaceholder="e.g. Document image is blurry / Name mismatch"
        isLoading={rejectMutation.isPending}
      />
    </div>
  );
};
