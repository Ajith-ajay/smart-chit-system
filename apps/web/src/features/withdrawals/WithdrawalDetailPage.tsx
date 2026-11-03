import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { withdrawalsApi } from '@/lib/api/withdrawals';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { Alert } from '@/components/ui/Alert';
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
import { Withdrawal, WithdrawalPayout, PaymentMethod } from '@/types';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  CreditCard,
  HandCoins,
  RotateCcw,
  Plus,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

export interface WithdrawalDetailPageProps {
  withdrawalId: string;
  onNavigate: (path: string) => void;
}

export const WithdrawalDetailPage: React.FC<WithdrawalDetailPageProps> = ({
  withdrawalId,
  onNavigate,
}) => {
  const queryClient = useQueryClient();
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [approvedAmountInput, setApprovedAmountInput] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');

  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState<PaymentMethod>('BANK_TRANSFER');
  const [payoutRef, setPayoutRef] = useState('');
  const [payoutNotes, setPayoutNotes] = useState('');

  const [payoutToReverse, setPayoutToReverse] = useState<WithdrawalPayout | null>(null);

  const {
    data: withdrawal,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['withdrawal', withdrawalId],
    queryFn: () => withdrawalsApi.getById(withdrawalId),
  });

  const approveMutation = useMutation({
    mutationFn: () =>
      withdrawalsApi.approve(withdrawalId, {
        approvedAmount: approvedAmountInput ? parseFloat(approvedAmountInput) : undefined,
        notes: approvalNotes.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['withdrawal', withdrawalId] });
      queryClient.invalidateQueries({ queryKey: ['withdrawals-list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      setIsApproveModalOpen(false);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => withdrawalsApi.reject(withdrawalId, { reason: rejectReason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['withdrawal', withdrawalId] });
      queryClient.invalidateQueries({ queryKey: ['withdrawals-list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      setIsRejectModalOpen(false);
    },
  });

  const payoutMutation = useMutation({
    mutationFn: () =>
      withdrawalsApi.createPayout(withdrawalId, {
        amount: parseFloat(payoutAmount),
        paymentMethod: payoutMethod,
        reference: payoutRef.trim() || undefined,
        notes: payoutNotes.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['withdrawal', withdrawalId] });
      queryClient.invalidateQueries({ queryKey: ['withdrawals-list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      setIsPayoutModalOpen(false);
      setPayoutAmount('');
      setPayoutRef('');
      setPayoutNotes('');
    },
  });

  const reversePayoutMutation = useMutation({
    mutationFn: (reason?: string) => {
      if (!payoutToReverse) throw new Error('No payout selected');
      return withdrawalsApi.reversePayout(payoutToReverse.id, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['withdrawal', withdrawalId] });
      queryClient.invalidateQueries({ queryKey: ['withdrawals-list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      setPayoutToReverse(null);
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

  if (error || !withdrawal) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNavigate('/withdrawals')}
          icon={<ArrowLeft className="w-4 h-4" />}
        >
          Back to Withdrawals
        </Button>
        <Alert variant="error" title="Withdrawal Record Not Found">
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

  const remainingPayoutDue = (withdrawal.approvedAmount || 0) - (withdrawal.totalPaidAmount || 0);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNavigate('/withdrawals')}
          icon={<ArrowLeft className="w-4 h-4" />}
        >
          Back to Withdrawals
        </Button>

        <div className="flex items-center gap-2">
          {withdrawal.status === 'REQUESTED' && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="text-rose-600 hover:text-rose-700"
                onClick={() => setIsRejectModalOpen(true)}
                icon={<XCircle className="w-3.5 h-3.5" />}
              >
                Reject Claim
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  setApprovedAmountInput(String(withdrawal.requestedAmount));
                  setIsApproveModalOpen(true);
                }}
                icon={<CheckCircle className="w-3.5 h-3.5" />}
              >
                Approve Claim
              </Button>
            </>
          )}

          {(withdrawal.status === 'APPROVED' || withdrawal.status === 'PARTIALLY_PAID') && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                setPayoutAmount(String(Math.max(0, remainingPayoutDue)));
                setIsPayoutModalOpen(true);
              }}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Payout Tranche
            </Button>
          )}
        </div>
      </div>

      <PageHeader
        title={`Withdrawal Claim WTH-${withdrawal.id.slice(0, 8)}`}
        description={`Requested on ${formatDate(withdrawal.requestDate)} for Enrollment #${withdrawal.enrollmentId.slice(0, 8)}`}
      />

      {/* Financial Status Summary */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
          <div>
            <span className="text-xs text-slate-400 block uppercase">Claim Status</span>
            <div className="mt-1 flex items-center gap-2">
              <Badge
                variant={
                  withdrawal.status === 'FULLY_PAID' || withdrawal.status === 'APPROVED'
                    ? 'success'
                    : withdrawal.status === 'REJECTED'
                      ? 'error'
                      : 'warning'
                }
              >
                {withdrawal.status}
              </Badge>
              {withdrawal.installmentNumber && (
                <span className="text-xs text-slate-500 font-mono">
                  Cycle Month #{withdrawal.installmentNumber}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                Requested
              </span>
              <span className="text-base font-bold text-slate-900">
                {formatINR(withdrawal.requestedAmount)}
              </span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                Approved
              </span>
              <span className="text-base font-bold text-slate-900">
                {withdrawal.approvedAmount ? formatINR(withdrawal.approvedAmount) : 'Pending'}
              </span>
            </div>
            <div className="bg-emerald-50/70 p-2.5 rounded border border-emerald-200">
              <span className="text-[10px] text-emerald-800 uppercase font-semibold block">
                Paid Payouts
              </span>
              <span className="text-base font-bold text-emerald-900">
                {formatINR(withdrawal.totalPaidAmount || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Financial Integrity: Approved = Paid Payouts + Remaining */}
        {withdrawal.approvedAmount && (
          <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-3 rounded">
            <span>
              Remaining Payout Obligation:{' '}
              <strong className="text-slate-900">
                {formatINR(Math.max(0, remainingPayoutDue))}
              </strong>
            </span>
            <span className="text-emerald-700 flex items-center gap-1 font-medium">
              <ShieldCheck className="w-4 h-4" /> Approved ({formatINR(withdrawal.approvedAmount)})
              = Paid Payouts + Remaining
            </span>
          </div>
        )}

        {withdrawal.rejectReason && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-900">
            <strong>Rejection Reason:</strong> {withdrawal.rejectReason}
          </div>
        )}
      </Card>

      {/* Payouts Table (Multi-tranche distribution) */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div>
            <h3 className="font-semibold text-sm text-slate-900">Payout Tranches Distribution</h3>
            <p className="text-xs text-slate-500">
              Multi-part payouts against approved withdrawal (e.g. ₹20K + ₹15K + ₹15K)
            </p>
          </div>
          {(withdrawal.status === 'APPROVED' || withdrawal.status === 'PARTIALLY_PAID') && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setPayoutAmount(String(Math.max(0, remainingPayoutDue)));
                setIsPayoutModalOpen(true);
              }}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Payout
            </Button>
          )}
        </div>

        {!withdrawal.payouts || withdrawal.payouts.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center border border-dashed rounded-md">
            No payouts have been disbursed for this claim yet.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payout ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {withdrawal.payouts.map((po) => (
                <TableRow key={po.id}>
                  <TableCell className="font-mono text-xs font-semibold text-slate-900">
                    PO-{po.id.slice(0, 8)}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    {formatDate(po.payoutDate)}
                  </TableCell>
                  <TableCell className="text-xs text-slate-700 font-medium">
                    {po.paymentMethod}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 font-mono">
                    {po.reference || '—'}
                  </TableCell>
                  <TableCell className="text-xs font-bold text-slate-900">
                    {formatINR(po.amount)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={po.status === 'SUCCESS' ? 'success' : 'error'}>
                      {po.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {po.status === 'SUCCESS' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setPayoutToReverse(po)}
                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                        title="Reverse Payout"
                      >
                        <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reverse
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Modal: Approve Claim */}
      <Modal
        isOpen={isApproveModalOpen}
        onClose={() => setIsApproveModalOpen(false)}
        title="Approve Withdrawal Claim"
        maxWidth="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            approveMutation.mutate();
          }}
          className="space-y-4"
        >
          <Input
            label="Approved Payout Ceiling (₹)"
            type="number"
            step="0.01"
            value={approvedAmountInput}
            onChange={(e) => setApprovedAmountInput(e.target.value)}
            helperText="Defaults to full requested amount unless bid dividend discount applies."
            required
            autoFocus
          />

          <Input
            label="Approval Notes (Optional)"
            placeholder="e.g. Approved by Chit Committee for month 4 bid"
            value={approvalNotes}
            onChange={(e) => setApprovalNotes(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsApproveModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={approveMutation.isPending}
              loadingText="Approving..."
            >
              Confirm Approval
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Reject Claim */}
      <ConfirmationModal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        onConfirm={() => rejectMutation.mutate()}
        title="Reject Withdrawal Claim"
        description="Are you sure you want to reject this withdrawal request? Provide a clear justification for audit records."
        confirmText="Reject Claim"
        variant="danger"
        requireReason
        reasonLabel="Rejection Reason"
        reasonPlaceholder="e.g. Unsettled installment arrears / Incomplete guarantor verification"
        isLoading={rejectMutation.isPending}
      />

      {/* Modal: Add Payout Tranche */}
      <Modal
        isOpen={isPayoutModalOpen}
        onClose={() => setIsPayoutModalOpen(false)}
        title="Disburse Payout Tranche"
        maxWidth="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            payoutMutation.mutate();
          }}
          className="space-y-4"
        >
          <Input
            label="Tranche Payout Amount (₹)"
            type="number"
            step="0.01"
            value={payoutAmount}
            onChange={(e) => setPayoutAmount(e.target.value)}
            helperText={`Remaining approved cap: ${formatINR(Math.max(0, remainingPayoutDue))}`}
            required
            autoFocus
          />

          <Select
            label="Payout Method"
            value={payoutMethod}
            onChange={(e) => setPayoutMethod(e.target.value as PaymentMethod)}
            required
          >
            <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS/IMPS)</option>
            <option value="CHEQUE">Cheque</option>
            <option value="UPI">UPI</option>
            <option value="CASH">Cash</option>
          </Select>

          <Input
            label="Transaction UTR / Cheque #"
            placeholder="e.g. UTR-BANK-998877"
            value={payoutRef}
            onChange={(e) => setPayoutRef(e.target.value)}
          />

          <Input
            label="Payout Audit Notes"
            placeholder="e.g. Payout tranche 1 of 3"
            value={payoutNotes}
            onChange={(e) => setPayoutNotes(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsPayoutModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={payoutMutation.isPending}
              loadingText="Disbursing Payout..."
            >
              Record Payout
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Reverse Payout */}
      <ConfirmationModal
        isOpen={!!payoutToReverse}
        onClose={() => setPayoutToReverse(null)}
        onConfirm={(reason) => reversePayoutMutation.mutate(reason)}
        title="Reverse Withdrawal Payout"
        description="Are you sure you want to reverse this payout tranche? The disbursed amount will be restored to remaining due obligation."
        confirmText="Confirm Reversal"
        variant="danger"
        requireReason
        reasonLabel="Payout Reversal Reason"
        reasonPlaceholder="e.g. Bank NEFT return / Incorrect beneficiary account"
        isLoading={reversePayoutMutation.isPending}
      />
    </div>
  );
};
