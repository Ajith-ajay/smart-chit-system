import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { enrollmentsApi } from '@/lib/api/enrollments';
import { paymentsApi } from '@/lib/api/payments';
import { withdrawalsApi } from '@/lib/api/withdrawals';
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
import { Select } from '@/components/ui/Select';
import { ConfirmationModal } from '@/components/common/ConfirmationModal';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/Table';
import { formatINR, formatDate, formatDateTime, toInputDate } from '@/lib/utils';
import { extractErrorMessage } from '@/lib/api/client';
import {
  Enrollment,
  Payment,
  Withdrawal,
  KycDocument,
  PaymentMethod,
  CreateWithdrawalDto,
  CreateReminderDto,
  CreateFollowUpDto,
} from '@/types';
import {
  ArrowLeft,
  CreditCard,
  HandCoins,
  FileText,
  Bell,
  PhoneCall,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Plus,
  Upload,
} from 'lucide-react';

export interface EnrollmentDetailPageProps {
  enrollmentId: string;
  onNavigate: (path: string) => void;
}

export const EnrollmentDetailPage: React.FC<EnrollmentDetailPageProps> = ({
  enrollmentId,
  onNavigate,
}) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('ledger');

  // Modals state
  const [paymentToReverse, setPaymentToReverse] = useState<Payment | null>(null);
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalNotes, setWithdrawalNotes] = useState('');

  const [isUploadDocOpen, setIsUploadDocOpen] = useState(false);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docType, setDocType] = useState('AADHAAR');
  const [docNumber, setDocNumber] = useState('');

  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [reminderMessage, setReminderMessage] = useState('');
  const [reminderDate, setReminderDate] = useState(toInputDate(new Date()));

  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [followUpChannel, setFollowUpChannel] = useState<'CALL' | 'WHATSAPP' | 'SMS' | 'IN_PERSON'>(
    'CALL',
  );
  const [followUpStatus, setFollowUpStatus] = useState<
    'CONTACTED' | 'NO_ANSWER' | 'BUSY' | 'PROMISED_TO_PAY' | 'WRONG_NUMBER' | 'COMPLETED'
  >('CONTACTED');
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');

  // 1. Fetch enrollment
  const {
    data: enrollment,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['enrollment', enrollmentId],
    queryFn: () => enrollmentsApi.getById(enrollmentId),
  });

  // 2. Fetch payment summary
  const { data: paymentSummary } = useQuery({
    queryKey: ['enrollment-summary', enrollmentId],
    queryFn: () => paymentsApi.getEnrollmentSummary(enrollmentId),
  });

  // 3. Fetch payment list
  const { data: payments = [] } = useQuery({
    queryKey: ['enrollment-payments', enrollmentId],
    queryFn: () => paymentsApi.getByEnrollment(enrollmentId),
  });

  // 4. Fetch withdrawal eligibility
  const { data: eligibility } = useQuery({
    queryKey: ['withdrawal-eligibility', enrollmentId],
    queryFn: () => withdrawalsApi.getEligibility(enrollmentId),
  });

  // 5. Fetch withdrawals list
  const { data: withdrawals = [] } = useQuery({
    queryKey: ['enrollment-withdrawals', enrollmentId],
    queryFn: () => withdrawalsApi.getByEnrollment(enrollmentId),
  });

  // 6. Fetch documents
  const { data: documents = [] } = useQuery({
    queryKey: ['enrollment-docs', enrollmentId],
    queryFn: () => documentsApi.getByEnrollment(enrollmentId),
  });

  // Mutations
  const reversePaymentMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      paymentsApi.reverse(id, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollment', enrollmentId] });
      queryClient.invalidateQueries({ queryKey: ['enrollment-summary', enrollmentId] });
      queryClient.invalidateQueries({ queryKey: ['enrollment-payments', enrollmentId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      setPaymentToReverse(null);
    },
  });

  const requestWithdrawalMutation = useMutation({
    mutationFn: (dto: CreateWithdrawalDto) => withdrawalsApi.create(enrollmentId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollment-withdrawals', enrollmentId] });
      queryClient.invalidateQueries({ queryKey: ['withdrawal-eligibility', enrollmentId] });
      setIsWithdrawalModalOpen(false);
      setWithdrawalAmount('');
      setWithdrawalNotes('');
    },
  });

  const uploadDocMutation = useMutation({
    mutationFn: () => {
      if (!docFile) throw new Error('File is required');
      return documentsApi.upload(enrollmentId, docFile, docType, docNumber);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollment-docs', enrollmentId] });
      setIsUploadDocOpen(false);
      setDocFile(null);
      setDocNumber('');
    },
  });

  const verifyDocMutation = useMutation({
    mutationFn: (id: string) => documentsApi.verify(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollment-docs', enrollmentId] });
    },
  });

  const rejectDocMutation = useMutation({
    mutationFn: (id: string) => documentsApi.reject(id, 'Rejected by Administrator'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollment-docs', enrollmentId] });
    },
  });

  const reminderMutation = useMutation({
    mutationFn: (dto: CreateReminderDto) => remindersApi.create(enrollmentId, dto),
    onSuccess: () => {
      setIsReminderModalOpen(false);
      setReminderMessage('');
    },
  });

  const followUpMutation = useMutation({
    mutationFn: (dto: CreateFollowUpDto) => remindersApi.createFollowUp(enrollmentId, dto),
    onSuccess: () => {
      setIsFollowUpModalOpen(false);
      setFollowUpNotes('');
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-44 w-full" />
      </div>
    );
  }

  if (error || !enrollment) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNavigate('/enrollments')}
          icon={<ArrowLeft className="w-4 h-4" />}
        >
          Back to Enrollments
        </Button>
        <Alert variant="error" title="Enrollment Not Found">
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

  // Financial integrity verification check
  const calculatedBalanceDiff =
    (enrollment.scheduledAmount || 0) -
    ((enrollment.paidAmount || 0) + (enrollment.outstandingAmount || 0));
  const isBalanceConsistent = Math.abs(calculatedBalanceDiff) < 0.05;

  const tabs = [
    { id: 'ledger', label: 'Installment Ledger' },
    { id: 'payments', label: 'Payments', count: payments.length },
    { id: 'withdrawals', label: 'Withdrawals & Payouts', count: withdrawals.length },
    { id: 'documents', label: 'KYC Documents', count: documents.length },
    { id: 'communication', label: 'Reminders & Follow-ups' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNavigate('/enrollments')}
          icon={<ArrowLeft className="w-4 h-4" />}
        >
          Back to Enrollments
        </Button>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsUploadDocOpen(true)}
            icon={<Upload className="w-3.5 h-3.5" />}
          >
            Upload KYC
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={() => onNavigate(`/payments/new?enrollmentId=${enrollment.id}`)}
            icon={<CreditCard className="w-3.5 h-3.5" />}
          >
            Collect Payment
          </Button>
        </div>
      </div>

      {/* Financial Integrity KPI Header */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">
                Enrollment {enrollment.enrollmentNumber || `#${enrollment.id.slice(0, 8)}`}
              </h1>
              <Badge variant={enrollment.status === 'ACTIVE' ? 'success' : 'outline'}>
                {enrollment.status}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Member:{' '}
              <button
                onClick={() => onNavigate(`/members/${enrollment.memberId}`)}
                className="font-semibold text-slate-900 hover:underline"
              >
                {enrollment.member
                  ? `${enrollment.member.firstName} ${enrollment.member.lastName}`
                  : enrollment.memberId}
              </button>{' '}
              · Batch: {enrollment.batch?.name || enrollment.batchId}
            </p>
          </div>

          {/* 3 Pillar Financial Ledger Cards */}
          <div className="grid grid-cols-3 gap-3 text-center sm:min-w-[420px]">
            <div className="bg-slate-50 p-3 rounded-md border border-slate-200">
              <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                Total Scheduled
              </span>
              <span className="text-lg font-black text-slate-900">
                {formatINR(enrollment.scheduledAmount)}
              </span>
            </div>

            <div className="bg-emerald-50/60 p-3 rounded-md border border-emerald-200">
              <span className="text-[10px] uppercase font-semibold text-emerald-800 block">
                Total Paid
              </span>
              <span className="text-lg font-black text-emerald-900">
                {formatINR(enrollment.paidAmount)}
              </span>
            </div>

            <div className="bg-rose-50/60 p-3 rounded-md border border-rose-200">
              <span className="text-[10px] uppercase font-semibold text-rose-800 block">
                Outstanding Due
              </span>
              <span className="text-lg font-black text-rose-900">
                {formatINR(enrollment.outstandingAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Financial Integrity Equation Verification */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            {isBalanceConsistent ? (
              <span className="text-emerald-700 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-4 h-4" /> Financial Integrity Verified (Scheduled = Paid
                + Outstanding)
              </span>
            ) : (
              <span className="text-amber-700 flex items-center gap-1 font-medium">
                <AlertTriangle className="w-4 h-4" /> Balance Discrepancy Detected (Difference:{' '}
                {formatINR(calculatedBalanceDiff)})
              </span>
            )}
          </div>
          {enrollment.advanceAmount && enrollment.advanceAmount > 0 ? (
            <span className="text-xs text-sky-700 font-semibold">
              Advance Credit: {formatINR(enrollment.advanceAmount)}
            </span>
          ) : null}
        </div>
      </Card>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* TAB 1: Ledger & Installments */}
      {activeTab === 'ledger' && (
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-semibold text-sm text-slate-900">Installment Schedule Ledger</h3>
              <p className="text-xs text-slate-500">
                Installment completion tracking derived from backend allocation records
              </p>
            </div>
            <Button
              size="sm"
              variant="primary"
              onClick={() => onNavigate(`/payments/new?enrollmentId=${enrollment.id}`)}
              icon={<CreditCard className="w-3.5 h-3.5" />}
            >
              Collect Next Installment
            </Button>
          </div>

          {paymentSummary?.installments && paymentSummary.installments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Installment</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Scheduled Amount</TableHead>
                  <TableHead>Paid Amount</TableHead>
                  <TableHead>Outstanding</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentSummary.installments.map((inst) => (
                  <TableRow key={inst.installmentNumber}>
                    <TableCell className="font-mono text-xs font-semibold text-slate-900">
                      Installment #{inst.installmentNumber}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      {formatDate(inst.dueDate)}
                    </TableCell>
                    <TableCell className="text-xs font-medium text-slate-800">
                      {formatINR(inst.scheduledAmount)}
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-emerald-700">
                      {formatINR(inst.paidAmount)}
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-rose-700">
                      {formatINR(inst.outstandingAmount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={
                          inst.status === 'PAID'
                            ? 'success'
                            : inst.status === 'PARTIAL'
                              ? 'warning'
                              : inst.status === 'OVERDUE'
                                ? 'error'
                                : 'outline'
                        }
                      >
                        {inst.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-xs text-slate-400 py-8 text-center border border-dashed rounded-md">
              No installment ledger records returned from summary API. Collect a payment to populate
              installment history.
            </p>
          )}
        </Card>
      )}

      {/* TAB 2: Payments */}
      {activeTab === 'payments' && (
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm text-slate-900">
                Payment Collection Transactions
              </h3>
              <p className="text-xs text-slate-500">Every payment made under this enrollment</p>
            </div>
            <Button
              size="sm"
              variant="primary"
              onClick={() => onNavigate(`/payments/new?enrollmentId=${enrollment.id}`)}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              New Payment
            </Button>
          </div>

          {payments.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center border border-dashed rounded-md">
              No payment transactions recorded for this enrollment yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt / ID</TableHead>
                  <TableHead>Payment Date</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Allocation Mode</TableHead>
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
                          {p.receipt?.receiptNumber || `PAY-${p.id.slice(0, 8)}`}
                        </button>
                        {p.reference && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            Ref: {p.reference}
                          </span>
                        )}
                      </div>
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
                    <TableCell className="text-xs text-slate-600">{p.allocationMode}</TableCell>
                    <TableCell>
                      <Badge variant={p.status === 'SUCCESS' ? 'success' : 'error'}>
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onNavigate(`/payments/${p.id}`)}
                        >
                          Details
                        </Button>
                        {p.status === 'SUCCESS' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setPaymentToReverse(p)}
                            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                            title="Reverse Payment"
                          >
                            <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reverse
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      )}

      {/* TAB 3: Withdrawals & Payouts */}
      {activeTab === 'withdrawals' && (
        <div className="space-y-6">
          {/* Eligibility Banner */}
          <Card className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm text-slate-900">
                    Withdrawal Eligibility Status
                  </h3>
                  <Badge variant={eligibility?.isEligible ? 'success' : 'warning'}>
                    {eligibility?.isEligible ? 'ELIGIBLE' : 'NOT ELIGIBLE / RESTRICTED'}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {eligibility?.reason ||
                    (eligibility?.isEligible
                      ? `Member is eligible to claim prize up to ${formatINR(eligibility.maxEligibleAmount)}`
                      : 'Enrollment has not completed qualifying installments or has outstanding dues.')}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {eligibility?.maxEligibleAmount !== undefined && (
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block uppercase">Max Eligible</span>
                    <span className="text-base font-bold text-slate-900">
                      {formatINR(eligibility.maxEligibleAmount)}
                    </span>
                  </div>
                )}
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setIsWithdrawalModalOpen(true)}
                  icon={<HandCoins className="w-3.5 h-3.5" />}
                >
                  Request Withdrawal
                </Button>
              </div>
            </div>
          </Card>

          {/* Withdrawals List */}
          <Card className="p-5 space-y-4">
            <h3 className="font-semibold text-sm text-slate-900">
              Withdrawal Claims for this Seat
            </h3>
            {withdrawals.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center border border-dashed rounded-md">
                No withdrawal claims recorded for this enrollment.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Claim ID</TableHead>
                    <TableHead>Requested Date</TableHead>
                    <TableHead>Requested Amount</TableHead>
                    <TableHead>Approved Amount</TableHead>
                    <TableHead>Paid Payouts</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {withdrawals.map((w) => (
                    <TableRow key={w.id}>
                      <TableCell className="font-mono text-xs font-semibold text-slate-900">
                        WTH-{w.id.slice(0, 8)}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {formatDate(w.requestDate)}
                      </TableCell>
                      <TableCell className="text-xs font-medium text-slate-900">
                        {formatINR(w.requestedAmount)}
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-slate-900">
                        {w.approvedAmount ? formatINR(w.approvedAmount) : '—'}
                      </TableCell>
                      <TableCell className="text-xs font-bold text-emerald-700">
                        {formatINR(w.totalPaidAmount || 0)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            w.status === 'FULLY_PAID' || w.status === 'APPROVED'
                              ? 'success'
                              : w.status === 'REJECTED'
                                ? 'error'
                                : 'warning'
                          }
                        >
                          {w.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onNavigate(`/withdrawals/${w.id}`)}
                        >
                          Manage & Payouts
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </div>
      )}

      {/* TAB 4: Documents / KYC */}
      {activeTab === 'documents' && (
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm text-slate-900">
                Enrollment KYC & Supporting Documents
              </h3>
              <p className="text-xs text-slate-500">
                Verified identification proofs and security documents for this chit seat
              </p>
            </div>
            <Button
              size="sm"
              variant="primary"
              onClick={() => setIsUploadDocOpen(true)}
              icon={<Upload className="w-3.5 h-3.5" />}
            >
              Upload Document
            </Button>
          </div>

          {documents.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center border border-dashed rounded-md">
              No documents uploaded yet. Upload KYC documents (up to 20MB) to satisfy withdrawal
              requirements.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Document #</TableHead>
                  <TableHead>File Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium text-xs">{doc.documentType}</TableCell>
                    <TableCell className="text-xs text-slate-600 font-mono">
                      {doc.documentNumber || '—'}
                    </TableCell>
                    <TableCell className="text-xs text-slate-700">{doc.fileName}</TableCell>
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
                    <TableCell className="text-xs text-slate-500">
                      {formatDate(doc.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => documentsApi.downloadFile(doc.id, doc.fileName)}
                        >
                          View/Download
                        </Button>
                        {doc.status === 'PENDING' && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-emerald-700"
                              onClick={() => verifyDocMutation.mutate(doc.id)}
                            >
                              Verify
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-rose-700"
                              onClick={() => rejectDocMutation.mutate(doc.id)}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      )}

      {/* TAB 5: Reminders & Follow-ups */}
      {activeTab === 'communication' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm text-slate-900">Installment Reminders</h3>
                <p className="text-xs text-slate-500">WhatsApp & SMS payment notifications</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsReminderModalOpen(true)}
                icon={<Bell className="w-3.5 h-3.5" />}
              >
                Schedule Reminder
              </Button>
            </div>
            <p className="text-xs text-slate-500 p-4 border rounded bg-slate-50 text-center">
              Reminders are queued for WhatsApp dispatch based on upcoming installment due dates.
            </p>
          </Card>

          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm text-slate-900">Follow-up Log</h3>
                <p className="text-xs text-slate-500">Call notes and collection promises</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsFollowUpModalOpen(true)}
                icon={<PhoneCall className="w-3.5 h-3.5" />}
              >
                Log Follow-up
              </Button>
            </div>
            <p className="text-xs text-slate-500 p-4 border rounded bg-slate-50 text-center">
              Log phone conversations and promised payment commitments.
            </p>
          </Card>
        </div>
      )}

      {/* Modal: Reverse Payment */}
      <ConfirmationModal
        isOpen={!!paymentToReverse}
        onClose={() => setPaymentToReverse(null)}
        onConfirm={(reason) => {
          if (paymentToReverse) {
            reversePaymentMutation.mutate({ id: paymentToReverse.id, reason });
          }
        }}
        title="Reverse Payment Transaction"
        description="Payment reversal restores outstanding balance and un-allocates installments. This preserves historical audit records and does not delete the record."
        confirmText="Confirm Reversal"
        variant="danger"
        requireReason
        reasonLabel="Reversal Reason"
        reasonPlaceholder="e.g. Cheque bounced / Entry error"
        isLoading={reversePaymentMutation.isPending}
      />

      {/* Modal: Request Withdrawal */}
      <Modal
        isOpen={isWithdrawalModalOpen}
        onClose={() => setIsWithdrawalModalOpen(false)}
        title="Request Chit Withdrawal"
        maxWidth="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            requestWithdrawalMutation.mutate({
              requestedAmount: parseFloat(withdrawalAmount),
              notes: withdrawalNotes.trim() || undefined,
            });
          }}
          className="space-y-4"
        >
          <Input
            label="Requested Withdrawal Amount (₹)"
            type="number"
            step="0.01"
            placeholder="e.g. 50000"
            value={withdrawalAmount}
            onChange={(e) => setWithdrawalAmount(e.target.value)}
            required
            autoFocus
          />

          <Input
            label="Notes / Reason"
            placeholder="e.g. Monthly bid winner / emergency withdrawal"
            value={withdrawalNotes}
            onChange={(e) => setWithdrawalNotes(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsWithdrawalModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={requestWithdrawalMutation.isPending}
              loadingText="Submitting Request..."
            >
              Submit Withdrawal Request
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Upload Document Multipart */}
      <Modal
        isOpen={isUploadDocOpen}
        onClose={() => setIsUploadDocOpen(false)}
        title="Upload KYC Document (Multipart)"
        maxWidth="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            uploadDocMutation.mutate();
          }}
          className="space-y-4"
        >
          <Select
            label="Document Type"
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            required
          >
            <option value="AADHAAR">Aadhaar Card</option>
            <option value="PAN">PAN Card</option>
            <option value="PASSPORT">Passport</option>
            <option value="BANK_STATEMENT">Bank Statement</option>
            <option value="CHIT_AGREEMENT">Chit Agreement</option>
            <option value="OTHER">Other Document</option>
          </Select>

          <Input
            label="Document / ID Number"
            placeholder="e.g. ABCD1234E"
            value={docNumber}
            onChange={(e) => setDocNumber(e.target.value)}
          />

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">
              Select File (Max 20 MB) <span className="text-rose-500">*</span>
            </label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
              onChange={(e) => setDocFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
              required
            />
            <p className="text-[11px] text-slate-400">
              Supported formats: PDF, JPG, PNG, WEBP, DOC, DOCX.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsUploadDocOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!docFile}
              isLoading={uploadDocMutation.isPending}
              loadingText="Uploading to Server..."
            >
              Upload Document
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Schedule Reminder */}
      <Modal
        isOpen={isReminderModalOpen}
        onClose={() => setIsReminderModalOpen(false)}
        title="Schedule Payment Reminder"
        maxWidth="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            reminderMutation.mutate({
              message: reminderMessage.trim(),
              scheduledDate: reminderDate,
              channel: 'WHATSAPP',
            });
          }}
          className="space-y-4"
        >
          <Input
            label="Scheduled Date"
            type="date"
            value={reminderDate}
            onChange={(e) => setReminderDate(e.target.value)}
            required
          />

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">
              Reminder Message (WhatsApp) <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              className="w-full rounded-md border border-slate-300 p-2 text-xs"
              placeholder="Dear Member, your chit installment is due. Kindly settle soon."
              value={reminderMessage}
              onChange={(e) => setReminderMessage(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsReminderModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={reminderMutation.isPending}
              loadingText="Scheduling..."
            >
              Schedule Reminder
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Log Follow-up */}
      <Modal
        isOpen={isFollowUpModalOpen}
        onClose={() => setIsFollowUpModalOpen(false)}
        title="Log Communication Follow-up"
        maxWidth="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            followUpMutation.mutate({
              channel: followUpChannel,
              status: followUpStatus,
              notes: followUpNotes.trim() || undefined,
              nextFollowUpDate: nextFollowUpDate || undefined,
            });
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Channel"
              value={followUpChannel}
              onChange={(e) => setFollowUpChannel(e.target.value as any)}
            >
              <option value="CALL">Phone Call</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="SMS">SMS</option>
              <option value="IN_PERSON">In Person Visit</option>
            </Select>

            <Select
              label="Call / Contact Status"
              value={followUpStatus}
              onChange={(e) => setFollowUpStatus(e.target.value as any)}
            >
              <option value="CONTACTED">Contacted</option>
              <option value="NO_ANSWER">No Answer</option>
              <option value="BUSY">Busy</option>
              <option value="PROMISED_TO_PAY">Promised to Pay</option>
              <option value="WRONG_NUMBER">Wrong Number</option>
            </Select>
          </div>

          <Input
            label="Follow-up Notes"
            placeholder="e.g. Member promised to transfer via UPI by Friday"
            value={followUpNotes}
            onChange={(e) => setFollowUpNotes(e.target.value)}
          />

          <Input
            label="Next Follow-up Date (Optional)"
            type="date"
            value={nextFollowUpDate}
            onChange={(e) => setNextFollowUpDate(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsFollowUpModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={followUpMutation.isPending}
              loadingText="Logging Follow-up..."
            >
              Save Follow-up
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
