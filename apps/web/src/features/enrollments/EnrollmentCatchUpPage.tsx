import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { enrollmentsApi } from '@/lib/api/enrollments';
import { membersApi } from '@/lib/api/members';
import { batchesApi } from '@/lib/api/batches';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/Table';
import { formatINR, formatDate } from '@/lib/utils';
import { extractErrorMessage } from '@/lib/api/client';
import { CatchUpPreview, Batch, Member, PaymentMethod } from '@/types';
import { ArrowLeft, Clock, ShieldCheck, CheckCircle2, CreditCard } from 'lucide-react';

export interface EnrollmentCatchUpPageProps {
  onNavigate: (path: string) => void;
}

export const EnrollmentCatchUpPage: React.FC<EnrollmentCatchUpPageProps> = ({ onNavigate }) => {
  const queryClient = useQueryClient();
  const [memberId, setMemberId] = useState('');
  const [batchId, setBatchId] = useState('');
  const [batchPlanId, setBatchPlanId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch members
  const { data: members = [] } = useQuery({
    queryKey: ['members-dropdown'],
    queryFn: async () => {
      const res = await membersApi.getAll({ limit: 100, isActive: true });
      return Array.isArray(res) ? res : res.data || [];
    },
  });

  // Fetch running batches
  const { data: batches = [] } = useQuery({
    queryKey: ['running-batches-dropdown'],
    queryFn: async () => {
      const res = await batchesApi.getAll({ limit: 100, status: 'RUNNING' });
      return Array.isArray(res) ? res : res.data || [];
    },
  });

  const selectedBatch = batches.find((b) => b.id === batchId);
  const availableBatchPlans = selectedBatch?.batchPlans || [];

  // Query Catch-Up Preview from Backend API
  const {
    data: preview,
    isLoading: isPreviewLoading,
    error: previewError,
    refetch: fetchPreview,
  } = useQuery({
    queryKey: ['catch-up-preview', memberId, batchId, batchPlanId],
    queryFn: () => enrollmentsApi.getCatchUpPreview(memberId, batchId, batchPlanId),
    enabled: Boolean(memberId && batchId && batchPlanId),
  });

  // Catch-Up Execution Mutation
  const executeMutation = useMutation({
    mutationFn: () =>
      enrollmentsApi.executeCatchUp(memberId, {
        batchId,
        batchPlanId,
        paymentMethod,
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      const enrollmentId = data.enrollment?.id;
      if (enrollmentId) {
        onNavigate(`/enrollments/${enrollmentId}`);
      } else {
        onNavigate('/enrollments');
      }
    },
    onError: (err) => {
      setErrorMsg(extractErrorMessage(err));
    },
  });

  return (
    <div className="max-w-4xl space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onNavigate('/enrollments')}
        icon={<ArrowLeft className="w-4 h-4" />}
      >
        Back to Enrollments
      </Button>

      <PageHeader
        title="Late / Catch-up Enrollment"
        description="Enroll a member into an in-flight running batch with backend-calculated missed dues payment"
      />

      {errorMsg && (
        <Alert variant="error" title="Catch-up Execution Failed">
          {errorMsg}
        </Alert>
      )}

      {/* Step 1: Selection Form */}
      <Card className="p-5 space-y-4">
        <h3 className="font-semibold text-sm text-slate-900 border-b border-slate-100 pb-2">
          1. Select Member & Running Batch
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select
            label="Select Member"
            value={memberId}
            onChange={(e) => {
              setMemberId(e.target.value);
              setConfirmed(false);
            }}
            required
          >
            <option value="">-- Choose Member --</option>
            {members.map((m: Member) => (
              <option key={m.id} value={m.id}>
                {m.firstName} {m.lastName} ({m.phone})
              </option>
            ))}
          </Select>

          <Select
            label="Running Batch"
            value={batchId}
            onChange={(e) => {
              setBatchId(e.target.value);
              setBatchPlanId('');
              setConfirmed(false);
            }}
            required
          >
            <option value="">-- Choose Running Batch --</option>
            {batches.map((b: Batch) => (
              <option key={b.id} value={b.id}>
                {b.name} (At Installment #{b.currentInstallment})
              </option>
            ))}
          </Select>

          <Select
            label="Batch Plan Scheme"
            value={batchPlanId}
            onChange={(e) => {
              setBatchPlanId(e.target.value);
              setConfirmed(false);
            }}
            disabled={!batchId}
            required
          >
            <option value="">-- Choose Plan --</option>
            {availableBatchPlans.map((bp) => (
              <option key={bp.id} value={bp.id}>
                {bp.planTemplate?.name || 'Plan'} ({formatINR(bp.planTemplate?.chitValue)})
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {/* Step 2: Backend-Calculated Catch-up Preview */}
      {memberId && batchId && batchPlanId && (
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div>
              <h3 className="font-semibold text-sm text-slate-900">
                2. Backend-Authoritative Catch-up Calculation
              </h3>
              <p className="text-xs text-slate-500">
                Computed via GET /api/v1/enrollments/members/:id/catch-up-preview
              </p>
            </div>
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          </div>

          {isPreviewLoading ? (
            <div className="space-y-2 py-4">
              <p className="text-xs text-slate-500">Calling backend preview API...</p>
              <div className="h-8 bg-slate-100 animate-pulse rounded" />
              <div className="h-16 bg-slate-100 animate-pulse rounded" />
            </div>
          ) : previewError ? (
            <Alert variant="error" title="Backend Calculation Error">
              {extractErrorMessage(previewError)}
            </Alert>
          ) : preview ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-md border border-slate-200">
                <div>
                  <span className="text-[11px] text-slate-500 uppercase block">
                    Current Batch Cycle
                  </span>
                  <span className="text-lg font-bold text-slate-900">
                    Installment #{preview.currentInstallment}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 uppercase block">
                    Missed Installments Covered
                  </span>
                  <span className="text-lg font-bold text-slate-900">
                    {preview.missedInstallments?.length > 0
                      ? `#${preview.missedInstallments.join(', #')}`
                      : 'None (Starting from current)'}
                  </span>
                </div>
                <div className="border-l border-slate-200 pl-4">
                  <span className="text-[11px] text-slate-500 uppercase block">
                    Authoritative Catch-up Due
                  </span>
                  <span className="text-2xl font-black text-emerald-700">
                    {formatINR(preview.totalCatchUpAmount)}
                  </span>
                </div>
              </div>

              {/* Installment breakdown table */}
              {preview.breakdown && preview.breakdown.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-700 mb-2">
                    Catch-up Payment Breakdown:
                  </h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Installment</TableHead>
                        <TableHead>Original Due Date</TableHead>
                        <TableHead className="text-right">Scheduled Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {preview.breakdown.map((item) => (
                        <TableRow key={item.installmentNumber}>
                          <TableCell className="font-mono text-xs font-semibold text-slate-900">
                            Installment #{item.installmentNumber}
                          </TableCell>
                          <TableCell className="text-xs text-slate-600">
                            {formatDate(item.dueDate)}
                          </TableCell>
                          <TableCell className="text-right text-xs font-bold text-slate-900">
                            {formatINR(item.scheduledAmount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Step 3: Payment Details */}
              <div className="pt-4 border-t border-slate-100 space-y-4">
                <h3 className="font-semibold text-sm text-slate-900">
                  3. Catch-up Collection Payment Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label="Payment Method"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  >
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI / GooglePay / PhonePe</option>
                    <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS/IMPS)</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="ONLINE">Online Portal</option>
                  </Select>

                  <Input
                    label="Transaction Reference / Cheque #"
                    placeholder="e.g. UPI-1234567890"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                  />

                  <div className="sm:col-span-2">
                    <Input
                      label="Catch-up Audit Note"
                      placeholder="e.g. Joined at month 3; paid installments 1-3 simultaneously"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </div>

                {/* Explicit confirmation */}
                <div className="p-3 bg-amber-50 rounded border border-amber-200 flex items-start gap-2 text-xs text-amber-900">
                  <input
                    type="checkbox"
                    id="catchup-confirm"
                    checked={confirmed}
                    onChange={(e) => setConfirmed(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-amber-300 text-slate-900"
                  />
                  <label htmlFor="catchup-confirm" className="cursor-pointer select-none">
                    I confirm that the member is paying the exact backend catch-up requirement of{' '}
                    <strong>{formatINR(preview.totalCatchUpAmount)}</strong> to settle installments
                    up to current cycle.
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="primary"
                    disabled={!confirmed}
                    isLoading={executeMutation.isPending}
                    loadingText="Executing Catch-up Enrollment..."
                    onClick={() => executeMutation.mutate()}
                    icon={<CreditCard className="w-4 h-4" />}
                  >
                    Confirm & Enroll Member
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </Card>
      )}
    </div>
  );
};
